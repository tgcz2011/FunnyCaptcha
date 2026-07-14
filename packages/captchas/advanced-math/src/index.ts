import { defineCaptcha, type CaptchaConfig } from '@funnycaptcha/core';
import { createAdvancedMathInstance } from './render.js';

export * from './challenge.js';

defineCaptcha({
  id: 'advanced-math',
  category: 'recognize',
  create: createAdvancedMathInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '高等数学' : 'Calculus',
    description: locale === 'zh'
      ? '求导、积分、极限等高等数学题，硬核防机器人'
      : 'Derivatives, integrals and limits — hardcore anti-bot.',
    tags: ['math', 'calculus', 'hard', 'recognize'],
  }),
});

export { createAdvancedMathInstance } from './render.js';

export function mountAdvancedMath(container: HTMLElement, config: CaptchaConfig) {
  return createAdvancedMathInstance(container, config);
}
