'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { AnalysisView } from '@/components/views/AnalysisView';
import { GoalView } from '@/components/views/GoalView';
import { HomeView } from '@/components/views/HomeView';
import { RecordView } from '@/components/views/RecordView';
import { useNow } from '@/hooks/useNow';
import { useStore } from '@/hooks/useStore';
import { useUI } from '@/hooks/useUI';
import type { TabId } from '@/types';
import { cn, formatClock, formatJaDate } from '@/lib/utils';

const TABS: Array<{ id: TabId; label: string; title: string; icon: IconName }> = [
  { id: 'home', label: 'ホーム', title: 'ダッシュボード', icon: 'home' },
  { id: 'record', label: '記録', title: '学習記録', icon: 'timer' },
  { id: 'analysis', label: '分析', title: '点数・課題分析', icon: 'chart' },
  { id: 'goal', label: '目標', title: '目標と設定', icon: 'target' },
];

function View({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'home':
      return <HomeView />;
    case 'record':
      return <RecordView />;
    case 'analysis':
      return <AnalysisView />;
    case 'goal':
      return <GoalView />;
  }
}

// ------------------------------------------------------------
// 小さな共通パーツ
// ------------------------------------------------------------
function Logo({ withText }: { withText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" className="h-9 w-9 rounded-xl shadow-glow" />
      {withText && <span className="text-lg font-extrabold tracking-tight">GoalDeck</span>}
    </div>
  );
}

/** スマホ表示 / PC表示 をワンタップで切り替え */
function DeviceToggle({ compact }: { compact?: boolean }) {
  const { device, setDevice } = useUI();
  const items = [
    { mode: 'mobile' as const, icon: 'phone' as const, label: 'スマホ' },
    { mode: 'desktop' as const, icon: 'monitor' as const, label: 'PC' },
  ];
  return (
    <div className="inline-flex rounded-xl bg-surface2 p-1" role="group" aria-label="表示の切り替え">
      {items.map((it) => (
        <button
          key={it.mode}
          type="button"
          aria-pressed={device === it.mode}
          aria-label={`${it.label}表示`}
          title={`${it.label}表示`}
          onClick={() => setDevice(it.mode)}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-extrabold transition active:scale-95',
            device === it.mode ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow' : 'text-muted hover:text-ink',
          )}
        >
          <Icon name={it.icon} className="h-4 w-4" />
          {!compact && <span>{it.label}</span>}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useUI();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'ライトモードにする' : 'ダークモードにする'}
      className="grid h-11 w-11 place-items-center rounded-xl bg-surface2 text-muted transition hover:text-ink active:scale-90"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

function GoalSelect({ className }: { className?: string }) {
  const { data, goal, setActiveGoal } = useStore();
  if (data.goals.length === 0) return null;
  return (
    <div className={cn('relative min-w-0', className)}>
      <select
        aria-label="表示する目標"
        value={goal?.id ?? ''}
        onChange={(e) => setActiveGoal(e.target.value)}
        className="h-11 w-full appearance-none truncate rounded-xl bg-surface2 pl-3 pr-8 text-sm font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        {data.goals.map((g) => (
          <option key={g.id} value={g.id}>
            {g.emoji} {g.name}
          </option>
        ))}
      </select>
      <Icon name="chevron" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted" />
    </div>
  );
}

/** 計測中は、どのタブにいても経過時間を表示。タップで記録タブへ */
function MiniTimer({ className }: { className?: string }) {
  const { data } = useStore();
  const { tab, goTo } = useUI();
  const sw = data.stopwatch;
  const active = sw.running || sw.accumulatedMs > 0;
  const now = useNow(sw.running ? 500 : 60_000);
  if (!active || tab === 'record') return null;

  const elapsed = sw.accumulatedMs + (sw.running && sw.startedAt !== null ? Math.max(0, now.getTime() - sw.startedAt) : 0);
  const subject = data.subjects.find((s) => s.id === sw.subjectId);

  return (
    <button
      type="button"
      onClick={() => goTo('record')}
      className={cn(
        'flex h-12 items-center gap-3 rounded-full bg-slate-900 px-4 text-white shadow-phone transition active:scale-95 dark:bg-white dark:text-slate-900',
        className,
      )}
      aria-label="記録タブでストップウォッチを開く"
    >
      <i className={cn('h-2.5 w-2.5 rounded-full', sw.running ? 'animate-breathe bg-emerald-400' : 'bg-amber-400')} />
      <span className="tabular text-base font-extrabold">{formatClock(elapsed)}</span>
      <span className="max-w-[9rem] truncate text-xs font-bold opacity-75">{subject?.name ?? '計測中'}</span>
      <Icon name="chevron" className="ml-auto h-4 w-4 opacity-60" />
    </button>
  );
}

