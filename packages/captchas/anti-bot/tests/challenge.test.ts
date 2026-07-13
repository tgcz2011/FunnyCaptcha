import { describe, it, expect } from 'vitest';
import {
  generateChallenge,
  verifyBypass,
  proofInput,
  type AntiBotChallenge,
} from '../src/challenge.js';

describe('anti-bot challenge', () => {
  it('生成合法的讽刺题目（token 与带前缀的 bypassKey）', () => {
    const c = generateChallenge();
    expect(typeof c.token).toBe('string');
    expect(c.token.length).toBeGreaterThan(0);
    expect(c.bypassKey.startsWith('__funnyCaptchaPass_')).toBe(true);
    // bypassKey 前缀之外还有随机串
    expect(c.bypassKey.length).toBeGreaterThan('__funnyCaptchaPass_'.length);
  });

  it('每次生成的 token 与 bypassKey 都不同', () => {
    const a = generateChallenge();
    const b = generateChallenge();
    expect(a.token).not.toBe(b.token);
    expect(a.bypassKey).not.toBe(b.bypassKey);
  });

  it('verifyBypass 正确密钥通过', () => {
    const c = generateChallenge();
    expect(verifyBypass(c, c.bypassKey)).toBe(true);
  });

  it('verifyBypass 错误密钥失败', () => {
    const c = generateChallenge();
    expect(verifyBypass(c, 'wrong')).toBe(false);
    expect(verifyBypass(c, '')).toBe(false);
  });

  it('proof 输入为 token:human', () => {
    const c: AntiBotChallenge = { token: 'tok', bypassKey: '__funnyCaptchaPass_x' };
    expect(proofInput(c)).toBe('tok:human');
  });
});
