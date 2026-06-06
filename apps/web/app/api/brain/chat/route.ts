import { askQuestion } from '@cortex/agent-core';
import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth';

export const POST = withAuth(
  async (request, { user }) => {
    try {
      const body = (await request.json()) as {
        prompt?: string;
        provider?: 'groq' | 'ollama';
      };

      if (!body.prompt?.trim()) {
        return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
      }

      const result = await askQuestion(body.prompt.trim(), {
        projectIds: user.projectIds,
        provider: body.provider,
      });

      return NextResponse.json({
        answer: result.answer,
        sources: result.sources,
        steps: result.steps,
        citationsFormatted: result.citationsFormatted,
        provider: body.provider ?? 'groq',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  },
  ['brain:debug'],
);
