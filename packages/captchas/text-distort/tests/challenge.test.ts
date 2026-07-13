import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyAnswer } from '../src/challenge.js';

describe('text-distort challenge', () => {
  it('generates a 4-6 char code', () => {
    const c = generateChallenge();
    expect(c.code.length).toBeGreaterThanOrEqual(4);
    expect(c.code.length).toBeLessThanOrEqual(6);
  });
  it('verifies case-insensitive', () => {
    const c = generateChallenge();
    expect(verifyAnswer(c, c.code.toUpperCase())).toBe(true);
    expect(verifyAnswer(c, c.code.toLowerCase())).toBe(true);
  });
  it('rejects wrong', () => {
    const c = generateChallenge();
    expect(verifyAnswer(c, c.code + 'x')).toBe(false);
  });
});
