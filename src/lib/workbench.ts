// 《Nowhere to Everywhere》改文工作台 · 核心数据与工具

export interface Chapter {
  id: string;
  title: string;
  source: string; // 原文（跑团存档）
  draft: string; // 改写稿
  status: 'pending' | 'wip' | 'done';
  updatedAt: number;
}

export interface WorkbenchState {
  chapters: Chapter[];
  activeId: string | null;
  bannedWords: string[];
  checklist: Record<string, boolean>;
}

export const STATUS_LABEL: Record<Chapter['status'], string> = {
  pending: '未改',
  wip: '改中',
  done: '已改',
};

export const STATUS_NEXT: Record<Chapter['status'], Chapter['status']> = {
  pending: 'wip',
  wip: 'done',
  done: 'pending',
};

// 抢救规范⑥·AI 套皮违禁词表 + 锐评指出的高频复读
export const DEFAULT_BANNED: string[] = [
  '眼底闪过一丝',
  '嘴角勾起',
  '殊不知',
  '心里一暖',
  '宠溺',
  '凉丝丝的鼻尖',
  '惯常的欠揍表情',
  '异瞳一红一灰',
];

// 正式文抢救规范（动笔时执行）
export const CHECKLIST_ITEMS: string[] = [
  '拼写统一：哈妮娅、维纳',
  'Blizzard-V4 = Regalia 旗舰全称统一',
  '考试流程按简章顺序（报名→线下培训→笔试→模拟战）',
  '赛车结尾补坠车一拍（急刹甩尾铲倒嘚瑟的卡厄斯）',
  'POV 统一零单一视角（卡厄斯只留客观镜头与对话）',
  'AI 套皮剥除：违禁词清零 + 遮名测试 + 情绪只走动作',
];

// 粗口密度统计词（锐评：密度偏高，首屏尤其要压）
export const PROFANITY_WORDS = ['操', '他妈', '妈的', '卧槽'];

export interface BannedHit {
  word: string;
  index: number; // 在全文中的位置
  context: string; // 上下文片段
}

export function scanBanned(text: string, words: string[]): BannedHit[] {
  const hits: BannedHit[] = [];
  for (const w of words) {
    if (!w.trim()) continue;
    let i = 0;
    while (true) {
      const idx = text.indexOf(w, i);
      if (idx === -1) break;
      const start = Math.max(0, idx - 12);
      const end = Math.min(text.length, idx + w.length + 12);
      hits.push({
        word: w,
        index: idx,
        context: text.slice(start, end).replace(/\n/g, '⏎'),
      });
      i = idx + w.length;
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

export function countProfanity(text: string): { total: number; perK: string } {
  let total = 0;
  for (const w of PROFANITY_WORDS) {
    let i = 0;
    while (true) {
      const idx = text.indexOf(w, i);
      if (idx === -1) break;
      total++;
      i = idx + w.length;
    }
  }
  const perK = text.length > 0 ? ((total / text.length) * 1000).toFixed(1) : '0.0';
  return { total, perK };
}

// POV 标记扫描：跑团存档里的角色段标与星号动作行
export function countPovMarkers(source: string): {
  roleHeaders: number;
  starLines: number;
} {
  const lines = source.split('\n');
  let roleHeaders = 0;
  let starLines = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^(\*\*|【)[^*\n】]{1,12}(\*\*|】)$/.test(line)) roleHeaders++;
    if (/^\*.+\*$/.test(line)) starLines++;
  }
  return { roleHeaders, starLines };
}

// 存档清洗：给改写稿一个起点（不替人改文，只拆跑团格式）
export function cleanArchive(source: string): string {
  return source
    .replace(/\r\n/g, '\n')
    .replace(/^\*\*(.+?)\*\*\s*$/gm, '—— $1 ——') // 段标转场记
    .replace(/\*\*(.+?)\*\*/g, '$1') // 去粗体
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function makeChapter(title: string, source = ''): Chapter {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    source,
    draft: '',
    status: 'pending',
    updatedAt: Date.now(),
  };
}

// v2：默认章节从 all.txt 单章改为 articles/1-7 拆解章（旧 v1 数据保留不删）
const STORAGE_KEY = 'nte-workbench-v2';

export function loadState(): WorkbenchState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.chapters)) return null;
    return parsed as WorkbenchState;
  } catch {
    return null;
  }
}

export function saveState(state: WorkbenchState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储满了也不炸，改文不能停
  }
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function countChars(text: string): number {
  return text.replace(/\s/g, '').length;
}
