import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createMiniGameInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const miniGamePlugin: CaptchaPlugin = {
  id: 'mini-game',
  category: 'game',
  create: createMiniGameInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '打地鼠' : 'Whack-a-Mole',
    description: locale === 'zh'
      ? '30 秒内打够 10 只地鼠，简单又解压'
      : 'Whack 10 moles in 30 seconds. Simple and fun.',
    tags: ['game', 'whack-a-mole', 'timed'],
  }),
};

defineCaptcha(miniGamePlugin);

export function mountMiniGame(container: HTMLElement, config: CaptchaConfig) {
  return createMiniGameInstance(container, config);
}
