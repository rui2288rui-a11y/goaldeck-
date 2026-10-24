import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'GoalDeck — 目標までの毎日を、迷わず進める',
  description:
    '試験日までのカウントダウン、学習のタイムトラッキング、弱点分析、今日やることの自動提案をひとつに。大学受験・資格試験・日々の目標管理に。',
  applicationName: 'GoalDeck',
  appleWebApp: { capable: true, title: 'GoalDeck', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f5fc' },
    { media: '(prefers-color-scheme: dark)', color: '#090b16' },
  ],
};

// ちらつき防止：描画前に保存済みテーマ（なければOS設定）を <html> に反映する
const themeScript = `(function(){try{var t=localStorage.getItem('goaldeck:theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
