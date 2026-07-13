import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createClickOrderInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const clickOrderPlugin: CaptchaPlugin = {
  id: 'click-order',
  category: 'interactive',
  create: createClickOrderInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '点选顺序' : 'Click Order',
    description: locale === 'zh'
      ? '按数字顺序依次点击目标，考验眼手协调'
      : 'Click targets in numeric order. Tests coordination.',
    tags: ['click', 'order', 'interactive'],
  }),
};

defineCaptcha(clickOrderPlugin);

export function mountClickOrder(container: HTMLElement, config: CaptchaConfig) {
  return createClickOrderInstance(container, config);
}
