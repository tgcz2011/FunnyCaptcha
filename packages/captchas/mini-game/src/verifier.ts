import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type MiniGameChallenge } from './challenge.js';

export function issueMiniGameChallenge(): { challenge: MiniGameChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return {
    challenge,
    payload: { targetScore: challenge.targetScore, timeLimit: challenge.timeLimit },
  };
}

export async function verifyMiniGameProof(
  challenge: MiniGameChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(proofInput(challenge));
  return expected === proof;
}
