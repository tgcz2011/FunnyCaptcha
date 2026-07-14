import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyOrder, proofInput } from '../src/challenge.js';

describe('click-text challenge', () => {
  it('生成 3-4 个汉字与对应位置', () => {
    const c = generateChallenge();
    expect(c.chars.length).toBeGreaterThanOrEqual(3);
    expect(c.chars.length).toBeLessThanOrEqual(4);
    expect(c.positions).toHaveLength(c.chars.length);
    // 汉字不重复
    expect(new Set(c.chars).size).toBe(c.chars.length);
  });

  it('位置任意两点距离不小于 100px', () => {
    const c = generateChallenge();
    for (let i = 0; i < c.positions.length; i++) {
      for (let j = i + 1; j < c.positions.length; j++) {
        const a = c.positions[i]!;
        const b = c.positions[j]!;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(100);
      }
    }
  });

  it('校验正确的点击顺序', () => {
    const c = generateChallenge();
    expect(verifyOrder(c, [...c.chars])).toBe(true);
  });

  it('拒绝错误的点击顺序', () => {
    const c = generateChallenge();
    const reversed = [...c.chars].reverse();
    expect(verifyOrder(c, reversed)).toBe(false);
    expect(verifyOrder(c, c.chars.slice(0, -1))).toBe(false); // 长度不足
  });

  it('proof 输入为汉字拼接 + :completed', () => {
    const c = generateChallenge();
    expect(proofInput(c)).toBe(`${c.chars.join('')}:completed`);
  });
});
