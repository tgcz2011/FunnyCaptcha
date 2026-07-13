import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ThemeProvider } from 'next-themes';
import { locales } from '@/i18n/request';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LocaleToggle } from '@/components/LocaleToggle';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
        <div className="app-shell">
          <header className="header">
            <div className="container header-inner">
              <a href={`/${locale}`} className="brand">
                Funny<span className="brand-dot">Chapter</span>
              </a>
              <div className="header-actions">
                <LocaleToggle />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="container">{children}</main>
          <footer className="footer">
            <div className="container">
              FunnyChapter · MIT · Built by the community
            </div>
          </footer>
        </div>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
