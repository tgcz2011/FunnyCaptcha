import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type SpotDiffChallenge } from './challenge.js';

// 服务端签发题目
export function issueSpotDiffChallenge(): { challenge: SpotDiffChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return { challenge, payload: { gridA: challenge.gridA, gridB: challenge.gridB } };
}

// 服务端校验 proof
export async function verifySpotDiffProof(
  challenge: SpotDiffChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(proofInput(challenge));
  return expected === proof;
}
