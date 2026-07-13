import { describe, it, expect } from 'vitest';
import { hashProof } from '../src/proof.js';

describe('proof', () => {
  it('hashes input deterministically', async () => {
    const a = await hashProof('hello');
    const b = await hashProof('hello');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
  it('differs for different inputs', async () => {
    const a = await hashProof('hello');
    const b = await hashProof('world');
    expect(a).not.toBe(b);
  });
});
