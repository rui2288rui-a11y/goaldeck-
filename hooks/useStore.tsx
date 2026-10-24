'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppData, Goal, ScoreRecord, Settings, StudyLog, Subject } from '@/types';
import { DEFAULT_STOPWATCH, STORAGE_KEY, emptyData, sanitize } from '@/lib/storage';
import { SUBJECT_COLORS } from '@/lib/presets';
import { buildDemoData } from '@/lib/demo';
import { normalizeSettings } from '@/lib/stats';
import { clamp, dateKey, formatSeconds, uid } from '@/lib/utils';

export interface NewSubject {
  name: string;
  maxScore: number;
  targetScore: number;
  currentScore?: number;
}

export interface NewGoal {
  name: string;
  emoji: string;
  dateISO: string;
  presetId?: string;
  subjects: NewSubject[];
}

type SubjectPatch = Partial<Pick<Subject, 'name' | 'maxScore' | 'targetScore' | 'currentScore' | 'color'>>;

export interface Actions {
  notify: (msg: string) => void;
  createGoal: (input: NewGoal) => string;
  updateGoal: (id: string, patch: Partial<Pick<Goal, 'name' | 'emoji' | 'dateISO'>>) => void;
  deleteGoal: (id: string) => void;
  setActiveGoal: (id: string) => void;
  addSubject: (goalId: string, s: NewSubject) => void;
  updateSubject: (id: string, patch: SubjectPatch) => void;
  deleteSubject: (id: string) => void;
  addLog: (input: { subjectId: string; task: string; seconds: number; dateKey?: string }) => void;
  deleteLog: (id: string) => void;
  addScore: (input: { subjectId: string; label: string; score: number }) => void;
  deleteScore: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  swSelect: (subjectId: string | null, task: string) => void;
  swStart: () => void;
  swPause: () => void;
  swReset: () => void;
  swFinish: () => void;
  toggleBlock: (dateKey: string, blockId: string) => void;
  loadDemo: () => void;
  importJSON: (text: string) => { ok: boolean; error?: string };
  resetAll: () => void;
}

