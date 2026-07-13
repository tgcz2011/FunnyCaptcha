// 旋转对齐题目：图形被旋转了 angle 度，用户拖动滑块校正使其回正（误差 < 5°）
export interface RotateChallenge {
  // 目标校正角度（0-359），即图形初始的偏转量；用户需反向校正使其回正
  angle: number;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成 30-330 之间的角度（避免太接近 0/360 导致一眼即过）
export function generateChallenge(): RotateChallenge {
  return { angle: randInt(30, 330) };
}

// 校验对齐：最终旋转 = angle + userAngle，回正即 ≡ 0 (mod 360)，误差 <= tolerance
export function verifyAlignment(c: RotateChallenge, userAngle: number, tolerance = 5): boolean {
  const final = (((c.angle + userAngle) % 360) + 360) % 360;
  // 取到 0/360 的最短距离
  const diff = Math.min(final, 360 - final);
  return diff <= tolerance;
}

// 构造 proof 输入串：angle + ':aligned'
export function proofInput(c: RotateChallenge): string {
  return `${c.angle}:aligned`;
}
