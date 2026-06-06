'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Mail, Reply } from 'lucide-react';
import { Markdown, Spinner, type SourceCitationProps } from '@cortex/ui';

import { AppShell, ProjectBadge } from '@/components/app-shell';
import { useCortexUser } from '@/hooks/use-cortex-user';

type ClientEmail = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  receivedAt: string;
  projectId: string;
};

const ALL_EMAILS: ClientEmail[] = [
  {
    id: 'email-1',
    from: 'Sarah Chen <sarah@acmecorp.com>',
    subject: 'Acme mobile launch — pilot timeline?',
    preview: 'When will the mobile launch be ready for our pilot users?',
    body: 'Hi team,\n\nWhen will the mobile launch be ready for our pilot users? We need a firm date for our board meeting next week.\n\nThanks,\nSarah',
    receivedAt: '2 hours ago',
    projectId: 'acme',
  },
  {
    id: 'email-2',
    from: 'Maria Santos <maria@betacorp.com>',
    subject: 'Dashboard project status?',
    preview: 'What is the status of our dashboard refresh?',
    body: 'Hello,\n\nWhat is the status of our dashboard project? We have a board meeting Friday and need an update on the CSV export fix.\n\nMaria Santos\nBetaCorp',
    receivedAt: '3 hours ago',
    projectId: 'betacorp',
  },
  {
    id: 'email-3',
    from: 'VP Ops <vp@globaldynamics.com>',
    subject: 'SSO integration timeline',
    preview: 'When can we expect SSO go-live?',
    body: 'Team,\n\nOur security team is waiting on SAML metadata. What is the revised go-live date for Global Dynamics Phase 2?\n\nRegards',
    receivedAt: 'Yesterday',
    projectId: 'global-dynamics',
  },
];

export function ClientsDeskPage() {
  const { role, projectIds } = useCortexUser();
  const inbox = useMemo(
    () => ALL_EMAILS.filter((e) => projectIds.includes(e.projectId)),
    [projectIds],
  );
  const [selectedId, setSelectedId] = useState(inbox[0]?.id ?? '');
  const [draft, setDraft] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceCitationProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null);

  const selected = inbox.find((e) => e.id === selectedId) ?? inbox[0];

  async function handleReply() {
    if (!selected) return;
    setLoading(true);
    setDraft(null);
    setApproved(false);
    try {
      const response = await fetch('/api/client-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent: selected.body, subject: selected.subject }),
      });
      const data = (await response.json()) as {
        draft?: string;
        pendingApprovalId?: string;
        sources?: SourceCitationProps[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? 'Failed to draft reply');
      setDraft(data.draft ?? '');
      setSources(data.sources ?? []);
      setPendingApprovalId(data.pendingApprovalId ?? null);
    } catch (error) {
      setDraft(error instanceof Error ? error.message : 'Failed to generate draft');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!pendingApprovalId) return;
    const response = await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pendingApprovalId, decision: 'approved' }),
    });
    if (response.ok) setApproved(true);
  }

  return (
    <AppShell
      title="Clients Desk"
      subtitle="AI-drafted replies with human approval"
      badge={<ProjectBadge projectIds={projectIds} role={role} />}
    >
      <div className="flex h-full">
        <div className="w-80 shrink-0 overflow-y-auto border-r border-[#2a2a2a] bg-[#0f0f0f] p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-600">Inbox</p>
          <ul className="space-y-2">
            {inbox.map((email) => (
              <li key={email.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(email.id);
                    setDraft(null);
                    setApproved(false);
                  }}
                  className={`w-full border p-3 text-left transition-colors duration-200 ${
                    selected?.id === email.id
                      ? 'border-[#14b8a6]/40 bg-[#14b8a6]/10'
                      : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]'
                  }`}
                >
                  <p className="truncate text-sm font-medium text-white">{email.from}</p>
                  <p className="truncate text-xs text-zinc-400">{email.subject}</p>
                  <p className="mt-1 text-[10px] text-zinc-600">{email.receivedAt}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-[#0a0a0a] p-6">
          {selected ? (
            <>
              <div className="dark-card p-5">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 size-5 text-[#14b8a6]" />
                  <div>
                    <p className="font-medium text-white">{selected.subject}</p>
                    <p className="text-sm text-zinc-500">{selected.from}</p>
                    <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">
                      {selected.body}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={loading}
                  className="btn-primary gap-2"
                >
                  <Reply className="size-4" />
                  {loading ? 'Drafting…' : 'Reply with AI'}
                </button>
              </div>
              {loading && (
                <div className="mt-4 flex items-center gap-2 text-sm text-[#14b8a6]">
                  <Spinner /> Drafting reply…
                </div>
              )}
              {draft && (
                <div className="dark-card mt-6 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#14b8a6]">
                    AI Draft
                  </p>
                  <div className="prose prose-invert prose-sm mt-3 max-w-none text-zinc-300">
                    <Markdown>{draft}</Markdown>
                  </div>
                  {!approved && pendingApprovalId && (
                    <button type="button" onClick={handleApprove} className="btn-primary mt-4">
                      Approve & Send
                    </button>
                  )}
                  {approved && (
                    <p className="mt-4 flex items-center gap-2 text-sm text-[#14b8a6]">
                      <CheckCircle2 className="size-4" /> Sent (approval workflow completed)
                    </p>
                  )}
                  {sources.length > 0 && (
                    <ul className="mt-4 space-y-1 border-t border-[#2a2a2a] pt-4 text-xs text-zinc-500">
                      {sources.map((s) => (
                        <li key={s.id}>
                          [{s.source}] {s.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-zinc-500">No emails for your project scope.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
