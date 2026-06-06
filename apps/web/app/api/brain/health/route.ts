import { NextResponse } from 'next/server';

export async function GET() {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasDb = !!process.env.DATABASE_URL;

  return NextResponse.json({
    ok: true,
    brain: 'online',
    llm: {
      provider: 'groq',
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      litellm: !!process.env.LITELLM_URL,
    },
    storage: { postgres: hasDb },
    groqConfigured: hasGroq,
  });
}
