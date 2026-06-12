'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, Reply, Send } from 'lucide-react';
import { Spinner, type SourceCitationProps } from '@cortex/ui';

import { AppShell, ProjectBadge } from '@/components/app-shell';
import { useCortexUser } from '@/hooks/use-cortex-user';

type ThreadSummary = {
  threadId: string;
  snippet: string;
  from: string;
  subject: string;
  date: string;
  unread: boolean;
};

type ThreadDetail = {
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
};

function formatDate(raw: string): string {
  try {
    return new Date(raw).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
}

export function EmailDeskPage() {
  const { tenantId } = useCortexUser();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [inboxError, setInboxError] = useState('');
  const [draft, setDraft] = useState('');
  const [sources, setSources] = useState<SourceCitationProps[]>([]);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendOk, setSendOk] = useState(false);

  const loadInbox = useCallback(async () => {
    setLoadingInbox(true);
    setInboxError('');
    try {
      const res = await fetch('/api/email/inbox');
      const data = (await res.json()) as ThreadSummary[] & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load inbox');
      setThreads(Array.isArray(data) ? data : []);
    } catch (e) {
      setInboxError(e instanceof Error ? e.message : 'Failed to load inbox');
      setThreads([]);
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  async function selectThread(threadId: string) {
    setSelectedId(threadId);
    setThread(null);
    setDraft('');
    setSources([]);
    setSendOk(false);
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/email/thread?threadId=${encodeURIComponent(threadId)}`);
      const data = (await res.json()) as ThreadDetail & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load email');
      setThread(data);
    } catch {
      setThread(null);
    } finally {
      setLoadingThread(false);
    }
  }

  async function handleAiReply() {
    if (!thread) return;
    setDrafting(true);
    setDraft('');
    setSendOk(false);
    try {
      const res = await fetch('/api/email/ai-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: thread.threadId,
          emailBody: thread.body,
          subject: thread.subject,
        }),
      });
      const data = (await res.json()) as {
        draft?: string;
        sources?: SourceCitationProps[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Failed to draft reply');
      setDraft(data.draft ?? '');
      setSources(data.sources ?? []);
    } catch (e) {
      setDraft(e instanceof Error ? e.message : 'Failed to draft reply');
    } finally {
      setDrafting(false);
    }
  }

  async function handleSend() {
    if (!thread || !draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: thread.threadId,
          replyText: draft,
          to: thread.from,
          subject: thread.subject,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Send failed');
      setSendOk(true);
    } catch (e) {
      setDraft(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell
      title="Email Desk"
      subtitle="Real Gmail inbox with AI-drafted replies"
      badge={<ProjectBadge tenantId={tenantId} />}
    >
      <div className="flex h-full flex-col lg:flex-row">
        <div className="flex h-64 shrink-0 flex-col border-b border-[#2a2a2a] bg-[#0f0f0f] lg:h-full lg:w-96 lg:border-b-0 lg:border-r">
          <div className="border-b border-[#2a2a2a] px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">Inbox</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {loadingInbox && (
              <div className="flex items-center gap-2 p-4 text-sm text-zinc-500">
                <Spinner /> Loading…
              </div>
            )}
            {inboxError && (
              <p className="rounded border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-300">
                {inboxError}
              </p>
            )}
            {!loadingInbox && !inboxError && threads.length === 0 && (
              <p className="p-4 text-sm text-zinc-500">No threads found.</p>
            )}
            <ul className="space-y-2">
              {threads.map((t) => (
                <li key={t.threadId}>
                  <button
                    type="button"
                    onClick={() => selectThread(t.threadId)}
                    className={`w-full border p-3 text-left transition-colors ${
                      selectedId === t.threadId
                        ? 'border-[#14b8a6]/40 bg-[#14b8a6]/10'
                        : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {t.unread && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#14b8a6]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {t.from.replace(/<.*>/, '').trim() || t.from}
                        </p>
                        <p className="truncate text-xs text-zinc-300">{t.subject}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">{t.snippet}</p>
                        <p className="mt-1 text-[10px] text-zinc-600">{formatDate(t.date)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0a]">
          {!selectedId && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-zinc-500">
              <Mail className="size-10 text-zinc-700" />
              <p className="text-sm">Select an email to read</p>
            </div>
          )}

          {selectedId && loadingThread && (
            <div className="flex flex-1 items-center justify-center gap-2 text-zinc-500">
              <Spinner /> Loading email…
            </div>
          )}

          {thread && !loadingThread && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="shrink-0 border-b border-[#2a2a2a] bg-[#0f0f0f] px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-medium text-white">{thread.subject}</p>
                    <p className="mt-1 text-sm text-zinc-500">{thread.from}</p>
                    <p className="text-xs text-zinc-600">{formatDate(thread.date)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiReply}
                    disabled={drafting}
                    className="btn-primary inline-flex shrink-0 items-center gap-2 px-5 py-2.5 text-sm font-semibold"
                  >
                    <Reply className="size-4" />
                    {drafting ? 'Drafting…' : 'Reply with AI'}
                  </button>
                </div>

                {(drafting || draft) && (
                  <div className="mt-4 border border-[#14b8a6]/20 bg-[#0a1a18] p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#14b8a6]">
                      Your reply
                    </p>
                    {drafting ? (
                      <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                        <Spinner /> Generating draft…
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={6}
                          className="mt-3 w-full resize-y border border-[#2a2a2a] bg-[#111] p-3 text-sm text-zinc-200 outline-none focus:border-[#14b8a6]/50"
                        />
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleSend}
                            disabled={sending || !draft.trim()}
                            className="btn-primary inline-flex items-center gap-2 px-5 py-2"
                          >
                            <Send className="size-4" />
                            {sending ? 'Sending…' : 'Send'}
                          </button>
                          {sendOk && <span className="text-sm text-emerald-400">Sent.</span>}
                        </div>
                        {sources.length > 0 && (
                          <p className="mt-2 text-[10px] text-zinc-600">
                            Sources: {sources.map((s) => s.title).join(' · ')}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="dark-card p-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-600">
                    Message
                  </p>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">
                    {thread.body || '(empty body)'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
