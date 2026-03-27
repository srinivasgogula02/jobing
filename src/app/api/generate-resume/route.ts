import { generateText } from 'ai';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  let creditDeducted = false;
  let userIdForRefund: string | null = null;

  try {
    const user = await currentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    userIdForRefund = user.id;

    const { jobDescription } = await req.json();

    if (!jobDescription || typeof jobDescription !== 'string') {
        return new Response(JSON.stringify({ error: 'Job description is required' }), { status: 400 });
    }
    if (jobDescription.length > 15000) {
        return new Response(JSON.stringify({ error: 'Job description is too long (max 15000 characters)' }), { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch User Profile
    const { data: profileRecord, error: profileError } = await supabase
      .from('user_profiles')
      .select('profile_data')
      .eq('clerk_user_id', user.id)
      .single();

    if (profileError || !profileRecord?.profile_data) {
       return new Response(JSON.stringify({ error: 'Profile not found. Please complete your profile first.' }), { status: 404 });
    }

    const profileData = profileRecord.profile_data;

    // Fetch credits
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.credits < 1) {
       return new Response(JSON.stringify({ error: 'Insufficient credits. Please upgrade to generate more resumes.', code: 'INSUFFICIENT_CREDITS' }), { status: 402 });
    }

    // 2. Deduct credit immediately to prevent race conditions
    const { error: initialDeductError } = await supabase
       .from('users')
       .update({ credits: userData.credits - 1 })
       .eq('id', user.id);
       
    if (initialDeductError) {
        return new Response(JSON.stringify({ error: 'Failed to process credit deduction' }), { status: 500 });
    }
    creditDeducted = true;

    // In freemium mode: if credits just hit 0 and user has no subscription, revoke access
    const newCredits = userData.credits - 1;
    if (newCredits <= 0) {
      const pricingMode = process.env.NEXT_PUBLIC_PRICING_MODE || 'paywall';
      if (pricingMode === 'freemium') {
        // Check if they have an active subscription (paid users keep access regardless)
        const { data: userRow } = await supabase
          .from('users')
          .select('current_subscription_id')
          .eq('id', user.id)
          .single();

        if (!userRow?.current_subscription_id) {
          // No subscription + no credits = revoke freemium access via Clerk
          try {
            const client = await clerkClient();
            await client.users.updateUserMetadata(user.id, {
              publicMetadata: { has_credits: false }
            });
            console.log(`[Freemium] Credits exhausted for ${user.id}, synced has_credits=false`);
          } catch (clerkErr) {
            console.error('[Freemium] Error syncing has_credits=false:', clerkErr);
          }
        }
      }
    }

    // 3. Generate LaTeX BODY using Vercel AI SDK
    // The preamble is hardcoded below to guarantee compilation. The AI only writes the body.
    const LATEX_PREAMBLE = `\\documentclass[11pt,a4paper]{article}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}
\\usepackage{xcolor}
\\usepackage{helvet}
\\usepackage{setspace}
\\renewcommand{\\familydefault}{\\sfdefault}
\\usepackage[margin=0.6in]{geometry}

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\urlstyle{same}

\\setstretch{1.15} % Beautiful line height to prevent clunky text

\\titleformat{\\section}{\\scshape\\raggedright\\large\\bfseries}{}{0em}{}[\\color{black}\\titlerule]
\\titlespacing*{\\section}{0pt}{14pt}{8pt}

\\begin{document}
`;
    const LATEX_FOOTER = `\n\\end{document}`;

    const systemPrompt = `You are an expert executive resume writer and ATS-optimization specialist. Your SOLE PURPOSE is to generate an incredibly high-converting resume perfectly tailored to the provided Job Description (JD). 

CRITICAL TAILORING INSTRUCTIONS (OUR CORE VALUE PROP):
1. You MUST deeply analyze the JD and actively REWRITE, FILTER, and REORDER the user's Profile Data to perfectly match the role's requirements and keywords. 
2. Do NOT just blindly copy-paste their profile. Be ruthless: drop entirely irrelevant experiences/skills, and expand upon the ones the JD explicitly asks for.
3. Every bullet point MUST be action-oriented, metrics-driven, and rewritten to definitively prove the candidate can solve the specific problems outlined in the JD.

LATEX RULES:
1. Outputs ONLY the content that goes BETWEEN \\begin{document} and \\end{document}.
2. ESCAPE all special LaTeX characters: & becomes \\&, % becomes \\%, $ becomes \\$, # becomes \\#, _ becomes \\_.
3. You MUST use the exact beautiful, well-spaced structural skeleton below. Fill in the brackets with the aggressively tailored data. DO NOT invent new commands.

REQUIRED SKELETON (Observe the spacing strictness):

\\begin{center}
    {\\Huge \\scshape \\textbf{[NAME]}} \\\\ \\vspace{6pt}
    \\small [PHONE] $|$ \\href{mailto:[EMAIL]}{\\underline{[EMAIL]}} $|$ 
    \\href{[LINKEDIN_URL]}{\\underline{[LINKEDIN_TEXT]}} $|$
    \\href{[GITHUB_URL]}{\\underline{[GITHUB_TEXT]}}
\\end{center}

\\vspace{6pt}
\\section{Profile Summary}
[Write a powerful, 4-sentence summary perfectly tailored to the Job Description. The setstretch logic handles the line height beautifully.]

\\section{Experience}

% Copy this block for each highly relevant job:
\\noindent
\\textbf{[JOB TITLE]} \\hfill [START DATE] -- [END DATE] \\\\
{\\color{gray}\\textit{[COMPANY NAME], [LOCATION]}}
\\vspace{6pt}
\\begin{itemize}[leftmargin=0.15in, label={\\textbullet}]
  \\setlength{\\itemsep}{4pt}
  \\item [Highly tailored, action-oriented bullet point emphasizing impact and metrics matching the JD]
  \\item [Another perfectly tailored bullet point]
\\end{itemize}
\\vspace{8pt}

\\section{Education}
\\noindent
\\textbf{[DEGREE]} \\hfill [START DATE] -- [END DATE] \\\\
\\textit{[INSTITUTION], [LOCATION]} \\hfill \\textit{[GPA IF APPLICABLE]}
\\vspace{8pt}

\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
    \\setlength{\\itemsep}{2pt}
    \\item \\textbf{Languages}{: [Comma separated, prioritized by JD]}
    \\item \\textbf{Frameworks & Tools}{: [Comma separated, prioritized by JD]}
\\end{itemize}`;

    const prompt = `
Profile Data:
${JSON.stringify(profileData, null, 2)}

Job Description:
${jobDescription}
`;

    // Run LaTeX generation and job-title extraction in parallel for zero latency impact
    const [latexResult, metaResult] = await Promise.all([
      generateText({
        model: 'google/gemini-3-flash' as any,
        system: systemPrompt,
        prompt: prompt,
      }),
      generateText({
        model: 'google/gemini-3-flash' as any,
        system: `You extract structured metadata from job descriptions. Respond ONLY with valid JSON, no markdown.`,
        prompt: `Extract from this job description:
1. "title": A short, clear job title including the company if mentioned (e.g. "Senior Frontend Engineer @ Stripe"). Max 60 chars.
2. "summary": A single-sentence summary of the role's focus (e.g. "Build scalable React apps for the payments dashboard"). Max 120 chars.

Job Description:
${jobDescription.slice(0, 2000)}

Respond ONLY with JSON: {"title": "...", "summary": "..."}`,
      }).catch(() => null), // Non-critical — we fall back gracefully
    ]);

    const { text: latexBody } = latexResult;

    // Parse the extracted metadata, with safe fallbacks
    let extractedTitle = '';
    let extractedSummary = '';
    try {
      if (metaResult?.text) {
        const cleaned = metaResult.text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
        const meta = JSON.parse(cleaned);
        extractedTitle = (meta.title || '').slice(0, 80);
        extractedSummary = (meta.summary || '').slice(0, 200);
      }
    } catch {
      // JSON parse failed — use fallback below
    }

    // Fallback: derive a title from the first meaningful line of the JD
    if (!extractedTitle) {
      const firstLine = jobDescription.trim().split('\n').find(l => l.trim().length > 5);
      extractedTitle = firstLine ? firstLine.trim().slice(0, 60) : 'Tailored Resume';
    }

    // Strip any markdown wrapping and any \\documentclass/\\begin{document} the AI might have added despite instructions
    let cleanedBody = latexBody
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/```$/i, '')
      .replace(/\\documentclass[^]*?\\begin\\{document\\}/, '')
      .replace(/\\end\\{document\\}/g, '')
      .replace(/\\usepackage(?:\\[.*?\\])?\\{.*?\\}/g, '') // Strip rogue usepackages
      .replace(/₹/g, 'Rs. ') // Fix Indian Rupee symbol crashes
      .replace(/[\u2018\u2019]/g, "'") // Normalize smart single quotes
      .replace(/[\u201C\u201D]/g, '"') // Normalize smart double quotes
      .replace(/[\u2013\u2014]/g, '--') // Convert en/em dashes to LaTeX dashes
      .replace(/\u200B/g, '') // Remove zero-width spaces
      .trim();

    // Assemble the full LaTeX document with our hardcoded preamble
    const fullLatex = LATEX_PREAMBLE + cleanedBody + LATEX_FOOTER;

    // 3. Compile LaTeX to PDF using our VPS microservice
    const compilerUrl = process.env.COMPILER_SERVICE_URL || 'http://localhost:4000/api/compile';
    const compilerApiKey = process.env.COMPILER_API_KEY || 'default_dev_secret_key';

    const pdfResponse = await fetch(compilerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${compilerApiKey}`
      },
      body: JSON.stringify({ latex: fullLatex }),
    });

    if (!pdfResponse.ok) {
       let errorText = await pdfResponse.text();
       try {
           const parsed = JSON.parse(errorText);
           errorText = parsed.error || errorText;
           if (parsed.details) errorText += ` (${parsed.details})`;
       } catch (e) {}
       console.error("LaTeX Compilation Error:", errorText);
       throw new Error(`Compiler Error: ${errorText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    // 4. Upload PDF to Supabase Storage
    const fileName = `resume_${user.id}_${Date.now()}.pdf`;
    const { error: uploadError } = await supabase
       .storage
       .from('resumes')
       .upload(fileName, pdfBuffer, {
         contentType: 'application/pdf',
         upsert: false
       });

    if (uploadError) {
        console.error("Supabase Storage Error:", uploadError);
        throw new Error('Failed to upload PDF');
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
    const pdfUrl = publicUrlData.publicUrl;

    // 5. Save Record to Resumes Table
    const { data: resumeRecord, error: insertError } = await supabase
       .from('resumes')
       .insert({
          clerk_user_id: user.id,
           job_description: extractedSummary || jobDescription.slice(0, 300),
           latex_code: fullLatex,
           pdf_url: pdfUrl,
           job_title: extractedTitle
       })
       .select()
       .single();

    if (insertError) {
        console.error("Supabase Database Error:", insertError);
        throw new Error('Failed to save resume record');
    }

    // Return response
    return new Response(JSON.stringify({ 
       success: true, 
       pdfUrl: pdfUrl, 
       resumeId: resumeRecord.id,
       latexStr: fullLatex
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error("Generate Resume Error:", err);
    
    // Attempt to refund credit if we deducted it
    try {
        if (creditDeducted && userIdForRefund) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const { data: currentUsr } = await supabase.from('users').select('credits').eq('id', userIdForRefund).single();
            if (currentUsr) {
                await supabase.from('users').update({ credits: currentUsr.credits + 1 }).eq('id', userIdForRefund);
            }
        }
    } catch (refundErr) {
        console.error("Failed to refund credit:", refundErr);
    }

    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { status: 500 });
  }
}
