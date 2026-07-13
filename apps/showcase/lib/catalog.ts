import type { CaptchaCategory, Locale } from '@funnycaptcha/core';

export interface CaptchaMeta {
  /** URL slug，也是 plugin id */
  type: string;
  /** 类别 */
  category: CaptchaCategory;
  /** 多语言标题 */
  title: { zh: string; en: string };
  /** 多语言描述 */
  desc: { zh: string; en: string };
  /** 是否已在仓库中实现 */
  available: boolean;
  /** npm 包名 */
  pkg: string;
}

/**
 * 验证码目录。未实现的项 available=false，会在首页标记为「即将推出」。
 */
export const catalog: CaptchaMeta[] = [
  {
    type: 'math',
    category: 'recognize',
    title: { zh: '算术验证码', en: 'Math Captcha' },
    desc: {
      zh: '解答一道简单的加减乘除题，经典又好用。',
      en: 'Solve a simple arithmetic problem. Classic and reliable.',
    },
    available: true,
    pkg: '@funnycaptcha/math',
  },
  {
    type: 'text-distort',
    category: 'recognize',
    title: { zh: '扭曲文字', en: 'Distorted Text' },
    desc: {
      zh: 'Canvas 绘制带干扰线的扭曲字符，最熟悉的陌生人。',
      en: 'Canvas-rendered distorted characters with noise lines.',
    },
    available: true,
    pkg: '@funnycaptcha/text-distort',
  },
  {
    type: 'slider',
    category: 'interactive',
    title: { zh: '滑动拼图', en: 'Slider Puzzle' },
    desc: {
      zh: '把滑块拖到最右端，简单粗暴的交互验证。',
      en: 'Drag the slider to the rightmost position.',
    },
    available: false,
    pkg: '@funnycaptcha/slider',
  },
  {
    type: 'click-order',
    category: 'interactive',
    title: { zh: '点选顺序', en: 'Click in Order' },
    desc: {
      zh: '按提示顺序点击图中的目标文字或图标。',
      en: 'Click the targets in the prompted order.',
    },
    available: false,
    pkg: '@funnycaptcha/click-order',
  },
  {
    type: 'rotate',
    category: 'interactive',
    title: { zh: '旋转对齐', en: 'Rotate to Align' },
    desc: {
      zh: '旋转图片让两半拼成完整图案。',
      en: 'Rotate the image to align the two halves.',
    },
    available: false,
    pkg: '@funnycaptcha/rotate',
  },
  {
    type: 'spot-diff',
    category: 'creative',
    title: { zh: '找不同', en: 'Spot the Difference' },
    desc: {
      zh: '在两张相似图中找出 N 处不同。',
      en: 'Find N differences between two similar images.',
    },
    available: false,
    pkg: '@funnycaptcha/spot-diff',
  },
  {
    type: 'emoji-match',
    category: 'creative',
    title: { zh: '表情匹配', en: 'Emoji Match' },
    desc: {
      zh: '选出与描述相符的 emoji。',
      en: 'Pick the emoji matching the description.',
    },
    available: false,
    pkg: '@funnycaptcha/emoji-match',
  },
  {
    type: 'meme-quiz',
    category: 'creative',
    title: { zh: '梗图问答', en: 'Meme Quiz' },
    desc: {
      zh: '看梗图选梗名，懂的人自然懂。',
      en: 'Pick the right meme name. Only the cultured pass.',
    },
    available: false,
    pkg: '@funnycaptcha/meme-quiz',
  },
  {
    type: 'mini-game',
    category: 'game',
    title: { zh: '迷你游戏', en: 'Mini Game' },
    desc: {
      zh: '在 30 秒内达到指定分数才放行。',
      en: 'Reach the target score within 30 seconds.',
    },
    available: false,
    pkg: '@funnycaptcha/mini-game',
  },
  {
    type: 'anti-bot',
    category: 'anti-bot',
    title: { zh: '反人类讽刺', en: 'Anti-Bot Satire' },
    desc: {
      zh: '故意留个口子，机器人注入一行 JS 就能通过——讽刺那些假装安全的验证码。',
      en: 'Deliberately lets bots inject one line of JS to pass — a satire on fake-security captchas.',
    },
    available: false,
    pkg: '@funnycaptcha/anti-bot',
  },
];

export function getMeta(type: string): CaptchaMeta | undefined {
  return catalog.find((c) => c.type === type);
}

export function pickTitle(meta: CaptchaMeta, locale: Locale): string {
  return locale === 'zh' ? meta.title.zh : meta.title.en;
}

export function pickDesc(meta: CaptchaMeta, locale: Locale): string {
  return locale === 'zh' ? meta.desc.zh : meta.desc.en;
}
