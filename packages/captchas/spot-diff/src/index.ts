import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createSpotDiffInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const spotDiffPlugin: CaptchaPlugin = {
  id: 'spot-diff',
  category: 'creative',
  create: createSpotDiffInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '找不同' : 'Spot the Difference',
    description: locale === 'zh'
      ? '对比两个 emoji 网格，找出所有不同之处'
      : 'Compare two emoji grids and spot all differences.',
    tags: ['spot-diff', 'emoji', 'creative'],
  }),
};

defineCaptcha(spotDiffPlugin);

export function mountSpotDiff(container: HTMLElement, config: CaptchaConfig) {
  return createSpotDiffInstance(container, config);
}
