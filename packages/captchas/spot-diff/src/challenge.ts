// 找不同题目：两个 3x3 emoji 网格，其中 2 处不同
export interface SpotDiffChallenge {
  // 参考网格（9 个 emoji）
  gridA: string[];
  // 待找不同的网格（9 个 emoji）
  gridB: string[];
  // 差异位置索引（0-8）
  diffs: number[];
}

// emoji 池
const POOL: string[] = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🍉', '🥝'];
const GRID_SIZE = 9;
const DIFF_COUNT = 2;

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

// 从池中挑选一个与 original 不同的 emoji
function pickDifferent(original: string): string {
  let next = POOL[randInt(0, POOL.length - 1)]!;
  while (next === original) {
    next = POOL[randInt(0, POOL.length - 1)]!;
  }
  return next;
}

// 生成题目：gridA 为 9 个不重复 emoji 的随机排列，gridB 在 2 个位置替换为不同 emoji
export function generateChallenge(): SpotDiffChallenge {
  const gridA = shuffle(POOL);
  // 随机选 2 个不重复的位置作为差异
  const positions = shuffle(Array.from({ length: GRID_SIZE }, (_, i) => i));
  const diffs = positions.slice(0, DIFF_COUNT).sort((a, b) => a - b);
  const gridB = gridA.slice();
  for (const pos of diffs) {
    gridB[pos] = pickDifferent(gridA[pos]!);
  }
  return { gridA, gridB, diffs };
}

// 校验用户找出的差异位置是否正确
export function verifyDiffs(c: SpotDiffChallenge, userDiffs: number[]): boolean {
  if (userDiffs.length !== c.diffs.length) return false;
  const sorted = userDiffs.slice().sort((a, b) => a - b);
  return sorted.every((v, i) => v === c.diffs[i]);
}

// 构造 proof 输入串：差异位置升序逗号连接
export function proofInput(c: SpotDiffChallenge): string {
  return c.diffs.slice().sort((a, b) => a - b).join(',');
}
