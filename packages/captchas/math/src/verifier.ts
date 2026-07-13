import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, type MathChallenge } from './challenge.js';

export function issueMathChallenge(): { challenge: MathChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return { challenge, payload: { question: challenge.question } };
}

export async function verifyMathProof(
  challenge: MathChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(`${challenge.question}=${challenge.answer}`);
  return expected === proof;
}
