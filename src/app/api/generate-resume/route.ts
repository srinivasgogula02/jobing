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

    // 2. Generate LaTeX using Vercel AI SDK
    const systemPrompt = `You are an expert resume writer and LaTeX developer. 
Your task is to create a professional, highly aesthetic LaTeX resume tailored to the provided Job Description using the user's Profile Data.
Return ONLY valid LaTeX code. Do NOT wrap it in markdown blockquotes like "\`\`\`latex". The output must start with \\documentclass and end with \\end{document}.
Escape special characters appropriately. Use a modern, clean template (e.g. standard article class with geometry and titlesec).`;

    const prompt = `
Profile Data:
${JSON.stringify(profileData, null, 2)}

Job Description:
${jobDescription}
`;

    const { text: latexCode } = await generateText({
      model: 'google/gemini-2.0-flash-lite' as any,
      system: systemPrompt,
      prompt: prompt,
    });

    // Strip markdown wrap if the model ignored instructions
    const cleanedLatex = latexCode.replace(/^```latex\n?/, '').replace(/```$/, '').trim();

    // 3. Compile LaTeX to PDF using external API (latexonline.cc)
    // We send a POST request with the 'text' body parameter or a raw payload.
    // Let's use url-encoded format for texonline.cc or formulate a multi-part.
    // Alternatively, latexonline supports GET with ?text= parameter but POST is better.
    // Form data:
    const formData = new FormData();
    formData.append('file', new Blob([cleanedLatex], { type: 'text/plain' }), 'resume.tex');
    formData.append('command', 'pdflatex');

    const pdfResponse = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      body: formData,
    });

    if (!pdfResponse.ok) {
       const errorText = await pdfResponse.text();
       console.error("LaTeX Compilation Error:", errorText);
       return new Response(JSON.stringify({ error: 'Failed to compile LaTeX to PDF', details: errorText }), { status: 500 });
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
          latex_code: cleanedLatex,
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
       latexStr: cleanedLatex
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error("Generate Resume Error:", err);
    return new Response(JSON.stringify({ error: 'Internal server error', message: err.message }), { status: 500 });
  }
}
