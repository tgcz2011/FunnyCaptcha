import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createPuzzleInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const puzzlePlugin: CaptchaPlugin = {
  id: 'puzzle',
  category: 'interactive',
  create: createPuzzleInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '拼图缺口' : 'Puzzle Gap',
    description: locale === 'zh'
      ? '拖动滑块把拼图块移到缺口位置'
      : 'Drag the slider to fit the puzzle piece into the gap.',
    tags: ['puzzle', 'drag', 'interactive'],
  }),
};

defineCaptcha(puzzlePlugin);

export function mountPuzzle(container: HTMLElement, config: CaptchaConfig) {
  return createPuzzleInstance(container, config);
}