function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-28 left-1/2 z-50 max-w-[min(92vw,420px)] animate-toast-in rounded-2xl bg-slate-900 px-4 py-3 text-center text-[13px] font-bold text-white shadow-phone dark:bg-white dark:text-slate-900"
    >
      {toast}
    </div>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -right-24 top-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
    </div>
  );
}

function Splash() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <div className="flex animate-breathe flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="h-16 w-16 rounded-2xl shadow-glow" />
        <p className="text-sm font-bold text-muted">GoalDeck</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// スマホ表示：画面いっぱい（PCではスマホ型フレームで表示）＋ 下タブ
// ------------------------------------------------------------
function MobileLayout({ children }: { children: ReactNode }) {
  const { tab, goTo } = useUI();
  return (
    <div className="relative isolate min-h-[100dvh] md:flex md:items-center md:justify-center md:p-6">
      <Backdrop />
      <div
        className={cn(
          'relative flex h-[100dvh] w-full flex-col overflow-hidden bg-canvas',
          'md:h-[min(844px,calc(100vh-3rem))] md:w-[390px] md:rounded-[44px] md:border-[10px] md:border-slate-900 md:shadow-phone dark:md:border-slate-700',
        )}
      >
        <header className="flex items-center gap-2 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Logo />
          <GoalSelect className="flex-1" />
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <DeviceToggle compact />
            <ThemeToggle />
          </div>
        </header>

        <div className="relative min-h-0 flex-1">
          <main id="scroll-area" className="absolute inset-0 overflow-y-auto overscroll-contain px-4 pb-24 pt-2">
            <div key={tab} className="animate-fade-in">
              {children}
            </div>
          </main>
          <MiniTimer className="absolute inset-x-4 bottom-3 z-10" />
        </div>

        <nav
          aria-label="メインメニュー"
          className="relative z-10 border-t border-line bg-surface/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl"
        >
          <ul className="grid grid-cols-4 gap-1">
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => goTo(t.id)}
                    className={cn(
                      'flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-extrabold transition active:scale-90',
                      active ? 'bg-brand/10 text-brand' : 'text-muted hover:text-ink',
                    )}
                  >
                    <Icon name={t.icon} className="h-[22px] w-[22px]" />
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// PC表示：左サイドバー＋広いダッシュボード
// ------------------------------------------------------------
function DesktopLayout({ children }: { children: ReactNode }) {
  const { tab, goTo } = useUI();
  const now = useNow(60_000);
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="relative isolate flex min-h-screen min-w-[1040px]">
      <Backdrop />
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/70 p-5 backdrop-blur-xl">
        <Logo withText />
        <nav aria-label="メインメニュー" className="mt-8 space-y-1.5">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => goTo(t.id)}
                className={cn(
                  'flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-extrabold transition active:scale-[0.98]',
                  active ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-glow' : 'text-muted hover:bg-surface2 hover:text-ink',
                )}
              >
                <Icon name={t.icon} />
                {t.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <p className="text-[11px] font-bold text-muted">表示モード</p>
          <DeviceToggle />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted">テーマ</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-end justify-between gap-6 px-10 pb-5 pt-9">
          <div>
            <p className="text-xs font-bold text-muted">{formatJaDate(now)}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{current.title}</h1>
          </div>
          <GoalSelect className="w-64" />
        </header>
        <main className="px-10 pb-20">
          <div key={tab} className="mx-auto max-w-6xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <MiniTimer className="fixed bottom-6 right-6 z-40 w-72" />
    </div>
  );
}

function Shell() {
  const { device, tab } = useUI();
  const first = useRef(true);

  // タブを切り替えたら先頭へ戻す
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById('scroll-area')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [tab, device]);

  const content = <View tab={tab} />;
  return (
    <>
      {device === 'mobile' ? <MobileLayout>{content}</MobileLayout> : <DesktopLayout>{content}</DesktopLayout>}
      <Toast />
    </>
  );
}

export function AppShell() {
  const { ready } = useStore();
  const { uiReady } = useUI();
  if (!ready || !uiReady) return <Splash />;
  return <Shell />;
}
