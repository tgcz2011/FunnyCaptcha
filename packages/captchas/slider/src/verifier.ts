import { generateChallenge, verifyCompleted, type SliderChallenge } from './challenge.js';

export function issueSliderChallenge(): { challenge: SliderChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return { challenge, payload: { token: challenge.token } };
}

export async function verifySliderProof(
  challenge: SliderChallenge,
  proof: string,
): Promise<boolean> {
  return verifyCompleted(challenge, proof);
}
