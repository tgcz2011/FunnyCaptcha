import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, type TextChallenge } from './challenge.js';

export function issueTextChallenge(): { challenge: TextChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return { challenge, payload: {} }; // payload 空：图由前端画，不传 code
}

export async function verifyTextProof(c: TextChallenge, proof: string): Promise<boolean> {
  const expected = await hashProof(c.code.toLowerCase());
  return expected === proof;
}
