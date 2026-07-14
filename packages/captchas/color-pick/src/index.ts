import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createColorPickInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const colorPickPlugin: CaptchaPlugin = {
  id: 'color-pick',
  category: 'recognize',
  create: createColorPickInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '颜色选择' : 'Color Pick',
    description: locale === 'zh'
      ? '从多个彩色方块中点击指定颜色'
      : 'Pick the square of the specified color.',
    tags: ['color', 'pick', 'recognize'],
  }),
};

defineCaptcha(colorPickPlugin);

export function mountColorPick(container: HTMLElement, config: CaptchaConfig) {
  return createColorPickInstance(container, config);
}
