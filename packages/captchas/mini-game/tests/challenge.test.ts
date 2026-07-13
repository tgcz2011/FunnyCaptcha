import { describe, it, expect } from 'vitest';
import {
  generateChallenge,
  verifyScore,
  proofInput,
  type MiniGameChallenge,
} from '../src/challenge.js';

describe('mini-game challenge', () => {
  it('生成合法的打地鼠题目（目标分、时限、令牌）', () => {
    const c = generateChallenge();
    expect(c.targetScore).toBe(10);
    expect(c.timeLimit).toBe(30000);
    expect(typeof c.gameToken).toBe('string');
    expect(c.gameToken.length).toBeGreaterThan(0);
  });

  it('每次生成的 gameToken 不同', () => {
    const a = generateChallenge();
    const b = generateChallenge();
    expect(a.gameToken).not.toBe(b.gameToken);
  });

  it('verifyScore 达到目标分即通过（含超出）', () => {
    const c = generateChallenge();
    expect(verifyScore(c, 10)).toBe(true);
    expect(verifyScore(c, 15)).toBe(true);
  });

  it('verifyScore 未达目标分失败', () => {
    const c = generateChallenge();
    expect(verifyScore(c, 0)).toBe(false);
    expect(verifyScore(c, 9)).toBe(false);
  });

  it('proof 输入为 gameToken:targetScore', () => {
    const c: MiniGameChallenge = { targetScore: 10, timeLimit: 30000, gameToken: 'abc' };
    expect(proofInput(c)).toBe('abc:10');
  });
});
