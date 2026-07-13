import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyAnswer } from '../src/challenge.js';

describe('emoji-match challenge', () => {
  it('生成合法题目：描述、正确答案与 6 个选项', () => {
    const c = generateChallenge('zh');
    expect(c.description).toBeTruthy();
    expect(c.correct).toBeTruthy();
    expect(c.options).toHaveLength(6);
    // 正确答案必须在选项中
    expect(c.options).toContain(c.correct);
    // 选项不重复
    expect(new Set(c.options).size).toBe(6);
  });

  it('校验正确答案', () => {
    const c = generateChallenge();
    expect(verifyAnswer(c, c.correct)).toBe(true);
  });

  it('拒绝错误答案', () => {
    const c = generateChallenge();
    // 选一个非正确的选项
    const wrong = c.options.find(o => o !== c.correct)!;
    expect(verifyAnswer(c, wrong)).toBe(false);
  });

  it('支持中英文描述切换', () => {
    const zh = generateChallenge('zh');
    const en = generateChallenge('en');
    expect(zh.description).not.toBe(en.description);
  });
});
