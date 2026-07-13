import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type RotateChallenge } from './challenge.js';

export function issueRotateChallenge(): { challenge: RotateChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return { challenge, payload: { angle: challenge.angle } };
}

export async function verifyRotateProof(
  challenge: RotateChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(proofInput(challenge));
  return expected === proof;
}
