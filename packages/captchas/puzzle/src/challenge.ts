// 拼图缺口题目：随机缺口位置（0-100%），容差 ±8%
export interface PuzzleChallenge {
  // 缺口位置百分比 0-100
  gapPosition: number;
}

const TOLERANCE = 8; // ±8%

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成题目：piece 线性从左到右移动，x = MAX_OFFSET * progress
// pieceLeftPct = (MAX_OFFSET * progress / STAGE_W) * 100 ≈ 83.3 * progress
// gap 范围 20-75 对应 progress 约 0.24-0.90（留出两端余量）
export function generateChallenge(): PuzzleChallenge {
  return { gapPosition: randInt(20, 75) };
}

// 构造 proof 输入串：gapPosition + ':completed'
export function proofInput(c: PuzzleChallenge): string {
  return `${c.gapPosition}:completed`;
}

// 校验用户拖动位置是否在容差范围内
export function verifyPosition(c: PuzzleChallenge, userPos: number): boolean {
  return Math.abs(userPos - c.gapPosition) <= TOLERANCE;
}
