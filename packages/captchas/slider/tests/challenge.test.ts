import { describe, it, expect } from 'vitest';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, verifyCompleted, proofInput } from '../src/challenge.js';

describe('slider challenge', () => {
  it('生成非空且唯一的 token', () => {
    const c = generateChallenge();
    expect(typeof c.token).toBe('string');
    expect(c.token.length).toBeGreaterThan(0);
    // 每次生成的 token 不同
    expect(generateChallenge().token).not.toBe(c.token);
  });

  it('校验正确的 proof', async () => {
    const c = generateChallenge();
    const proof = await hashProof(proofInput(c));
    expect(await verifyCompleted(c, proof)).toBe(true);
  });

  it('拒绝错误的 proof', async () => {
    const c = generateChallenge();
    expect(await verifyCompleted(c, 'invalid-proof')).toBe(false);
    expect(await verifyCompleted(c, '')).toBe(false);
  });
});
