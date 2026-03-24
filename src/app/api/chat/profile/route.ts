import { streamText, generateText } from 'ai';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { deepMerge, sanitizeProfileData, computeCompletionScore } from '@/lib/profileConfig';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Helper: save profile data to Supabase
async function saveProfileToSupabase(
  supabase: any,
  userId: string,
  currentProfile: Record<string, any>,
  newData: Record<string, any>
) {
  const sanitized = sanitizeProfileData(newData) as Record<string, unknown>;
  const mergedProfile = deepMerge(currentProfile, sanitized);

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      clerk_user_id: userId,
      profile_data: mergedProfile,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'clerk_user_id' });

  if (error) {
    console.error('Failed to update profile:', error);
    return false;
  }
  console.log('Profile updated successfully');
  return true;
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length > 100) {
    return new Response('Too many messages or invalid format', { status: 400 });
  }

  const totalLength = JSON.stringify(messages).length;
  if (totalLength > 100000) {
    return new Response('Payload too large', { status: 413 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch current profile data to provide as context
  let currentProfile: Record<string, any> = {};
  try {
    const { data: profileRecord } = await supabase
      .from('user_profiles')
      .select('profile_data')
      .eq('clerk_user_id', user.id)
      .single();
    
    if (profileRecord?.profile_data) {
      currentProfile = profileRecord.profile_data;
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
  }

  // Compute which mandatory fields are still missing
  const completion = computeCompletionScore(currentProfile);
  const missingFieldsList = completion.missing.map((f) => `- ${f.label} (key: "${f.key}")`).join('\n');
  const completionInfo = completion.missing.length > 0
    ? `\n\nMANDATORY FIELDS STILL MISSING (${completion.score}/${completion.total} complete):\n${missingFieldsList}\n\nIMPORTANT GUIDANCE BEHAVIOR:\n- You MUST proactively ask the user about these missing fields.\n- After acknowledging what the user tells you, ALWAYS guide them toward the next missing field.\n- For example, after they provide education info, say something like: "Great! Now let's add your work experience — tell me about your most recent role."\n- If the user seems done or says they don't know what else to add, remind them of the specific missing fields by name.\n- Be encouraging and specific — don't just say "what else?" — say "I still need your [specific missing field]. Can you tell me about that?"\n- Prioritize collecting the missing mandatory fields before asking about optional info.\n- When ALL mandatory fields are filled, congratulate them and let them know they can now create a resume.`
    : '\n\nAll mandatory fields are complete! The user can now create a resume. If they want to add more, help them with any additional info (certifications, languages, projects, etc).';

  const systemPrompt = `You are a helpful and professional AI assistant tasked with building the user's resume profile.

Current Profile Data: ${JSON.stringify(currentProfile)}
${completionInfo}

Your goal is to converse with the user, extract important details, and save them into a flexible JSON profile.

IMPORTANT — DYNAMIC DATA:
The profile is NOT limited to a fixed set of fields. You should store ANY information the user provides under a sensible JSON key. Common keys include:
- education (array of objects with degree, school/university, year, field, gpa, etc.)
- experience (array of objects with role/title, company, dates, description, etc.)
- projects (array of objects with name, description, technologies, link, etc.)
- skills (array of strings)
- objective (string — summary/objective statement)
- contactInfo (object with email, phone, linkedin, github, website, address, etc.)

But you can also create new keys for ANY data the user provides, such as:
- certifications (array of objects with name, issuer, year, etc.)
- languages (array of objects with language, proficiency, etc.)
- publications (array of objects with title, journal, year, etc.)
- volunteerWork (array of objects with role, organization, dates, etc.)
- awards (array of objects with name, issuer, year, etc.)
- hobbies (array of strings)
- testScores (array of objects with test, score, date, etc.)
- courses (array of objects with name, provider, year, etc.)
- portfolioLinks (array of objects with label, url, etc.)
- Or any other relevant category!

Use camelCase keys. Group related information logically.

CRITICAL INSTRUCTIONS FOR SAVING DATA:
- Whenever the user provides ANY piece of profile information — even a single field like just their name, a single skill, or one school — you MUST IMMEDIATELY include a JSON block in your response wrapped EXACTLY like this:
  <<<PROFILE_UPDATE>>>
  { ...complete merged profile... }
  <<<END_PROFILE_UPDATE>>>
- Do NOT wait until you have collected all fields in a section before saving. Save EVERY piece of data the moment it is provided. For example, if the user says "my name is Srinivas", immediately save {"contactInfo": {"name": "Srinivas"}} merged with existing data.
- The JSON must be a COMPLETE profile object that merges the NEW information with the EXISTING profile data shown above. Always preserve all existing data and only add/modify what the user just mentioned.
- Do NOT show this JSON block to the user in your conversational text. Place it at the very end of your response, after all conversational text.
- ONLY skip the JSON block if the user is asking a question, chatting casually, or not providing any factual profile information at all.
- When in doubt, ALWAYS include the JSON block. It is better to save redundantly than to lose data.

CONVERSATION STYLE:
- Be concise, friendly, and act as a professional resume building assistant.
- When the user gives you information, acknowledge it conversationally.
- ALWAYS proactively guide the user to the next missing field — don't wait for them to ask.
- Ask one thing at a time. Don't overwhelm with multiple questions.
- If the user provides partial info, ask clarifying follow-ups (e.g. "What years were you at MIT?")
- Use encouraging language like "Great!", "Perfect!", "That's really impressive!"`;

  // Convert UIMessages to CoreMessages format
  const coreMessages = messages.map((m: any) => {
    let content = '';
    if (typeof m.content === 'string') {
      content = m.content;
    } else if (Array.isArray(m.parts)) {
      content = m.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
    } else if (typeof m.content === 'object' && Array.isArray(m.content)) {
      content = m.content
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
    }
    return { role: m.role, content };
  });

  // Get the last user message for fallback extraction
  const lastUserMessage = [...coreMessages].reverse().find((m: any) => m.role === 'user')?.content || '';

  const result = streamText({
    model: 'google/gemini-2.0-flash-lite' as any,
    messages: coreMessages,
    system: systemPrompt,
    onFinish: async ({ text }) => {
      // PRIMARY: Try to extract the PROFILE_UPDATE block from the AI response
      try {
        const match = text.match(/<<<PROFILE_UPDATE>>>([\s\S]*?)<<<END_PROFILE_UPDATE>>>/);
        if (match && match[1]) {
          const profileJson = match[1].trim();
          const rawProfile = JSON.parse(profileJson);
          await saveProfileToSupabase(supabase, user!.id, currentProfile, rawProfile);
          return; // Success — no fallback needed
        }
      } catch (err) {
        console.error('Error extracting primary profile update:', err);
      }

      // FALLBACK: The model didn't emit the structured block (common with lightweight models).
      // Use a focused extraction call to pull any profile data from the conversation.
      try {
        if (!lastUserMessage.trim()) return;

        console.log('[Profile Fallback] No PROFILE_UPDATE block found, running extraction fallback...');

        const extractionResult = await generateText({
          model: 'google/gemini-2.0-flash-lite' as any,
          system: `You are a JSON extractor. You receive a user message from a resume-building conversation and the AI assistant's response. Your ONLY job is to extract any NEW profile information the user provided and return it as a JSON object.

Existing profile: ${JSON.stringify(currentProfile)}

Rules:
- Return ONLY valid JSON, no markdown, no explanation, no backticks.
- Merge new data with the existing profile shown above. Preserve ALL existing data.
- Common keys: contactInfo (object), education (array), experience (array), skills (array), projects (array), objective (string), certifications (array), languages (array).
- If the user provided a name, put it in contactInfo.name. If email, in contactInfo.email. Etc.
- If the user provided NO new profile information (just asking questions or chatting), return exactly: {}
- Return the COMPLETE merged profile with the new data added.`,
          prompt: `User message: "${lastUserMessage}"\n\nAssistant response: "${text.replace(/<<<PROFILE_UPDATE>>>[\s\S]*?<<<END_PROFILE_UPDATE>>>/g, '').trim()}"`,
        });

        const extracted = extractionResult.text.trim();
        // Clean any markdown wrapping the model might add
        const cleaned = extracted.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
        
        if (cleaned && cleaned !== '{}') {
          const parsedProfile = JSON.parse(cleaned);
          if (Object.keys(parsedProfile).length > 0) {
            await saveProfileToSupabase(supabase, user!.id, currentProfile, parsedProfile);
            console.log('[Profile Fallback] Successfully saved extracted data');
          }
        }
      } catch (fallbackErr) {
        console.error('[Profile Fallback] Error in fallback extraction:', fallbackErr);
      }
    },
  });

  return result.toTextStreamResponse();
}
