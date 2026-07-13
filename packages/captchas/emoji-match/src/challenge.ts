import type { Locale } from '@funnycaptcha/core';

// 表情匹配题目：根据描述从 6 个 emoji 中选出正确的
export interface EmojiMatchChallenge {
  // 表情描述
  description: string;
  // 正确 emoji
  correct: string;
  // 6 个备选 emoji（含正确答案）
  options: string[];
}

// 预设表情数据
interface Preset {
  emoji: string;
  zh: string;
  en: string;
}

const PRESETS: Preset[] = [
  { emoji: '😀', zh: '开心的表情', en: 'Happy face' },
  { emoji: '😢', zh: '伤心的表情', en: 'Sad face' },
  { emoji: '😠', zh: '生气的表情', en: 'Angry face' },
  { emoji: '😴', zh: '困倦的表情', en: 'Sleepy face' },
  { emoji: '🤔', zh: '思考的表情', en: 'Thinking face' },
  { emoji: '😍', zh: '爱慕的表情', en: 'Loving face' },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fisher-Yates 洗牌
function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

// 生成题目：随机选一个表情作为正确答案，6 个备选项为全部预设表情的乱序
export function generateChallenge(locale: Locale = 'zh'): EmojiMatchChallenge {
  const preset = PRESETS[randInt(0, PRESETS.length - 1)]!;
  const description = locale === 'zh' ? preset.zh : preset.en;
  // 备选项为全部 6 个预设表情打乱顺序
  const options = shuffle(PRESETS.map(p => p.emoji));
  return { description, correct: preset.emoji, options };
}

// 校验用户选择的 emoji 是否正确
export function verifyAnswer(c: EmojiMatchChallenge, userPick: string): boolean {
  return c.correct === userPick;
}
