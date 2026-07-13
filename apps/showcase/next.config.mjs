import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: [
    '@funnycaptcha/core',
    '@funnycaptcha/math',
    '@funnycaptcha/text-distort',
    '@funnycaptcha/slider',
    '@funnycaptcha/click-order',
    '@funnycaptcha/rotate',
    '@funnycaptcha/spot-diff',
    '@funnycaptcha/emoji-match',
    '@funnycaptcha/meme-quiz',
    '@funnycaptcha/mini-game',
    '@funnycaptcha/anti-bot',
    '@funnycaptcha/react',
  ],
};

export default withNextIntl(config);
