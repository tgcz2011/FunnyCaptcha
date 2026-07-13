import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyAnswer } from '../src/challenge.js';

describe('meme-quiz challenge', () => {
  it('从题库生成合法题目：问题、正确答案与 4 个选项', () => {
    const c = generateChallenge();
    expect(c.question).toBeTruthy();
    expect(c.correct).toBeTruthy();
    expect(c.options).toHaveLength(4);
    // 正确答案必须在选项中
    expect(c.options).toContain(c.correct);
    // 选项不重复
    expect(new Set(c.options).size).toBe(4);
  });

  it('校验正确答案', () => {
    const c = generateChallenge();
    expect(verifyAnswer(c, c.correct)).toBe(true);
  });

  it('拒绝错误答案', () => {
    const c = generateChallenge();
    const wrong = c.options.find(o => o !== c.correct)!;
    expect(verifyAnswer(c, wrong)).toBe(false);
  });

  it('生成的题目来自预设题库', () => {
    const knownQuestions = ['🐱+🍞 = ?', '🐊+🦛 = ?', '🐶+🌭 = ?', '🦆+🧅 = ?', '🐍+📱 = ?'];
    const c = generateChallenge();
    expect(knownQuestions).toContain(c.question);
  });
});
