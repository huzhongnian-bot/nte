import { useMemo, useRef } from 'react';
import { useWorkbench } from '@/hooks/useWorkbench';
import {
  scanBanned,
  countProfanity,
  countPovMarkers,
  cleanArchive,
  downloadText,
  countChars,
  STATUS_NEXT,
  CHECKLIST_ITEMS,
} from '@/lib/workbench';
import { ChapterList } from '@/components/ChapterList';
import { Inspector } from '@/components/Inspector';
import { Button } from '@/components/ui/button';
import { Upload, Download, Eraser, BookOpen } from 'lucide-react';

export default function App() {
  const {
    state,
    active,
    updateChapter,
    addChapter,
    removeChapter,
    setActive,
    setBannedWords,
    toggleCheck,
  } = useWorkbench();

  const fileRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const hits = useMemo(
    () => (active ? scanBanned(active.draft, state.bannedWords) : []),
    [active?.draft, state.bannedWords]
  );
  const profanity = useMemo(
    () => countProfanity(active?.draft ?? ''),
    [active?.draft]
  );
  const povMarkers = useMemo(
    () => countPovMarkers(active?.source ?? ''),
    [active?.source]
  );

  const doneCount = state.chapters.filter((c) => c.status === 'done').length;

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const title = file.name.replace(/\.(md|txt)$/i, '');
      addChapter(title, text);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  }

  function locate(index: number, length: number) {
    const ta = draftRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(index, index + length);
    const lines = active!.draft.slice(0, index).split('\n').length;
    ta.scrollTop = Math.max(0, (lines - 8) * 22);
  }

  function exportActive() {
    if (!active) return;
    downloadText(`${active.title}.md`, active.draft || active.source);
  }

  function exportAll() {
    const parts = state.chapters
      .filter((c) => c.draft.trim())
      .map((c) => `# ${c.title}\n\n${c.draft.trim()}\n`);
    if (!parts.length) return;
    downloadText('Nowhere-to-Everywhere_改稿合集.md', parts.join('\n---\n\n'));
  }

  return (
    <div className="flex h-screen flex-col bg-paper-100 text-ink-800">
      {/* 顶栏 */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-paper-300 bg-paper-50 px-4">
        <BookOpen className="h-4 w-4 text-amber-700" />
        <h1 className="text-sm font-semibold tracking-wide text-ink-900">
          《Nowhere to Everywhere》改文工作台
        </h1>
        <span className="text-[11px] text-ink-400">
          {doneCount}/{state.chapters.length} 章改完
        </span>
        <div className="flex-1" />
        <input
          ref={fileRef}
          type="file"
          accept=".md,.txt"
          className="hidden"
          onChange={handleImport}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 border-paper-300 bg-paper-50 text-xs text-ink-500 hover:bg-paper-200 hover:text-ink-800"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          导入存档
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 border-paper-300 bg-paper-50 text-xs text-ink-500 hover:bg-paper-200 hover:text-ink-800"
          onClick={exportActive}
          disabled={!active}
        >
          <Download className="h-3.5 w-3.5" />
          导出本章
        </Button>
        <Button
          size="sm"
          className="h-7 gap-1.5 bg-amber-700 text-xs text-paper-50 hover:bg-amber-800"
          onClick={exportAll}
        >
          <Download className="h-3.5 w-3.5" />
          导出全部改稿
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 章节栏 */}
        <div className="w-52 shrink-0">
          <ChapterList
            chapters={state.chapters}
            activeId={state.activeId}
            onSelect={setActive}
            onAdd={() => addChapter(`第${state.chapters.length + 1}章`)}
            onRemove={removeChapter}
            onCycleStatus={(id) => {
              const ch = state.chapters.find((c) => c.id === id);
              if (ch) updateChapter(id, { status: STATUS_NEXT[ch.status] });
            }}
          />
        </div>

        {/* 编辑区 */}
        {active ? (
          <div className="flex min-w-0 flex-1 flex-col">
            {/* 章节标题 */}
            <div className="flex shrink-0 items-center gap-2 border-b border-paper-300 bg-paper-50 px-4 py-2">
              <input
                value={active.title}
                onChange={(e) =>
                  updateChapter(active.id, { title: e.target.value })
                }
                className="w-full max-w-md bg-transparent text-sm font-medium text-ink-800 outline-none placeholder:text-ink-300"
                placeholder="章节标题"
              />
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-ink-400 hover:text-amber-700"
                title="把跑团存档拆掉格式，作为改写起点（不替人改文）"
                onClick={() => {
                  if (
                    !active.draft.trim() ||
                    window.confirm('覆盖当前改写稿？')
                  ) {
                    updateChapter(active.id, {
                      draft: cleanArchive(active.source),
                      status: active.status === 'pending' ? 'wip' : active.status,
                    });
                  }
                }}
              >
                <Eraser className="h-3.5 w-3.5" />
                存档清洗 → 改写稿
              </Button>
            </div>

            <div className="flex min-h-0 flex-1">
              {/* 原文 */}
              <div className="flex min-w-0 flex-1 flex-col border-r border-paper-300 bg-paper-200/40">
                <div className="shrink-0 px-4 py-1.5 text-[11px] tracking-widest text-ink-300">
                  原文 · 跑团存档（{countChars(active.source)} 字）
                </div>
                <textarea
                  value={active.source}
                  onChange={(e) =>
                    updateChapter(active.id, { source: e.target.value })
                  }
                  placeholder="粘贴或导入跑团存档…"
                  spellCheck={false}
                  className="min-h-0 flex-1 resize-none bg-transparent px-4 py-2 font-mono text-[13px] leading-relaxed text-ink-500 outline-none placeholder:text-ink-300"
                />
              </div>
              {/* 改写 */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="shrink-0 px-4 py-1.5 text-[11px] tracking-widest text-amber-700/90">
                  改写 · 零单一视角（{countChars(active.draft)} 字）
                </div>
                <textarea
                  ref={draftRef}
                  value={active.draft}
                  onChange={(e) =>
                    updateChapter(active.id, {
                      draft: e.target.value,
                      status: active.status === 'pending' ? 'wip' : active.status,
                    })
                  }
                  placeholder="小说体从这里长出来。心理配额制：只许贴错标签，不许分析为什么。"
                  spellCheck={false}
                  className="manuscript min-h-0 flex-1 resize-none px-4 py-2 text-[14px] leading-loose text-ink-800 outline-none placeholder:text-ink-300"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-ink-300">
            左侧新建或选择一章
          </div>
        )}

        {/* 检查面板 */}
        <div className="w-80 shrink-0">
          <Inspector
            hits={hits}
            bannedWords={state.bannedWords}
            onLocate={locate}
            onAddWord={(w) =>
              !state.bannedWords.includes(w) &&
              setBannedWords([...state.bannedWords, w])
            }
            onRemoveWord={(w) =>
              setBannedWords(state.bannedWords.filter((x) => x !== w))
            }
            checklist={state.checklist}
            onToggleCheck={toggleCheck}
            profanity={profanity}
            povMarkers={povMarkers}
            sourceChars={countChars(active?.source ?? '')}
            draftChars={countChars(active?.draft ?? '')}
          />
        </div>
      </div>

      <footer className="flex h-6 shrink-0 items-center justify-between border-t border-paper-300 bg-paper-50 px-4 text-[10px] text-ink-400">
        <span>抢救规范 {Object.values(state.checklist).filter(Boolean).length}/{CHECKLIST_ITEMS.length} · 违禁词 {hits.length} 命中</span>
        <span>数据只在本浏览器 localStorage · 定期导出备份</span>
      </footer>
    </div>
  );
}
