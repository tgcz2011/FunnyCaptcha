// 文字点选题目：随机选 3-4 个常用汉字，随机位置放置（最小间距 100px）
// 用户按提示顺序依次点击对应汉字

export interface ClickTextChallenge {
  // 按顺序需要点击的汉字（同时是提示中展示的顺序）
  chars: string[];
  // 每个汉字在画布上的位置（与 chars 一一对应）
  positions: { x: number; y: number }[];
}

// 常用汉字池
const COMMON_CHARS = [
  '的', '了', '是', '在', '有', '人', '这', '中',
  '大', '为', '上', '个', '国', '我', '以', '要',
  '他', '时', '来', '用', '们', '地', '到', '可',
];

// 画布尺寸
const AREA_W = 320;
const AREA_H = 200;
const MARGIN = 30;
const MIN_DIST = 100;

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

// 在画布内随机放置 count 个点，任意两点距离不小于 minDist
function placePositions(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  let attempts = 0;
  while (positions.length < count && attempts < 2000) {
    attempts++;
    const x = MARGIN + Math.random() * (AREA_W - MARGIN * 2);
    const y = MARGIN + Math.random() * (AREA_H - MARGIN * 2);
    const ok = positions.every(p => Math.hypot(p.x - x, p.y - y) >= MIN_DIST);
    if (ok) positions.push({ x, y });
  }
  return positions;
}

// 生成题目：随机选 3-4 个常用汉字，随机位置放置
export function generateChallenge(): ClickTextChallenge {
  const count = randInt(3, 4);
  const chars = shuffle(COMMON_CHARS).slice(0, count);
  const positions = placePositions(count);
  return { chars, positions };
}

// 构造 proof 输入串：chars 拼接 + ':completed'
export function proofInput(c: ClickTextChallenge): string {
  return `${c.chars.join('')}:completed`;
}

// 校验用户点击顺序是否正确
export function verifyOrder(c: ClickTextChallenge, userOrder: string[]): boolean {
  if (userOrder.length !== c.chars.length) return false;
  return userOrder.every((v, i) => v === c.chars[i]);
}
