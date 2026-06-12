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

import { AppShell, ProjectBadge } from '@/components/app-shell';
import { useCortexUser } from '@/hooks/use-cortex-user';

type DeskMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitationProps[];
};

export function ExecutiveDeskPage() {
  const { user, tenantId } = useCortexUser();
  const [messages, setMessages] = useState<DeskMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}. Ask about project status, blockers, or team assignments — I'll cite sources from your connected tools.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/executive-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = (await response.json()) as {
        answer?: string;
        sources?: SourceCitationProps[];
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? 'Request failed');

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer ?? '',
          sources: data.sources,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Something went wrong.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Executive Desk"
      subtitle="Cross-tool intelligence for leadership"
      badge={<ProjectBadge tenantId={tenantId} />}
      footer={
        <ChatInput
          value={input}
          onValueChange={setInput}
          onSubmit={handleAsk}
          isLoading={loading}
          placeholder="What's my latest email about? Or ask about GitHub repos, meetings, drive files…"
          variant="dark"
        />
      }
    >
      <ChatWindow variant="dark" className="h-full">
        {messages.map((message) => (
          <ChatMessage key={message.id} role={message.role} variant="dark">
            {message.role === 'assistant' && (
              <ChatMessageAvatar fallback="CX" variant="cortex" theme="dark" />
            )}
            <div className="max-w-[85%]">
              <ChatMessageContent
                markdown={message.role === 'assistant'}
                role={message.role}
                variant="dark"
              >
                {message.content}
              </ChatMessageContent>
              {message.sources && message.sources.length > 0 && (
                <SourceCitations sources={message.sources} variant="dark" />
              )}
            </div>
            {message.role === 'user' && (
              <ChatMessageAvatar fallback="You" variant="user" theme="dark" />
            )}
          </ChatMessage>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-[#14b8a6]">
            <Spinner />
            Cortex is thinking…
          </div>
        )}
      </ChatWindow>
    </AppShell>
  );
}
