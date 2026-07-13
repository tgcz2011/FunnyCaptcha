import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: [
    '@funnycaptcha/core',
    '@funnycaptcha/math',
    '@funnycaptcha/text-distort',
    '@funnycaptcha/react',
  ],
};

export default withNextIntl(config);
