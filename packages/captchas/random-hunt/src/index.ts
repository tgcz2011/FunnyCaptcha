import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createRandomHuntInstance } from './render.js';

export * from './challenge.js';

export const randomHuntPlugin: CaptchaPlugin = {
  id: 'random-hunt',
  category: 'game',
  create: createRandomHuntInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '随机数猎手' : 'Random Hunter',
    description: locale === 'zh'
      ? '数字飞速变化，在满足条件的瞬间按下捕获'
      : 'Numbers flash fast — catch the moment it matches the rule.',
    tags: ['game', 'reaction', 'timed'],
  }),
};

defineCaptcha(randomHuntPlugin);

export function mountRandomHunt(container: HTMLElement, config: CaptchaConfig) {
  return createRandomHuntInstance(container, config);
}
