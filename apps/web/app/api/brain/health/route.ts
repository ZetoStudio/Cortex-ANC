import { NextResponse } from 'next/server';

export async function GET() {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasDb = !!process.env.DATABASE_URL;

  return NextResponse.json({
    ok: true,
    brain: 'online',
    llm: {
      primary: process.env.LITELLM_MODEL ?? 'cortex-groq',
      fallback: hasGemini ? (process.env.LITELLM_FALLBACK_MODEL ?? 'cortex-gemini') : null,
      litellm: !!process.env.LITELLM_URL,
    },
    storage: { postgres: hasDb },
    groqConfigured: hasGroq,
    geminiConfigured: hasGemini,
  });
}
