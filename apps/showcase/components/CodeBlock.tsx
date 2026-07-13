'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Snippet } from '@/lib/integration-snippets';

export function CodeBlock({ snippet }: { snippet: Snippet }) {
  const t = useTranslations('actions');
  const locale = useLocale() as 'zh' | 'en';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-soft)' }}>
        {snippet.label[locale]}
      </div>
      <div className="code-block">
        <button className="btn copy-btn" onClick={handleCopy}>
          {copied ? t('copied') : t('copy')}
        </button>
        <pre>{snippet.code}</pre>
      </div>
    </div>
  );
}
