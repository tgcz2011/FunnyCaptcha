import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createClickTextInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const clickTextPlugin: CaptchaPlugin = {
  id: 'click-text',
  category: 'interactive',
  create: createClickTextInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '文字点选' : 'Click Text',
    description: locale === 'zh'
      ? '按指定顺序点击画布上的汉字'
      : 'Click characters on the canvas in the specified order.',
    tags: ['click', 'text', 'interactive'],
  }),
};

defineCaptcha(clickTextPlugin);

export function mountClickText(container: HTMLElement, config: CaptchaConfig) {
  return createClickTextInstance(container, config);
}
