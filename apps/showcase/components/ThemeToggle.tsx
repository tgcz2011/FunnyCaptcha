'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

export function ThemeToggle() {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <button className="icon-btn" aria-label="theme" />;
  }

  const next = theme === 'dark' ? 'light' : 'dark';
  const label = theme === 'dark' ? t('light') : t('dark');

  return (
    <button
      className="icon-btn"
      onClick={() => setTheme(next)}
      aria-label={`switch to ${next}`}
      title={label}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
