import { defineCaptcha, type CaptchaConfig, type CaptchaPlugin } from '@funnycaptcha/core';
import { createAntiBotInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const antiBotPlugin: CaptchaPlugin = {
  id: 'anti-bot',
  category: 'anti-bot',
  create: createAntiBotInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '反机器人（讽刺）' : 'Anti-Bot (Satire)',
    description: locale === 'zh'
      ? '表面证明你是人类，其实给机器人留了 window 后门——讽刺假装安全的验证码'
      : 'Looks like a human check, but hands bots a window backdoor. Satire of fake security.',
    tags: ['anti-bot', 'satire', 'insecure'],
  }),
};

defineCaptcha(antiBotPlugin);

export function mountAntiBot(container: HTMLElement, config: CaptchaConfig) {
  return createAntiBotInstance(container, config);
}
