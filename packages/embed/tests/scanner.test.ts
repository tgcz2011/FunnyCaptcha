import { describe, it, expect, beforeEach } from 'vitest';
import { scan } from '../src/scanner.js';

describe('scanner', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('finds all [data-funny-captcha] elements', () => {
    document.body.innerHTML = `
      <div data-funny-captcha data-type="math"></div>
      <div data-funny-captcha data-type="text-distort" data-locale="en"></div>
      <div>not a captcha</div>
    `;
    const items = scan();
    expect(items).toHaveLength(2);
    expect(items[0]!.type).toBe('math');
    expect(items[1]!.locale).toBe('en');
  });
  it('uses default locale zh when missing', () => {
    document.body.innerHTML = `<div data-funny-captcha data-type="math"></div>`;
    const items = scan();
    expect(items[0]!.locale).toBe('zh');
  });
  it('uses default theme light when missing', () => {
    document.body.innerHTML = `<div data-funny-captcha data-type="math"></div>`;
    const items = scan();
    expect(items[0]!.theme).toBe('light');
  });
  it('respects data-theme dark', () => {
    document.body.innerHTML = `<div data-funny-captcha data-type="math" data-theme="dark"></div>`;
    const items = scan();
    expect(items[0]!.theme).toBe('dark');
  });
});
