import { describe, it, expect, beforeEach } from 'vitest';
import { defineCaptcha, getCaptcha, listCaptchas, resetRegistry } from '../src/registry.js';
import type { CaptchaPlugin } from '../src/types.js';

function makePlugin(id: string): CaptchaPlugin {
  return {
    id,
    category: 'recognize',
    create: () => ({ mount() {}, reset() {}, destroy() {}, onResult() {} }),
    describe: () => ({ name: id, description: '', tags: [] }),
  };
}

describe('registry', () => {
  beforeEach(() => resetRegistry());

  it('registers and retrieves a plugin', () => {
    const p = makePlugin('math');
    defineCaptcha(p);
    expect(getCaptcha('math')).toBe(p);
  });
  it('lists all registered plugins', () => {
    defineCaptcha(makePlugin('math'));
    defineCaptcha(makePlugin('slider'));
    expect(listCaptchas().map(p => p.id).sort()).toEqual(['math', 'slider']);
  });
  it('throws on duplicate id', () => {
    defineCaptcha(makePlugin('math'));
    expect(() => defineCaptcha(makePlugin('math'))).toThrow(/already registered/);
  });
  it('returns undefined for unknown id', () => {
    expect(getCaptcha('nope')).toBeUndefined();
  });
});
