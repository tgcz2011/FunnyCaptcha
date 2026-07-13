import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createMemeQuizInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const memeQuizPlugin: CaptchaPlugin = {
  id: 'meme-quiz',
  category: 'creative',
  create: createMemeQuizInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '梗图问答' : 'Meme Quiz',
    description: locale === 'zh'
      ? '看 emoji 梗描述，选出正确的梗名'
      : 'Read the emoji meme and pick the correct name.',
    tags: ['meme', 'quiz', 'creative'],
  }),
};

defineCaptcha(memeQuizPlugin);

export function mountMemeQuiz(container: HTMLElement, config: CaptchaConfig) {
  return createMemeQuizInstance(container, config);
}
