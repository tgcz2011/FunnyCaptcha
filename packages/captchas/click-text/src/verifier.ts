import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type ClickTextChallenge } from './challenge.js';

export function issueClickTextChallenge(): { challenge: ClickTextChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return { challenge, payload: { chars: challenge.chars } };
}

export async function verifyClickTextProof(
  challenge: ClickTextChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(proofInput(challenge));
  return expected === proof;
}
