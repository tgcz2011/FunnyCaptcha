import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyAnswer } from '../src/challenge.js';

describe('math challenge', () => {
  it('generates a solvable challenge', () => {
    const c = generateChallenge();
    expect(c.question).toMatch(/^\d+ [+*/-] \d+ = \?$/);
    // 答案与题面一致
    const expr = c.question.replace(' = ?', '');
    const expected = eval(expr) as number;
    expect(c.answer).toBe(expected);
  });
  it('verifies correct answer', () => {
    const c = generateChallenge();
    expect(verifyAnswer(c, c.answer)).toBe(true);
  });
  it('rejects wrong answer', () => {
    const c = generateChallenge();
    expect(verifyAnswer(c, c.answer + 1)).toBe(false);
  });
});
