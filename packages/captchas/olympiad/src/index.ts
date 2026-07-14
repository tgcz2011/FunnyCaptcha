import { defineCaptcha, type CaptchaConfig } from '@funnycaptcha/core';
import { createOlympiadInstance } from './render.js';

export * from './challenge.js';

defineCaptcha({
  id: 'olympiad',
  category: 'recognize',
  create: createOlympiadInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '小学奥数' : 'Math Olympiad',
    description: locale === 'zh'
      ? '鸡兔同笼、植树、盈亏等经典奥数题，挡住机器也挡住小学生'
      : 'Classic olympiad word problems — chickens, trees, apples.',
    tags: ['math', 'olympiad', 'word-problem', 'recognize'],
  }),
});

export { createOlympiadInstance } from './render.js';

export function mountOlympiad(container: HTMLElement, config: CaptchaConfig) {
  return createOlympiadInstance(container, config);
}
