import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createEmojiMatchInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const emojiMatchPlugin: CaptchaPlugin = {
  id: 'emoji-match',
  category: 'creative',
  create: createEmojiMatchInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '表情匹配' : 'Emoji Match',
    description: locale === 'zh'
      ? '根据文字描述选出对应的表情 emoji'
      : 'Pick the emoji face that matches the description.',
    tags: ['emoji', 'match', 'creative'],
  }),
};

defineCaptcha(emojiMatchPlugin);

export function mountEmojiMatch(container: HTMLElement, config: CaptchaConfig) {
  return createEmojiMatchInstance(container, config);
}
