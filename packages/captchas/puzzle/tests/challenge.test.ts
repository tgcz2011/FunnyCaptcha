import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyPosition, proofInput } from '../src/challenge.js';

describe('puzzle challenge', () => {
  it('生成 0-100 之间的缺口位置', () => {
    const c = generateChallenge();
    expect(c.gapPosition).toBeGreaterThanOrEqual(0);
    expect(c.gapPosition).toBeLessThanOrEqual(100);
  });

  it('容差 ±5 内视为正确', () => {
    const c = generateChallenge();
    expect(verifyPosition(c, c.gapPosition)).toBe(true);
    expect(verifyPosition(c, c.gapPosition + 5)).toBe(true);
    expect(verifyPosition(c, c.gapPosition - 5)).toBe(true);
  });

  it('超出容差视为错误', () => {
    const c = generateChallenge();
    expect(verifyPosition(c, c.gapPosition + 6)).toBe(false);
    expect(verifyPosition(c, c.gapPosition - 6)).toBe(false);
  });

  it('proof 输入为 gapPosition + :completed', () => {
    const c = generateChallenge();
    expect(proofInput(c)).toBe(`${c.gapPosition}:completed`);
  });
});
