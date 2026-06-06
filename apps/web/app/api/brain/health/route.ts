import { askQuestion } from '@cortex/agent-core';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ollama = url.searchParams.get('ollama') === 'true';
  const probe = url.searchParams.get('probe') === 'true';

  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasDb = !!process.env.DATABASE_URL;

  if (probe) {
    try {
      const result = await askQuestion('Reply with exactly: OLLAMA_OK', {
        projectIds: ['acme'],
        provider: ollama ? 'ollama' : 'groq',
      });
      return NextResponse.json({
        ok: true,
        provider: ollama ? 'ollama' : 'groq',
        answer: result.answer.slice(0, 200),
      });
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'probe failed' },
        { status: 503 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    brain: 'online',
    llm: {
      provider: ollama ? 'ollama' : (process.env.LLM_PROVIDER ?? (hasGroq ? 'groq' : 'ollama')),
      litellm: !!process.env.LITELLM_URL,
    },
    storage: { postgres: hasDb },
  });
}
