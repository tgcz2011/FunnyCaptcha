import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createRotateInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const rotatePlugin: CaptchaPlugin = {
  id: 'rotate',
  category: 'interactive',
  create: createRotateInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '旋转对齐' : 'Rotate Align',
    description: locale === 'zh'
      ? '拖动滑块将偏转的图形转正，考验空间感'
      : 'Rotate the tilted figure back upright. Tests spatial sense.',
    tags: ['rotate', 'drag', 'interactive'],
  }),
};

defineCaptcha(rotatePlugin);

export function mountRotate(container: HTMLElement, config: CaptchaConfig) {
  return createRotateInstance(container, config);
}
