import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyDiffs, proofInput, type SpotDiffChallenge } from '../src/challenge.js';

describe('spot-diff challenge', () => {
  it('生成合法的两个网格且恰好两处不同', () => {
    const c = generateChallenge();
    expect(c.gridA).toHaveLength(9);
    expect(c.gridB).toHaveLength(9);
    expect(c.diffs).toHaveLength(2);
    // diffs 升序且不重复
    expect(c.diffs[0]!).toBeLessThan(c.diffs[1]!);
    // 仅在差异位置两网格不同
    let diffCount = 0;
    for (let i = 0; i < 9; i++) {
      if (c.gridA[i] !== c.gridB[i]) diffCount++;
    }
    expect(diffCount).toBe(2);
    // 差异位置应与实际不同位置一致
    for (const pos of c.diffs) {
      expect(c.gridA[pos]).not.toBe(c.gridB[pos]);
    }
  });

  it('校验正确的差异位置', () => {
    const c = generateChallenge();
    expect(verifyDiffs(c, c.diffs)).toBe(true);
    // 乱序传入也应通过
    expect(verifyDiffs(c, [c.diffs[1]!, c.diffs[0]!])).toBe(true);
  });

  it('拒绝错误的差异位置', () => {
    const c = generateChallenge();
    // 构造一个错误位置集合（数量相同但位置不同）
    const wrong = [0, 1].filter(i => !c.diffs.includes(i));
    if (wrong.length === 2) {
      expect(verifyDiffs(c, wrong)).toBe(false);
    }
    // 数量不符直接拒绝
    expect(verifyDiffs(c, [c.diffs[0]!])).toBe(false);
  });

  it('proofInput 为升序逗号连接', () => {
    const c: SpotDiffChallenge = { gridA: [], gridB: [], diffs: [5, 2] };
    expect(proofInput(c)).toBe('2,5');
  });
});
