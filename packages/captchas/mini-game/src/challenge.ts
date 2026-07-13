// 打地鼠题目：限时内击中地鼠达到目标分数即通过
export interface MiniGameChallenge {
  // 目标分数（达到即通过）
  targetScore: number;
  // 游戏令牌，用于构造 proof
  gameToken: string;
  // 时间限制（毫秒）
  timeLimit: number;
}

// 生成题目：目标 10 分，限时 30 秒，随机令牌
export function generateChallenge(): MiniGameChallenge {
  return {
    targetScore: 10,
    timeLimit: 30000,
    gameToken: crypto.randomUUID(),
  };
}

// 校验用户得分是否达到目标分数
export function verifyScore(c: MiniGameChallenge, userScore: number): boolean {
  return userScore >= c.targetScore;
}

// 构造 proof 输入串：gameToken:targetScore
export function proofInput(c: MiniGameChallenge): string {
  return `${c.gameToken}:${c.targetScore}`;
}
