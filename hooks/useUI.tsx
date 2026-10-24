'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { DeviceMode, TabId, ThemeMode } from '@/types';

const THEME_KEY = 'goaldeck:theme';
const DEVICE_KEY = 'goaldeck:device';

interface UIValue {
  uiReady: boolean;
  theme: ThemeMode;
  device: DeviceMode;
  tab: TabId;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  setDevice: (d: DeviceMode) => void;
  goTo: (t: TabId) => void;
}

const UIContext = createContext<UIValue | null>(null);

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 保存できない環境でも動作は続ける */
  }
}

function applyTheme(t: ThemeMode) {
  document.documentElement.classList.toggle('dark', t === 'dark');
  document.documentElement.style.colorScheme = t;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [uiReady, setUiReady] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [device, setDeviceState] = useState<DeviceMode>('mobile');
  const [tab, setTab] = useState<TabId>('home');

  useEffect(() => {
    // テーマ: layout の先読みスクリプトが付けた class を正とする
    setThemeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    // 表示モード: 保存値 → なければ画面幅で自動判定（スマホ=スマホ表示 / PC=PC表示）
    const saved = safeGet(DEVICE_KEY);
    if (saved === 'mobile' || saved === 'desktop') setDeviceState(saved);
    else setDeviceState(window.innerWidth < 768 ? 'mobile' : 'desktop');
    setUiReady(true);
  }, []);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    applyTheme(t);
    safeSet(THEME_KEY, t);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    setThemeState(next);
    applyTheme(next);
    safeSet(THEME_KEY, next);
  }, []);

  const setDevice = useCallback((d: DeviceMode) => {
    setDeviceState(d);
    safeSet(DEVICE_KEY, d);
  }, []);

  const goTo = useCallback((t: TabId) => setTab(t), []);

  const value = useMemo<UIValue>(
    () => ({ uiReady, theme, device, tab, setTheme, toggleTheme, setDevice, goTo }),
    [uiReady, theme, device, tab, setTheme, toggleTheme, setDevice, goTo],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI は UIProvider の内側で使ってください');
  return ctx;
}
