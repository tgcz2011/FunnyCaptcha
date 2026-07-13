import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type ClickOrderChallenge } from './challenge.js';

export function issueClickOrderChallenge(): { challenge: ClickOrderChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return { challenge, payload: { order: challenge.order } };
}

export async function verifyClickOrderProof(
  challenge: ClickOrderChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(proofInput(challenge));
  return expected === proof;
}
