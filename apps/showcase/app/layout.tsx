import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'FunnyChapter',
  description: '有趣的验证码合集 — 10 种验证码，3 种集成方式',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
