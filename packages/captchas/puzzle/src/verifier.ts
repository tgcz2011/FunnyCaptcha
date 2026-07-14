import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type PuzzleChallenge } from './challenge.js';

export function issuePuzzleChallenge(): { challenge: PuzzleChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return { challenge, payload: { gapPosition: challenge.gapPosition } };
}

export async function verifyPuzzleProof(
  challenge: PuzzleChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(proofInput(challenge));
  return expected === proof;
}
