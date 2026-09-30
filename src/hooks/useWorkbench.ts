import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadState,
  saveState,
  makeChapter,
  DEFAULT_BANNED,
} from '@/lib/workbench';
import type { Chapter, WorkbenchState } from '@/lib/workbench';
import ch1 from '../../docs/articles/1.txt?raw';
import ch2 from '../../docs/articles/2.txt?raw';
import ch3 from '../../docs/articles/3.txt?raw';
import ch4 from '../../docs/articles/4.txt?raw';
import ch5 from '../../docs/articles/5.txt?raw';
import ch6 from '../../docs/articles/6.txt?raw';
import ch7 from '../../docs/articles/7.txt?raw';

// 默认导入的拆解章节（docs/articles/1-7.txt）
const DEFAULT_CHAPTERS: { title: string; source: string }[] = [
  { title: '第1章 · 留声机案', source: ch1 },
  { title: '第2章 · 歧骸失踪案', source: ch2 },
  { title: '第3章 · 行李箱案', source: ch3 },
  { title: '第4章 · 雨夜飙车', source: ch4 },
  { title: '第5章 · 考证风波', source: ch5 },
  { title: '第6章 · 示范赛', source: ch6 },
  { title: '第7章 · 泡沫梦境', source: ch7 },
];

function seedChapters(): Chapter[] {
  return DEFAULT_CHAPTERS.map((d) => makeChapter(d.title, d.source));
}

function initialState(): WorkbenchState {
  const saved = loadState();
  if (saved) {
    // 每次打开都默认导入原文：没有章节则建全套默认章；
    // 默认章原文为空则按序补上，还是「第N章」泛名则换成正式章名
    if (saved.chapters.length === 0) {
      const chapters = seedChapters();
      return { ...saved, chapters, activeId: chapters[0].id };
    }
    const chapters = saved.chapters.map((c, i) => {
      if (i >= DEFAULT_CHAPTERS.length) return c;
      const d = DEFAULT_CHAPTERS[i];
      return {
        ...c,
        source: c.source.trim() ? c.source : d.source,
        title:
          /^第\d+章$/.test(c.title.trim()) || c.title === '第5章 · 担保书案'
            ? d.title
            : c.title,
      };
    });
    return { ...saved, chapters };
  }
  const chapters = seedChapters();
  return {
    chapters,
    activeId: chapters[0].id,
    bannedWords: DEFAULT_BANNED,
    checklist: {},
  };
}

export function useWorkbench() {
  const [state, setState] = useState<WorkbenchState>(initialState);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 防抖自动保存
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveState(state), 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state]);

  const active = state.chapters.find((c) => c.id === state.activeId) ?? null;

  const updateChapter = useCallback((id: string, patch: Partial<Chapter>) => {
    setState((s) => ({
      ...s,
      chapters: s.chapters.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
      ),
    }));
  }, []);

  const addChapter = useCallback((title: string, source = '') => {
    const ch = makeChapter(title, source);
    setState((s) => ({
      ...s,
      chapters: [...s.chapters, ch],
      activeId: ch.id,
    }));
    return ch.id;
  }, []);

  const removeChapter = useCallback((id: string) => {
    setState((s) => {
      const chapters = s.chapters.filter((c) => c.id !== id);
      const activeId =
        s.activeId === id ? (chapters[0]?.id ?? null) : s.activeId;
      return { ...s, chapters, activeId };
    });
  }, []);

  const setActive = useCallback((id: string) => {
    setState((s) => ({ ...s, activeId: id }));
  }, []);

  const setBannedWords = useCallback((words: string[]) => {
    setState((s) => ({ ...s, bannedWords: words }));
  }, []);

  const toggleCheck = useCallback((item: string) => {
    setState((s) => ({
      ...s,
      checklist: { ...s.checklist, [item]: !s.checklist[item] },
    }));
  }, []);

  return {
    state,
    active,
    updateChapter,
    addChapter,
    removeChapter,
    setActive,
    setBannedWords,
    toggleCheck,
  };
}
