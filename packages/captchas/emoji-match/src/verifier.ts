import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, type EmojiMatchChallenge } from './challenge.js';

// 服务端签发题目（默认中文描述）
export function issueEmojiMatchChallenge(): { challenge: EmojiMatchChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return { challenge, payload: { description: challenge.description, options: challenge.options } };
}

// 服务端校验 proof
export async function verifyEmojiMatchProof(
  challenge: EmojiMatchChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(challenge.correct);
  return expected === proof;
}
