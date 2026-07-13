import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createMathInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const mathPlugin: CaptchaPlugin = {
  id: 'math',
  category: 'recognize',
  create: createMathInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '算术题' : 'Arithmetic',
    description: locale === 'zh'
      ? '简单的加减乘除题，经典又轻量'
      : 'Simple arithmetic. Classic and lightweight.',
    tags: ['math', 'classic', 'easy'],
  }),
};

defineCaptcha(mathPlugin);

export function mountMath(container: HTMLElement, config: CaptchaConfig) {
  return createMathInstance(container, config);
}
