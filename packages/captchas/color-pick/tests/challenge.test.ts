import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyAnswer, proofInput, colorLabel } from '../src/challenge.js';

describe('color-pick challenge', () => {
  it('生成合法题目：目标颜色与 6-9 个方块', () => {
    const c = generateChallenge();
    expect(c.targetColor).toBeTruthy();
    expect(c.targetHex).toMatch(/^#[0-9a-f]{6}$/i);
    expect(c.options.length).toBeGreaterThanOrEqual(6);
    expect(c.options.length).toBeLessThanOrEqual(9);
    // 目标颜色必须在选项中
    expect(c.options.some(o => o.hex === c.targetHex)).toBe(true);
    // 选项颜色不重复
    expect(new Set(c.options.map(o => o.hex)).size).toBe(c.options.length);
  });

  it('校验正确答案', () => {
    const c = generateChallenge();
    expect(verifyAnswer(c, c.targetHex)).toBe(true);
  });

  it('拒绝错误答案', () => {
    const c = generateChallenge();
    const wrong = c.options.find(o => o.hex !== c.targetHex)!;
    expect(verifyAnswer(c, wrong.hex)).toBe(false);
  });

  it('colorLabel 支持中英文', () => {
    expect(colorLabel('red', 'zh')).toBe('红色');
    expect(colorLabel('red', 'en')).toBe('red');
  });

  it('proof 输入为 targetColor + :completed', () => {
    const c = generateChallenge();
    expect(proofInput(c)).toBe(`${c.targetColor}:completed`);
  });
});
