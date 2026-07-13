import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyOrder, proofInput } from '../src/challenge.js';

describe('click-order challenge', () => {
  it('生成打乱的 targets 与正确顺序 [1,2,3,4]', () => {
    const c = generateChallenge();
    expect(c.order).toEqual([1, 2, 3, 4]);
    expect(c.targets).toHaveLength(4);
    // targets 是 [1,2,3,4] 的一个排列
    expect([...c.targets].sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
  });

  it('校验正确的点击顺序', () => {
    const c = generateChallenge();
    expect(verifyOrder(c, [1, 2, 3, 4])).toBe(true);
  });

  it('拒绝错误的点击顺序', () => {
    const c = generateChallenge();
    expect(verifyOrder(c, [4, 3, 2, 1])).toBe(false);
    expect(verifyOrder(c, [1, 2, 3])).toBe(false); // 长度不足
    expect(verifyOrder(c, [1, 2, 3, 4, 5])).toBe(false); // 长度超出
  });

  it('proof 输入为顺序的逗号连接', () => {
    const c = generateChallenge();
    expect(proofInput(c)).toBe('1,2,3,4');
  });
});
