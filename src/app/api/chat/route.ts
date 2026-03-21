import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

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
        const { messages, systemPrompt, model = 'google/gemini-2.0-flash-lite' } = await req.json();

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
            messages: messages as any,
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
