'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function LocaleToggle() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (next: string) => {
    if (next === locale) return;
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/'));
  };

  return (
    <button
      className="icon-btn"
      onClick={() => switchTo(locale === 'zh' ? 'en' : 'zh')}
      aria-label="switch language"
      title={locale === 'zh' ? 'English' : '中文'}
    >
      {locale === 'zh' ? 'EN' : '中'}
    </button>
  );
}
