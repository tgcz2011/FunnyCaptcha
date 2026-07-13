import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type AntiBotChallenge } from './challenge.js';

export function issueAntiBotChallenge(): { challenge: AntiBotChallenge; payload: unknown } {
  const challenge = generateChallenge();
  // 讽刺：payload 里居然把 bypassKey 明文返回给前端
  return {
    challenge,
    payload: { token: challenge.token, bypassKey: challenge.bypassKey },
  };
}

export async function verifyAntiBotProof(
  challenge: AntiBotChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(proofInput(challenge));
  return expected === proof;
}
