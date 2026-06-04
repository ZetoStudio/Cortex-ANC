import { NextResponse } from 'next/server';

export async function GET() {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasDb = !!process.env.DATABASE_URL;
  const provider = process.env.LLM_PROVIDER ?? (hasGroq ? 'groq' : 'ollama');

  return NextResponse.json({
    ok: true,
    brain: 'online',
    llm: {
      provider,
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      litellm: !!process.env.LITELLM_URL,
    },
    storage: {
      postgres: hasDb,
      vectorFallback: !hasDb,
    },
  });
}
