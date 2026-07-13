'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CaptchaHost } from '@funnycaptcha/react';
import { mathPlugin } from '@funnycaptcha/math';
import { textDistortPlugin } from '@funnycaptcha/text-distort';
import { sliderPlugin } from '@funnycaptcha/slider';
import { clickOrderPlugin } from '@funnycaptcha/click-order';
import { rotatePlugin } from '@funnycaptcha/rotate';
import { spotDiffPlugin } from '@funnycaptcha/spot-diff';
import { emojiMatchPlugin } from '@funnycaptcha/emoji-match';
import { memeQuizPlugin } from '@funnycaptcha/meme-quiz';
import { miniGamePlugin } from '@funnycaptcha/mini-game';
import { antiBotPlugin } from '@funnycaptcha/anti-bot';
import type { CaptchaPlugin, CaptchaResult } from '@funnycaptcha/core';
import { getMeta } from '@/lib/catalog';

const PLUGINS: Record<string, CaptchaPlugin> = {
  math: mathPlugin,
  'text-distort': textDistortPlugin,
  slider: sliderPlugin,
  'click-order': clickOrderPlugin,
  rotate: rotatePlugin,
  'spot-diff': spotDiffPlugin,
  'emoji-match': emojiMatchPlugin,
  'meme-quiz': memeQuizPlugin,
  'mini-game': miniGamePlugin,
  'anti-bot': antiBotPlugin,
};

export function CaptchaDemo({ type }: { type: string }) {
  const t = useTranslations('demo');
  const locale = useLocale() as 'zh' | 'en';
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'fail'>('idle');

  const plugin = PLUGINS[type];
  const config = useMemo(
    () => ({
      locale,
      theme: 'light' as const,
      difficulty: 'normal' as const,
      onVerify: (r: CaptchaResult) => {
        setStatus(r.success ? 'success' : 'fail');
      },
    }),
    [locale],
  );

  const handleRefresh = useCallback(() => {
    setStatus('idle');
    setResetKey((k) => k + 1);
  }, []);

  if (!plugin) {
    return (
      <div className="demo-wrap">
        <div className="demo-host">
          {locale === 'zh' ? '该验证码尚未实现，敬请期待。' : 'This captcha is not implemented yet.'}
        </div>
      </div>
    );
  }

  return (
    <div className="demo-wrap">
      <div className="demo-host">
        <CaptchaHost plugin={plugin} config={config} resetKey={resetKey} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
        <button className="btn" onClick={handleRefresh}>
          {t('refresh')}
        </button>
      </div>
      {status !== 'idle' && (
        <div className={`demo-status ${status}`}>
          {status === 'success' ? t('success') : t('fail')}
        </div>
      )}
    </div>
  );
}

export function isDemoAvailable(type: string): boolean {
  return Boolean(PLUGINS[type]) && Boolean(getMeta(type)?.available);
}
