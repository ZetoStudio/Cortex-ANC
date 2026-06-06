'use client';

import React from 'react';

import { cn } from '../lib/utils';
import { Markdown } from './markdown';

export function ChatMessage({
  children,
  className,
  role = 'assistant',
}: {
  children: React.ReactNode;
  className?: string;
  role?: 'user' | 'assistant' | 'system';
  variant?: 'dark' | 'light';
}) {
  return (
    <div
      className={cn(
        'animate-fade-in flex gap-3',
        role === 'user' ? 'justify-end' : 'justify-start',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ChatMessageAvatar({
  fallback,
  className,
  variant = 'default',
  theme = 'dark',
}: {
  fallback: string;
  className?: string;
  variant?: 'default' | 'user' | 'cortex';
  theme?: 'dark' | 'light';
}) {
  const styles = {
    default: 'border border-white/10 bg-[#1a1d2e] text-[#cbd5e1]',
    user:
      theme === 'light'
        ? 'bg-[#111111] text-white'
        : 'bg-[#2a2a2a] text-white border border-[#3a3a3a]',
    cortex:
      theme === 'light'
        ? 'border border-teal-200 bg-teal-50 text-teal-800'
        : 'border border-[#14b8a6]/40 bg-[#14b8a6]/10 text-[#14b8a6]',
  };
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        styles[variant],
        className,
      )}
    >
      {fallback}
    </div>
  );
}

export function ChatMessageContent({
  children,
  markdown = false,
  className,
  role = 'assistant',
  variant = 'dark',
}: {
  children: React.ReactNode;
  markdown?: boolean;
  className?: string;
  role?: 'user' | 'assistant';
  variant?: 'dark' | 'light';
}) {
  const base = cn(
    'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words',
    variant === 'light'
      ? role === 'user'
        ? 'bg-[#111111] text-white'
        : 'border border-gray-200 bg-white text-gray-800 shadow-sm'
      : role === 'user'
        ? 'bg-[#2a2a2a] text-white border border-[#3a3a3a]'
        : 'border border-[#2a2a2a] bg-[#1a1a1a] text-[#d1d5db]',
    className,
  );

  if (markdown && typeof children === 'string') {
    return (
      <div className={base}>
        <Markdown>{children}</Markdown>
      </div>
    );
  }

  return <div className={base}>{children}</div>;
}

export type SourceCitationProps = {
  id: string;
  title: string;
  source: string;
  excerpt?: string;
};

export function SourceCitations({
  sources,
  variant = 'dark',
}: {
  sources: SourceCitationProps[];
  variant?: 'dark' | 'light';
}) {
  if (!sources.length) return null;

  return (
    <div
      className={cn(
        'mt-2 space-y-1.5 rounded-xl p-3',
        variant === 'light' ? 'border border-gray-200 bg-gray-50' : 'glass',
      )}
    >
      <p
        className={cn(
          'font-mono text-[10px] uppercase tracking-wider',
          variant === 'light' ? 'text-teal-700' : 'text-[#14b8a6]',
        )}
      >
        Sources
      </p>
      <ul className="space-y-1">
        {sources.map((source) => (
          <li
            key={source.id}
            className={cn('text-xs', variant === 'light' ? 'text-gray-600' : 'text-zinc-500')}
          >
            <span
              className={cn(
                'font-medium',
                variant === 'light' ? 'text-teal-700' : 'text-[#14b8a6]',
              )}
            >
              [{source.source}]
            </span>{' '}
            {source.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
