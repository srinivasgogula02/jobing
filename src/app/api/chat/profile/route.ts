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
  return true;
}

// Helper: detect if a user message is likely just casual chat (not profile data)
function isLikelyCasualMessage(msg: string): boolean {
  const trimmed = msg.trim().toLowerCase();
  if (trimmed.length < 3) return true;
  const casualPatterns = [
    /^(hi|hey|hello|yo|sup|thanks|thank you|ok|okay|cool|nice|great|yes|no|sure|got it|done|bye|nope|yep|yeah|hmm|hm|idk|lol|haha)\.?!?$/i,
    /^(what|how|why|when|where|can you|could you|do you|is it|are you|will you)\b/i,
  ];
  return casualPatterns.some((p) => p.test(trimmed));
}

// Helper: strip PROFILE_UPDATE blocks from message content to save tokens
function stripProfileBlocks(content: string): string {
  return content.replace(/<<<PROFILE_UPDATE>>>[\s\S]*?<<<END_PROFILE_UPDATE>>>/g, '').trim();
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
  const missingFieldsList = completion.missing.map((f) => `${f.label} ("${f.key}")`).join(', ');
  const completionInfo = completion.missing.length > 0
    ? `\nMISSING FIELDS (${completion.score}/${completion.total}): ${missingFieldsList}\nProactively guide user to fill these. After each answer, ask about the next missing field. Be specific and encouraging.`
    : '\nAll fields complete! Help with optional info (certifications, languages, projects).';

  // Compact system prompt — every token here is sent on EVERY request
  const systemPrompt = `You are a concise, friendly resume profile builder.

Profile: ${JSON.stringify(currentProfile)}
${completionInfo}

Store data under camelCase keys: contactInfo (object), education (array), experience (array), skills (array), objective (string), projects (array), certifications (array), languages (array), etc.

SAVING: When user provides ANY profile info (even just a name), append this at the END of your response:
<<<PROFILE_UPDATE>>>
{...merged profile JSON with ALL existing + new data...}
<<<END_PROFILE_UPDATE>>>
Save immediately for ANY piece of data. Don't wait for complete sections. Skip block ONLY for pure questions/chat.

STYLE: Acknowledge info briefly, then ask about the next missing field. One question at a time.`;

  // Convert UIMessages to CoreMessages format, STRIPPING profile blocks from history
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
    // Strip PROFILE_UPDATE blocks from assistant messages to save tokens
    if (m.role === 'assistant') {
      content = stripProfileBlocks(content);
    }
    return { role: m.role, content };
  });

  // Get the last user message for fallback extraction
  const lastUserMessage = [...coreMessages].reverse().find((m: any) => m.role === 'user')?.content || '';

  const result = streamText({
    model: 'google/gemini-2.0-flash-lite' as any,
    messages: coreMessages,
    system: systemPrompt,
    maxOutputTokens: 1024,
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

      // FALLBACK: Only run if user message likely contains profile data
      if (!lastUserMessage.trim() || isLikelyCasualMessage(lastUserMessage)) {
        return; // Skip fallback for trivial messages — saves tokens
      }

      try {
        console.log('[Profile Fallback] Running extraction...');

        const extractionResult = await generateText({
          model: 'google/gemini-2.0-flash-lite' as any,
          maxOutputTokens: 512,
          system: `Extract profile data from a user message. Return ONLY valid JSON. Existing profile: ${JSON.stringify(currentProfile)}
Keys: contactInfo(object), education(array), experience(array), skills(array), objective(string), projects(array), certifications(array), languages(array).
Merge new data with existing. If no profile info found, return {}`,
          prompt: `User said: "${lastUserMessage}"`,
        });

        const extracted = extractionResult.text.trim()
          .replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
        
        if (extracted && extracted !== '{}') {
          const parsedProfile = JSON.parse(extracted);
          if (Object.keys(parsedProfile).length > 0) {
            await saveProfileToSupabase(supabase, user!.id, currentProfile, parsedProfile);
          }
        }
      } catch (fallbackErr) {
        console.error('[Profile Fallback] Error:', fallbackErr);
      }
    },
  });

  return result.toTextStreamResponse();
}
