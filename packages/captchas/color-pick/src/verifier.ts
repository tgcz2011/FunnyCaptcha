import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type ColorPickChallenge } from './challenge.js';

export function issueColorPickChallenge(): { challenge: ColorPickChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return {
    challenge,
    payload: { targetColor: challenge.targetColor, options: challenge.options.map(o => o.hex) },
  };
}

export async function verifyColorPickProof(
  challenge: ColorPickChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(proofInput(challenge));
  return expected === proof;
}
