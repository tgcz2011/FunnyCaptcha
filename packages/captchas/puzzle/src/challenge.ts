// 拼图缺口题目：随机缺口位置（0-100%），容差 ±5%
export interface PuzzleChallenge {
  // 缺口位置百分比 0-100
  gapPosition: number;
}

const TOLERANCE = 8; // ±8%（圆形路径更难精确对齐）

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成题目：缺口位置限制在 piece 圆形路径可达范围内
// piece x = cx + radius*cos(angle) - PIECE_W/2，百分比范围约 19%-64%
// gap 限制在 25-58 确保 piece 一定能对齐
export function generateChallenge(): PuzzleChallenge {
  return { gapPosition: randInt(25, 58) };
}

// 构造 proof 输入串：gapPosition + ':completed'
export function proofInput(c: PuzzleChallenge): string {
  return `${c.gapPosition}:completed`;
}

// 校验用户拖动位置是否在容差范围内
export function verifyPosition(c: PuzzleChallenge, userPos: number): boolean {
  return Math.abs(userPos - c.gapPosition) <= TOLERANCE;
}
