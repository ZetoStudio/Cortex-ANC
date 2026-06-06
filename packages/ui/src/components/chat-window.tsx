'use client';

import { StickToBottom } from 'use-stick-to-bottom';

import { cn } from '../lib/utils';

export type ChatWindowProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'light';
};

export function ChatWindow({ children, className, variant = 'dark' }: ChatWindowProps) {
  const isLight = variant === 'light';
  return (
    <div className={cn('relative min-h-0 flex-1', isLight ? 'bg-[#fafafa]' : 'mesh-bg', className)}>
      <StickToBottom
        className="relative flex h-full min-h-0 flex-1 overflow-y-auto"
        resize="smooth"
        initial="instant"
        role="log"
      >
        <StickToBottom.Content className="flex w-full flex-col gap-4 p-6">
          {children}
        </StickToBottom.Content>
      </StickToBottom>
    </div>
  );
}
