import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createSliderInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const sliderPlugin: CaptchaPlugin = {
  id: 'slider',
  category: 'interactive',
  create: createSliderInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '滑动拼图' : 'Slider',
    description: locale === 'zh'
      ? '拖动滑块到终点，简单直接的交互验证'
      : 'Drag the slider to the end. Simple and direct.',
    tags: ['slider', 'drag', 'interactive'],
  }),
};

defineCaptcha(sliderPlugin);

export function mountSlider(container: HTMLElement, config: CaptchaConfig) {
  return createSliderInstance(container, config);
}
