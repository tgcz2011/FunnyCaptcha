import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['zh', 'en'] as const;
export type AppLocale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = locales.includes(requested as AppLocale)
    ? (requested as AppLocale)
    : locales[0];
  if (!locales.includes(locale)) notFound();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
