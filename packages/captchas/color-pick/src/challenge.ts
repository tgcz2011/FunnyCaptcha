import type { Locale } from '@funnycaptcha/core';

// 颜色选择题目：从 6-9 个彩色方块中点击指定颜色
export interface ColorPickChallenge {
  // 目标颜色规范名（如 red），用于构造 proof
  targetColor: string;
  // 目标颜色 hex
  targetHex: string;
  // 备选方块（含目标），6-9 个
  options: { name: string; hex: string }[];
}

interface ColorDef {
  name: string;
  zh: string;
  en: string;
  hex: string;
}

// 颜色列表
const COLORS: ColorDef[] = [
  { name: 'red', zh: '红色', en: 'red', hex: '#ef4444' },
  { name: 'blue', zh: '蓝色', en: 'blue', hex: '#3b82f6' },
  { name: 'green', zh: '绿色', en: 'green', hex: '#22c55e' },
  { name: 'yellow', zh: '黄色', en: 'yellow', hex: '#eab308' },
  { name: 'purple', zh: '紫色', en: 'purple', hex: '#a855f7' },
  { name: 'orange', zh: '橙色', en: 'orange', hex: '#f97316' },
  { name: 'pink', zh: '粉色', en: 'pink', hex: '#ec4899' },
  { name: 'cyan', zh: '青色', en: 'cyan', hex: '#06b6d4' },
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

// 取颜色的本地化名称
export function colorLabel(name: string, locale: Locale): string {
  const c = COLORS.find(c => c.name === name);
  return c ? (locale === 'zh' ? c.zh : c.en) : name;
}

// 生成题目：随机选一个目标颜色 + 5-8 个干扰色，共 6-9 个方块
export function generateChallenge(): ColorPickChallenge {
  const target = COLORS[randInt(0, COLORS.length - 1)]!;
  const distractorCount = randInt(5, 8);
  const others = COLORS.filter(c => c.name !== target.name);
  const distractors = shuffle(others).slice(0, Math.min(distractorCount, others.length));
  const options = shuffle([
    { name: target.name, hex: target.hex },
    ...distractors.map(d => ({ name: d.name, hex: d.hex })),
  ]);
  return { targetColor: target.name, targetHex: target.hex, options };
}

// 构造 proof 输入串：targetColor + ':completed'
export function proofInput(c: ColorPickChallenge): string {
  return `${c.targetColor}:completed`;
}

// 校验用户点击的 hex 是否为目标颜色
export function verifyAnswer(c: ColorPickChallenge, userPickHex: string): boolean {
  return c.targetHex === userPickHex;
}
