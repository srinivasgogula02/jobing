import { streamText, type ModelMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { rateLimit } from '@/lib/rate-limit';

const ALLOWED_MODELS = new Set([
    'google/gemini-2.0-flash-lite',
    'openai/gpt-4o-mini',
    'anthropic/claude-3-5-haiku-latest',
]);

// Create providers with custom base URL pointing to Vercel AI Gateway
const google = createGoogleGenerativeAI({
    baseURL: 'https://gateway.ai.vercel.com/v1',
    headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` }
});

const openai = createOpenAI({
    baseURL: 'https://gateway.ai.vercel.com/v1',
    headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` }
});

const anthropic = createAnthropic({
    baseURL: 'https://gateway.ai.vercel.com/v1',
    headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` }
});

export async function POST(req: Request) {
    try {
        const { currentUser } = await import('@clerk/nextjs/server');
        const user = await currentUser();
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        if (!rateLimit(`ai:${user.id}`, 30, 60_000)) {
            return Response.json({ error: 'Too many requests' }, { status: 429 });
        }

        const { messages, systemPrompt, model = 'google/gemini-2.0-flash-lite' } = await req.json();

        if (!Array.isArray(messages) || messages.length > 100 || JSON.stringify(messages).length > 100_000) {
            return Response.json({ error: 'Invalid or oversized messages' }, { status: 400 });
        }
        if (typeof model !== 'string' || !ALLOWED_MODELS.has(model)) {
            return Response.json({ error: 'Unsupported model' }, { status: 400 });
        }
        if (systemPrompt !== undefined && (typeof systemPrompt !== 'string' || systemPrompt.length > 8_000)) {
            return Response.json({ error: 'Invalid system prompt' }, { status: 400 });
        }

        const systemInstruction = systemPrompt?.trim() || "You are a helpful assistant.";

        let selectedModel;
        if (model.startsWith('google/')) {
            selectedModel = google(model.replace('google/', ''));
        } else if (model.startsWith('openai/')) {
            selectedModel = openai(model.replace('openai/', ''));
        } else if (model.startsWith('anthropic/')) {
            selectedModel = anthropic(model.replace('anthropic/', ''));
        } else {
            selectedModel = google('gemini-2.0-flash-lite');
        }

        const result = await streamText({
            model: selectedModel,
            system: systemInstruction,
            messages: messages as ModelMessage[],
            maxOutputTokens: 2048,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("AI Gateway Error:", error);
        return new Response(JSON.stringify({ error: "Failed to generate response." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