export interface StoreValue extends Actions {
  ready: boolean;
  data: AppData;
  /** 選択中の目標 */
  goal: Goal | null;
  /** 選択中の目標に属する科目・記録・点数 */
  subjects: Subject[];
  logs: StudyLog[];
  scores: ScoreRecord[];
  /** 不正値を丸めた設定（計算にはこちらを使う） */
  settings: Settings;
  toast: string | null;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children, initialData }: { children: ReactNode; initialData?: AppData }) {
  const [data, setDataState] = useState<AppData>(() => initialData ?? emptyData());
  const [ready, setReady] = useState<boolean>(() => Boolean(initialData));
  const [toast, setToast] = useState<string | null>(null);
  const dataRef = useRef<AppData>(data);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- 読み込み（初回のみ） ----
  useEffect(() => {
    if (initialData) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = sanitize(JSON.parse(raw));
        dataRef.current = parsed;
        setDataState(parsed);
      }
    } catch {
      /* 壊れたデータは無視して空の状態から始める */
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 保存 ----
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* 容量超過やプライベートモードでは保存を諦める */
    }
  }, [data, ready]);

  // ---- 別タブとの同期 ----
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const next = sanitize(JSON.parse(e.newValue));
        dataRef.current = next;
        setDataState(next);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const actions = useMemo<Actions>(() => {
    const update = (fn: (d: AppData) => AppData) => {
      const next = fn(dataRef.current);
      dataRef.current = next;
      setDataState(next);
    };

    const notify = (msg: string) => {
      setToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2800);
    };

    const makeSubject = (goalId: string, index: number, s: NewSubject): Subject => {
      const max = Math.max(1, Math.round(s.maxScore) || 1);
      return {
        id: uid('sub'),
        goalId,
        name: s.name.trim() || `科目${index + 1}`,
        color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
        maxScore: max,
        targetScore: clamp(Math.round(s.targetScore) || 0, 0, max),
        currentScore: clamp(Math.round(s.currentScore ?? 0), 0, max),
      };
    };

    const resetStopwatchFields = (d: AppData): AppData => ({
      ...d,
      stopwatch: { ...DEFAULT_STOPWATCH, subjectId: d.stopwatch.subjectId, task: d.stopwatch.task },
    });

    return {
      notify,

      createGoal: (input) => {
        const id = uid('goal');
        const goal: Goal = {
          id,
          name: input.name.trim() || '新しい目標',
          emoji: input.emoji,
          dateISO: input.dateISO,
          createdAtISO: new Date().toISOString(),
          presetId: input.presetId,
        };
        const subjects = input.subjects.map((s, i) => makeSubject(id, i, s));
        update((d) => ({ ...d, goals: [...d.goals, goal], activeGoalId: id, subjects: [...d.subjects, ...subjects] }));
        return id;
      },

      updateGoal: (id, patch) =>
        update((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      deleteGoal: (id) =>
        update((d) => {
          const removed = new Set(d.subjects.filter((s) => s.goalId === id).map((s) => s.id));
          const goals = d.goals.filter((g) => g.id !== id);
          const swSubject = d.stopwatch.subjectId && removed.has(d.stopwatch.subjectId);
          return {
            ...d,
            goals,
            activeGoalId: d.activeGoalId === id ? (goals[0]?.id ?? null) : d.activeGoalId,
            subjects: d.subjects.filter((s) => s.goalId !== id),
            logs: d.logs.filter((l) => !removed.has(l.subjectId)),
            scores: d.scores.filter((x) => !removed.has(x.subjectId)),
            stopwatch: swSubject ? { ...DEFAULT_STOPWATCH } : d.stopwatch,
          };
        }),

      setActiveGoal: (id) => update((d) => ({ ...d, activeGoalId: id })),

      addSubject: (goalId, s) =>
        update((d) => {
          const index = d.subjects.filter((x) => x.goalId === goalId).length;
          return { ...d, subjects: [...d.subjects, makeSubject(goalId, index, s)] };
        }),

      updateSubject: (id, patch) =>
        update((d) => ({ ...d, subjects: d.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),

      deleteSubject: (id) =>
        update((d) => ({
          ...d,
          subjects: d.subjects.filter((s) => s.id !== id),
          logs: d.logs.filter((l) => l.subjectId !== id),
          scores: d.scores.filter((x) => x.subjectId !== id),
          stopwatch: d.stopwatch.subjectId === id ? { ...DEFAULT_STOPWATCH } : d.stopwatch,
        })),

      addLog: ({ subjectId, task, seconds, dateKey: key }) => {
        const secs = Math.round(seconds);
        if (secs < 1) return;
        const now = new Date();
        const log: StudyLog = {
          id: uid('log'),
          subjectId,
          task: task.trim(),
          seconds: secs,
          dateKey: key ?? dateKey(now),
          createdAt: now.getTime(),
        };
        update((d) => ({ ...d, logs: [...d.logs, log] }));
      },

      deleteLog: (id) => update((d) => ({ ...d, logs: d.logs.filter((l) => l.id !== id) })),

      addScore: ({ subjectId, label, score }) => {
        const now = new Date();
        update((d) => {
          const s = d.subjects.find((x) => x.id === subjectId);
          if (!s) return d;
          const value = clamp(Math.round(score), 0, s.maxScore);
          const rec: ScoreRecord = {
            id: uid('score'),
            subjectId,
            label: label.trim() || '記録',
            score: value,
            dateKey: dateKey(now),
            createdAt: now.getTime(),
          };
          return {
            ...d,
            scores: [...d.scores, rec],
            subjects: d.subjects.map((x) => (x.id === subjectId ? { ...x, currentScore: value } : x)),
          };
        });
      },

      deleteScore: (id) => update((d) => ({ ...d, scores: d.scores.filter((x) => x.id !== id) })),

      updateSettings: (patch) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

      // ---- ストップウォッチ（時刻ベースなのでリロードしても続きから） ----
      swSelect: (subjectId, task) =>
        update((d) => ({ ...d, stopwatch: { ...d.stopwatch, subjectId, task } })),

      swStart: () =>
        update((d) =>
          d.stopwatch.running ? d : { ...d, stopwatch: { ...d.stopwatch, running: true, startedAt: Date.now() } },
        ),

      swPause: () =>
        update((d) => {
          const sw = d.stopwatch;
          if (!sw.running || sw.startedAt === null) return d;
          return {
            ...d,
            stopwatch: { ...sw, running: false, startedAt: null, accumulatedMs: sw.accumulatedMs + (Date.now() - sw.startedAt) },
          };
        }),

      swReset: () => update((d) => resetStopwatchFields(d)),

      swFinish: () => {
        const d = dataRef.current;
        const sw = d.stopwatch;
        const total = sw.accumulatedMs + (sw.running && sw.startedAt !== null ? Date.now() - sw.startedAt : 0);
        const activeGoal = d.goals.find((g) => g.id === d.activeGoalId) ?? d.goals[0];
        const mine = d.subjects.filter((s) => s.goalId === activeGoal?.id);
        const subject = mine.find((s) => s.id === sw.subjectId) ?? mine[0];
        if (!subject) {
          notify('先に科目を登録してください');
          return;
        }
        const seconds = Math.round(total / 1000);
        if (seconds < 1) {
          update((x) => resetStopwatchFields(x));
          return;
        }
        const now = new Date();
        const log: StudyLog = {
          id: uid('log'),
          subjectId: subject.id,
          task: sw.task.trim(),
          seconds,
          dateKey: dateKey(now),
          createdAt: now.getTime(),
        };
        update((x) => ({
          ...x,
          logs: [...x.logs, log],
          stopwatch: { ...DEFAULT_STOPWATCH, subjectId: subject.id, task: '' },
        }));
        notify(`${subject.name} ${formatSeconds(seconds)} を記録しました`);
      },

      toggleBlock: (key, blockId) =>
        update((d) => {
          const cur = d.doneBlocks[key] ?? [];
          const next = cur.includes(blockId) ? cur.filter((x) => x !== blockId) : [...cur, blockId];
          const merged = { ...d.doneBlocks, [key]: next };
          const keep = Object.keys(merged).sort().slice(-14); // 直近14日分だけ保持
          const trimmed: Record<string, string[]> = {};
          for (const k of keep) trimmed[k] = merged[k];
          return { ...d, doneBlocks: trimmed };
        }),

      loadDemo: () => {
        update(() => buildDemoData(new Date()));
        notify('デモデータを読み込みました');
      },

      importJSON: (text) => {
        try {
          const parsed: unknown = JSON.parse(text);
          if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { goals?: unknown }).goals)) {
            return { ok: false, error: 'GoalDeck のバックアップファイルではありません' };
          }
          const next = sanitize(parsed);
          update(() => next);
          notify('データを読み込みました');
          return { ok: true };
        } catch {
          return { ok: false, error: 'ファイルを読み込めませんでした' };
        }
      },

      resetAll: () => {
        update(() => emptyData());
        notify('すべてのデータを削除しました');
      },
    };
  }, []);

  const value = useMemo<StoreValue>(() => {
    const goal = data.goals.find((g) => g.id === data.activeGoalId) ?? data.goals[0] ?? null;
    const subjects = goal ? data.subjects.filter((s) => s.goalId === goal.id) : [];
    const ids = new Set(subjects.map((s) => s.id));
    return {
      ready,
      data,
      goal,
      subjects,
      logs: data.logs.filter((l) => ids.has(l.subjectId)),
      scores: data.scores.filter((x) => ids.has(x.subjectId)),
      settings: normalizeSettings(data.settings),
      toast,
      ...actions,
    };
  }, [ready, data, toast, actions]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore は StoreProvider の内側で使ってください');
  return ctx;
}
