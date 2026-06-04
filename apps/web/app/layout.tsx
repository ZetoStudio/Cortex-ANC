import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cortex — Single Brain Platform',
  description:
    'AI-native company platform connecting every business tool into one intelligent system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const body = <body className="min-h-full flex flex-col font-sans">{children}</body>;

  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} h-full dark`}>
      {clerkKey ? <ClerkProvider>{body}</ClerkProvider> : body}
    </html>
  );
}
