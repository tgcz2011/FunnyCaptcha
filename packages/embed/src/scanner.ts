import type { Locale } from '@funnycaptcha/core';

export interface EmbedTarget {
  el: HTMLElement;
  type: string;
  locale: Locale;
  theme: 'light' | 'dark';
}

export function scan(root: ParentNode = document): EmbedTarget[] {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-funny-captcha]'));
  return els.map(el => ({
    el,
    type: el.dataset.type ?? 'math',
    locale: (el.dataset.locale as Locale) ?? 'zh',
    theme: (el.dataset.theme as 'light' | 'dark') ?? 'light',
  }));
}
