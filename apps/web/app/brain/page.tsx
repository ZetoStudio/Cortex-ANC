'use client';

import { useState } from 'react';
import {
  ChatInput,
  ChatMessage,
  ChatMessageAvatar,
  ChatMessageContent,
  ChatWindow,
  SourceCitations,
  Spinner,
  type SourceCitationProps,
} from '@cortex/ui';

import { AppShell } from '@/components/app-shell';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitationProps[];
  steps?: string[];
};

export default function BrainPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Brain debug chat (Groq via LiteLLM). Raw citations shown below each answer.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setMessages((p) => [...p, { id: crypto.randomUUID(), role: 'user', content: prompt }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/brain/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider: 'groq' }),
      });
      const data = (await res.json()) as {
        answer?: string;
        sources?: SourceCitationProps[];
        steps?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setMessages((p) => [
        ...p,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer ?? '',
          sources: data.sources,
          steps: data.steps,
        },
      ]);
    } catch (e) {
      setMessages((p) => [
        ...p,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: e instanceof Error ? e.message : 'Error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Brain Chat"
      subtitle="Debug hybrid RAG (Groq)"
      badge={
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
          Groq / LiteLLM
        </span>
      }
      footer={
        <ChatInput
          value={input}
          onValueChange={setInput}
          onSubmit={handleAsk}
          isLoading={loading}
          placeholder="Test retrieval: What blocks the Acme launch?"
          variant="light"
        />
      }
    >
      <ChatWindow variant="light" className="h-full">
        {messages.map((m) => (
          <ChatMessage key={m.id} role={m.role} variant="light">
            {m.role === 'assistant' && (
              <ChatMessageAvatar fallback="B" variant="cortex" theme="light" />
            )}
            <div className="max-w-[90%]">
              <ChatMessageContent markdown={m.role === 'assistant'} role={m.role} variant="light">
                {m.content}
              </ChatMessageContent>
              {m.steps && (
                <p className="mt-1 font-mono text-[10px] text-gray-400">{m.steps.join(' → ')}</p>
              )}
              {m.sources && <SourceCitations sources={m.sources} variant="light" />}
            </div>
            {m.role === 'user' && <ChatMessageAvatar fallback="Dev" variant="user" theme="light" />}
          </ChatMessage>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-teal-700">
            <Spinner /> Running brain…
          </div>
        )}
      </ChatWindow>
    </AppShell>
  );
}
