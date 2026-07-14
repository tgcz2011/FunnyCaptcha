import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createEquationBalanceInstance } from './render.js';

export * from './challenge.js';

export const equationBalancePlugin: CaptchaPlugin = {
  id: 'equation-balance',
  category: 'recognize',
  create: createEquationBalanceInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '配平化学方程式' : 'Balance Equation',
    description: locale === 'zh'
      ? '填入正确的化学计量数，配平方程式'
      : 'Enter the right stoichiometric coefficients.',
    tags: ['chemistry', 'equation', 'balance'],
  }),
};

defineCaptcha(equationBalancePlugin);

export function mountEquationBalance(container: HTMLElement, config: CaptchaConfig) {
  return createEquationBalanceInstance(container, config);
}
