import { hashProof } from '@funnycaptcha/core';

// 滑动拼图题目：包含一个随机 token，用户拖到终点后用 token 构造 proof
export interface SliderChallenge {
  token: string;
}

// 生成随机 token（用于构造 proof）
export function generateChallenge(): SliderChallenge {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return { token };
}

// 构造 proof 输入串：token + ':completed'
export function proofInput(c: SliderChallenge): string {
  return `${c.token}:completed`;
}

// 校验完成 proof：hashProof(token + ':completed') === proof
export async function verifyCompleted(c: SliderChallenge, proof: string): Promise<boolean> {
  const expected = await hashProof(proofInput(c));
  return expected === proof;
}
