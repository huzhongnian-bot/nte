import { STATUS_LABEL, STATUS_NEXT } from '@/lib/workbench';
import type { Chapter } from '@/lib/workbench';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOT: Record<Chapter['status'], string> = {
  pending: 'bg-paper-400',
  wip: 'bg-amber-600',
  done: 'bg-emerald-700',
};

interface Props {
  chapters: Chapter[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onCycleStatus: (id: string) => void;
}

export function ChapterList({
  chapters,
  activeId,
  onSelect,
  onAdd,
  onRemove,
  onCycleStatus,
}: Props) {
  return (
    <div className="flex h-full flex-col border-r border-paper-300 bg-paper-50">
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-xs font-medium tracking-widest text-ink-400">
          章节
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-ink-400 hover:text-amber-700"
          onClick={onAdd}
          title="新建章节"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 px-2 pb-3">
          {chapters.map((c) => (
            <div
              key={c.id}
              className={cn(
                'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                c.id === activeId
                  ? 'bg-paper-200 text-ink-900'
                  : 'text-ink-500 hover:bg-paper-100 hover:text-ink-800'
              )}
              onClick={() => onSelect(c.id)}
            >
              <button
                className="flex shrink-0 items-center gap-1.5"
                title={`${STATUS_LABEL[c.status]}（点击切换）`}
                onClick={(e) => {
                  e.stopPropagation();
                  onCycleStatus(c.id);
                }}
              >
                <span className={cn('h-2 w-2 rounded-full', DOT[c.status])} />
              </button>
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              <span className="shrink-0 text-[10px] text-ink-300">
                {STATUS_LABEL[c.status]}
              </span>
              <button
                className="hidden shrink-0 text-ink-300 hover:text-red-700 group-hover:block"
                title="删除章节"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`删除「${c.title}」？原文与草稿都会没。`))
                    onRemove(c.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {chapters.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-ink-300">
              没有章节，点右上角 +
            </p>
          )}
        </div>
      </ScrollArea>
      <div className="border-t border-paper-300 px-3 py-2">
        <p className="text-[10px] leading-relaxed text-ink-400">
          草稿自动保存在本浏览器
          <br />
          换电脑/清缓存会丢，记得导出 .md
        </p>
      </div>
    </div>
  );
}

export { STATUS_NEXT };
