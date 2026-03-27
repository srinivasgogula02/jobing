-- Create the blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    keywords TEXT,
    permalink TEXT UNIQUE NOT NULL,
    published BOOLEAN DEFAULT true NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to published blogs
CREATE POLICY "Public profiles are viewable by everyone."
    ON public.blogs FOR SELECT
    USING ( published = true );

-- Insert test data
INSERT INTO public.blogs (title, description, content, image_url, keywords, permalink, published)
VALUES 
(
    'How to Defeat the ATS and Get Your Resume Seen by Human Eyes',
    'Applicant Tracking Systems (ATS) reject 75% of resumes before a human ever sees them. Learn how to optimize your resume to beat the bots and secure that interview.',
    '# How to Defeat the ATS

If you''ve been applying to dozens of jobs online and hearing nothing but crickets, you might not be underqualified. You might just be failing the robot test.

Applicant Tracking Systems (ATS) are software applications used by 99% of Fortune 500 companies to filter applications automatically based on keywords, skills, and formatting. Here is how to make sure your resume passes the test.

## 1. Use EXACT Keywords
The ATS is not always smart enough to understand synonyms. If the job description asks for "Customer Service," do not write "Client Relations." **Mirror the language** of the job description as closely as possible without lying.

## 2. Keep the Formatting Simple
Avoid complex templates, columns, graphics, and bizarre fonts. These confuse the ATS parsing software. Stick to a standard, single-column layout using standard fonts like Ariel, Calibri, or Instrument Sans. 

## 3. Standard Headings
Use recognizable section headings. The AI looks for headings like "Experience," "Education," and "Skills." If you get creative and write "My Journey" instead of "Experience," the system might skip all your hard work entirely.

## How Jobing AI Helps
Jobing AI is designed specifically to analyze a job description and automatically weave those specific keywords naturally into your existing experience, outputting a perfectly clean, ATS-readable PDF format.',
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
    'ATS, Applicant Tracking System, resume optimization, job search tips, keyword matching',
    'how-to-defeat-ats',
    true
),
(
    'The 3 Biggest Resume Mistakes Junior Developers Make',
    'Breaking into tech is incredibly competitive. Avoid these three common resume pitfalls that scream "amateur" to hiring managers and recruiters.',
    '# The 3 Biggest Resume Mistakes Junior Developers Make

The junior developer market is saturated. To stand out, your resume needs to demonstrate not just that you know how to code, but that you know how to work professionally. Here are the three most common mistakes you should avoid.

## Mistake #1: Listing 25+ Technologies
We''ve all seen it: the skills section that lists every single language, framework, and library the candidate has ever heard of. HTML, CSS, React, Angular, Vue, Python, Java, C++, Ruby, Rust... the list goes on. 

**Why it''s bad:** Hiring managers know you aren''t an expert in 15 languages right out of a bootcamp. It looks dishonest.
**The Fix:** Only list technologies you are comfortable using in a technical interview tomorrow. Categorize them into "Proficient" and "Familiar."

## Mistake #2: Vague Project Descriptions
"Built a weather app using React." Okay... but why? How? What challenges did you face?

**Why it''s bad:** It doesn''t tell the hiring manager anything about your problem-solving skills or the complexity of the project.
**The Fix:** Use the STAR method (Situation, Task, Action, Result) or at least explain the *impact* of your project. "Developed a React-based weather dashboard utilizing the OpenWeather API, decreasing average load times by 20% through efficient state management."

## Mistake #3: Ignoring the "Soft Skills"
Coding is only half the job. The other half is communication, teamwork, and planning.

**Why it''s bad:** Companies don''t want brilliant jerks or developers who can''t explain their technical decisions to non-technical stakeholders.
**The Fix:** Highlight leadership, teamwork, cross-functional collaboration, and communication skills in your bullet points.

By focusing on depth rather than breadth and clearly communicating your impact, your resume will instantly jump to the top of the pile.',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    'junior developer, resume mistakes, tech resume, software engineering, career advice',
    'junior-developer-resume-mistakes',
    true
)
ON CONFLICT (permalink) DO NOTHING;
