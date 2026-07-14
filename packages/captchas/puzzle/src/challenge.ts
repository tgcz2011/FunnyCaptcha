// 拼图缺口题目：随机缺口位置（0-100%），容差 ±5%
export interface PuzzleChallenge {
  // 缺口位置百分比 0-100
  gapPosition: number;
}

const TOLERANCE = 5; // ±5%

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成题目：缺口位置在 10-90 之间（避免贴边导致题目退化）
export function generateChallenge(): PuzzleChallenge {
  return { gapPosition: randInt(10, 90) };
}

// 构造 proof 输入串：gapPosition + ':completed'
export function proofInput(c: PuzzleChallenge): string {
  return `${c.gapPosition}:completed`;
}

// 校验用户拖动位置是否在容差范围内
export function verifyPosition(c: PuzzleChallenge, userPos: number): boolean {
  return Math.abs(userPos - c.gapPosition) <= TOLERANCE;
}
