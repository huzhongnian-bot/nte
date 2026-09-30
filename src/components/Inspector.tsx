import { CHECKLIST_ITEMS } from '@/lib/workbench';
import type { BannedHit } from '@/lib/workbench';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Plus, X, Crosshair } from 'lucide-react';
import { useState } from 'react';

interface InspectorProps {
  hits: BannedHit[];
  bannedWords: string[];
  onLocate: (index: number, length: number) => void;
  onAddWord: (w: string) => void;
  onRemoveWord: (w: string) => void;
  checklist: Record<string, boolean>;
  onToggleCheck: (item: string) => void;
  profanity: { total: number; perK: string };
  povMarkers: { roleHeaders: number; starLines: number };
  sourceChars: number;
  draftChars: number;
}

export function Inspector({
  hits,
  bannedWords,
  onLocate,
  onAddWord,
  onRemoveWord,
  checklist,
  onToggleCheck,
  profanity,
  povMarkers,
  sourceChars,
  draftChars,
}: InspectorProps) {
  const [newWord, setNewWord] = useState('');
  const doneCount = CHECKLIST_ITEMS.filter((i) => checklist[i]).length;

  return (
    <div className="flex h-full flex-col border-l border-paper-300 bg-paper-50">
      <Tabs defaultValue="inspect" className="flex h-full flex-col">
        <TabsList className="mx-2 mt-2 grid shrink-0 grid-cols-3 bg-paper-200">
          <TabsTrigger value="inspect" className="text-xs">
            检查
            {hits.length > 0 && (
              <span className="ml-1 rounded-full bg-red-700/15 px-1.5 text-[10px] text-red-700">
                {hits.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-xs">
            规范 {doneCount}/{CHECKLIST_ITEMS.length}
          </TabsTrigger>
          <TabsTrigger value="words" className="text-xs">
            词表
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inspect" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-3 p-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <Stat label="原文字数" value={String(sourceChars)} />
                <Stat label="改写字数" value={String(draftChars)} />
                <Stat
                  label="粗口/千字"
                  value={profanity.perK}
                  warn={Number(profanity.perK) > 3}
                />
                <Stat
                  label="存档残留"
                  value={`${povMarkers.roleHeaders}标 ${povMarkers.starLines}星`}
                  warn={povMarkers.roleHeaders + povMarkers.starLines > 0}
                />
              </div>

              <div className="text-xs font-medium tracking-widest text-ink-400">
                违禁词命中
              </div>
              {hits.length === 0 ? (
                <p className="rounded-md border border-emerald-700/30 bg-emerald-50 px-3 py-3 text-xs text-emerald-800">
                  干净。套皮剥除完毕。
                </p>
              ) : (
                hits.map((h, i) => (
                  <button
                    key={`${h.index}-${i}`}
                    className="group rounded-md border border-paper-300 bg-paper-50 px-2.5 py-2 text-left transition-colors hover:border-amber-700/50"
                    onClick={() => onLocate(h.index, h.word.length)}
                    title="点击定位到编辑器"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-red-700">
                        {h.word}
                      </span>
                      <Crosshair className="h-3 w-3 text-ink-300 group-hover:text-amber-700" />
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-400">
                      …{h.context}…
                    </p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="rules" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2.5 p-3">
              <p className="text-[11px] leading-relaxed text-ink-400">
                正式文抢救规范（动笔时执行），过一章勾一章：
              </p>
              {CHECKLIST_ITEMS.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-start gap-2.5 rounded-md border border-paper-300 bg-paper-50 px-3 py-2.5 hover:border-paper-400"
                >
                  <Checkbox
                    checked={!!checklist[item]}
                    onCheckedChange={() => onToggleCheck(item)}
                    className="mt-0.5"
                  />
                  <span
                    className={
                      checklist[item]
                        ? 'text-xs leading-relaxed text-ink-300 line-through'
                        : 'text-xs leading-relaxed text-ink-700'
                    }
                  >
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="words" className="mt-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-3">
              <p className="text-[11px] leading-relaxed text-ink-400">
                见到即删改。可加自己的高频复读：
              </p>
              <div className="flex gap-1.5">
                <input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newWord.trim()) {
                      onAddWord(newWord.trim());
                      setNewWord('');
                    }
                  }}
                  placeholder="新违禁词…"
                  className="h-8 min-w-0 flex-1 rounded-md border border-paper-300 bg-paper-50 px-2 text-xs text-ink-800 outline-none placeholder:text-ink-300 focus:border-amber-700/50"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-ink-400 hover:text-amber-700"
                  onClick={() => {
                    if (newWord.trim()) {
                      onAddWord(newWord.trim());
                      setNewWord('');
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {bannedWords.map((w) => (
                <div
                  key={w}
                  className="flex items-center justify-between rounded-md border border-paper-300 bg-paper-50 px-3 py-2"
                >
                  <span className="text-xs text-ink-700">{w}</span>
                  <button
                    className="text-ink-300 hover:text-red-700"
                    onClick={() => onRemoveWord(w)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-md border border-paper-300 bg-paper-50 px-2 py-2">
      <div
        className={`text-sm font-semibold ${warn ? 'text-amber-700' : 'text-ink-800'}`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-ink-300">{label}</div>
    </div>
  );
}
