import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, type MemeQuizChallenge } from './challenge.js';

// 服务端签发题目
export function issueMemeQuizChallenge(): { challenge: MemeQuizChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return { challenge, payload: { question: challenge.question, options: challenge.options } };
}

// 服务端校验 proof
export async function verifyMemeQuizProof(
  challenge: MemeQuizChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(challenge.correct);
  return expected === proof;
}
