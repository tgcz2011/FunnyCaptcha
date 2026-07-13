import { describe, it, expect } from 'vitest';
import { issueToken, verifyToken } from '../src/token.js';

describe('token', () => {
  it('issues unique non-empty tokens', async () => {
    const a = await issueToken('slider', 60_000);
    const b = await issueToken('slider', 60_000);
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });
  it('verifies a token signed by itself', async () => {
    const t = await issueToken('math', 60_000);
    const r = await verifyToken(t);
    expect(r.valid).toBe(true);
    expect(r.type).toBe('math');
  });
  it('rejects tampered token', async () => {
    const t = await issueToken('math', 60_000);
    expect((await verifyToken(t + 'x')).valid).toBe(false);
  });
  it('respects expiry', async () => {
    const t = await issueToken('math', -1);
    expect((await verifyToken(t)).valid).toBe(false);
  });
});
