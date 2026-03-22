import { generateText } from 'ai';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { jobDescription } = await req.json();

    if (!jobDescription || typeof jobDescription !== 'string') {
        return new Response(JSON.stringify({ error: 'Job description is required' }), { status: 400 });
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

    // 2. Generate LaTeX BODY using Vercel AI SDK
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
\\renewcommand{\\familydefault}{\\sfdefault}
\\usepackage[left=0.5in,top=0.5in,right=0.5in,bottom=0.5in]{geometry}

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\urlstyle{same}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]
\\titlespacing*{\\section}{0pt}{10pt}{5pt}

\\begin{document}
`;
    const LATEX_FOOTER = `\n\\end{document}`;

    const systemPrompt = `You are an expert resume writer. Generate ONLY the LaTeX body content for a professional, ATS-friendly resume.

IMPORTANT: Do NOT output \\documentclass, \\usepackage, \\begin{document}, or \\end{document}. I will add those myself. Output ONLY the content that goes BETWEEN \\begin{document} and \\end{document}.

RULES:
1. ESCAPE all special LaTeX characters from user data: & becomes \\&, % becomes \\%, $ becomes \\$, # becomes \\#, _ becomes \\_. This is critical!
2. Use ONLY these commands: \\section, \\textbf, \\textit, \\href, \\small, \\begin{itemize}, \\item, \\begin{tabularx}, \\hfill, \\vspace. Do NOT invent or use any other commands.
3. Start with a centered header: Name (large bold), then contact info (phone | email | LinkedIn | GitHub) using \\href for links.
4. Include sections: Summary, Experience, Education, Skills. Use \\section{SectionName} for each.
5. For experience entries use: Job Title -- Company \\hfill Date range, then bullet points with \\begin{itemize}[leftmargin=0.15in, label={\\textbullet}].
6. Keep it single-column, clean, and ATS-parseable. No graphics, no colors, no fancy formatting.`;

    const prompt = `
Profile Data:
${JSON.stringify(profileData, null, 2)}

Job Description:
${jobDescription}
`;

    const { text: latexBody } = await generateText({
      model: 'google/gemini-3-flash' as any,
      system: systemPrompt,
      prompt: prompt,
    });

    // Strip any markdown wrapping and any \\documentclass/\\begin{document} the AI might have added despite instructions
    let cleanedBody = latexBody
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/```$/i, '')
      .replace(/\\documentclass[\s\S]*?\\begin\{document\}/, '')
      .replace(/\\end\{document\}/g, '')
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
       return new Response(JSON.stringify({ error: `Compiler Error: ${errorText}` }), { status: 500 });
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
        return new Response(JSON.stringify({ error: 'Failed to upload PDF', details: uploadError }), { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
    const pdfUrl = publicUrlData.publicUrl;

    // 5. Save Record to Resumes Table
    const { data: resumeRecord, error: insertError } = await supabase
       .from('resumes')
       .insert({
          clerk_user_id: user.id,
          job_description: jobDescription,
          latex_code: fullLatex,
          pdf_url: pdfUrl,
          job_title: "Tailored Resume" // We could also extract the job title with AI, but keeping it simple
       })
       .select()
       .single();

    if (insertError) {
        console.error("Supabase Database Error:", insertError);
        return new Response(JSON.stringify({ error: 'Failed to save resume record', details: insertError }), { status: 500 });
    }

    // 6. Return response
    return new Response(JSON.stringify({ 
       success: true, 
       pdfUrl: pdfUrl, 
       resumeId: resumeRecord.id,
       latexStr: fullLatex
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error("Generate Resume Error:", err);
    return new Response(JSON.stringify({ error: 'Internal server error', message: err.message }), { status: 500 });
  }
}
