// 反人类讽刺验证码：表面"证明你是人类"，实则给机器人留了后门
export interface AntiBotChallenge {
  // 令牌，用于构造 proof
  token: string;
  // 后门密钥（讽刺：服务端竟然真的认它）
  bypassKey: string;
}

// 生成题目：随机 token + 带固定前缀的后门密钥
export function generateChallenge(): AntiBotChallenge {
  // 复用 UUID 去掉横线作为随机串
  const token = crypto.randomUUID().replace(/-/g, '');
  const suffix = crypto.randomUUID().slice(0, 8);
  return {
    token,
    bypassKey: `__funnyCaptchaPass_${suffix}`,
  };
}

// 校验后门密钥（讽刺：服务端真的认这个）
export function verifyBypass(c: AntiBotChallenge, userInput: string): boolean {
  return userInput === c.bypassKey;
}

// 构造 proof 输入串：token:human
export function proofInput(c: AntiBotChallenge): string {
  return `${c.token}:human`;
}
