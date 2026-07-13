import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createTextDistortInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const textDistortPlugin: CaptchaPlugin = {
  id: 'text-distort',
  category: 'recognize',
  create: createTextDistortInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '扭曲文字' : 'Distorted Text',
    description: locale === 'zh'
      ? 'Canvas 绘制的扭曲字符，经典验证码形态'
      : 'Canvas-drawn distorted characters. The classic look.',
    tags: ['text', 'canvas', 'classic'],
  }),
};

defineCaptcha(textDistortPlugin);

export function mountTextDistort(container: HTMLElement, config: CaptchaConfig) {
  return createTextDistortInstance(container, config);
}
