import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyAlignment, proofInput } from '../src/challenge.js';

describe('rotate challenge', () => {
  it('生成 30-330 之间的角度', () => {
    for (let i = 0; i < 50; i++) {
      const c = generateChallenge();
      expect(c.angle).toBeGreaterThanOrEqual(30);
      expect(c.angle).toBeLessThanOrEqual(330);
    }
  });

  it('校验正确对齐（误差 <= 5）', () => {
    const c = generateChallenge();
    // 校正量 = (360 - angle) → 回正
    const correction = (360 - c.angle) % 360;
    expect(verifyAlignment(c, correction)).toBe(true);
    // 边界：误差恰好 5 度
    expect(verifyAlignment(c, (correction + 5) % 360)).toBe(true);
  });

  it('拒绝错误对齐（误差 > 5）', () => {
    const c = { angle: 90 };
    expect(verifyAlignment(c, 0)).toBe(false); // 不校正，仍偏 90°
    expect(verifyAlignment(c, 45)).toBe(false);
    expect(verifyAlignment(c, 180)).toBe(false);
  });

  it('proof 输入为 angle:aligned', () => {
    const c = { angle: 120 };
    expect(proofInput(c)).toBe('120:aligned');
  });
});
