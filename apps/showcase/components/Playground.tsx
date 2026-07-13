'use client';

import { useState, useMemo, useCallback } from 'react';
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
import type { CaptchaPlugin, CaptchaResult, Locale, Theme, Difficulty } from '@funnycaptcha/core';
import { catalog, pickTitle } from '@/lib/catalog';

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

export function Playground() {
  const t = useTranslations('demo');
  const currentLocale = useLocale() as Locale;
  const [selected, setSelected] = useState('math');
  const [locale, setLocale] = useState<Locale>(currentLocale);
  const [theme, setTheme] = useState<Theme>('light');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [resetKey, setResetKey] = useState(0);
  const [lastResult, setLastResult] = useState<CaptchaResult | null>(null);

  const plugin = PLUGINS[selected] ?? mathPlugin;

  const config = useMemo(
    () => ({
      locale,
      theme,
      difficulty,
      onVerify: (r: CaptchaResult) => setLastResult(r),
    }),
    [locale, theme, difficulty],
  );

  const handleReset = useCallback(() => {
    setLastResult(null);
    setResetKey((k) => k + 1);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
      <aside>
        <div className="demo-wrap" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            {locale === 'zh' ? '选择验证码' : 'Select Captcha'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {catalog.map((meta) => (
              <button
                key={meta.type}
                className="btn"
                style={{
                  justifyContent: 'flex-start',
                  fontWeight: selected === meta.type ? 700 : 400,
                  background: selected === meta.type ? 'var(--accent-soft)' : 'var(--bg-card)',
                  color: selected === meta.type ? 'var(--accent)' : 'var(--text)',
                  borderColor: selected === meta.type ? 'var(--accent)' : 'var(--border)',
                }}
                onClick={() => {
                  setSelected(meta.type);
                  setLastResult(null);
                  setResetKey((k) => k + 1);
                }}
              >
                {pickTitle(meta, locale)}
              </button>
            ))}
          </div>
        </div>

        <div className="demo-wrap" style={{ padding: 16, marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            {locale === 'zh' ? '配置' : 'Config'}
          </div>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-soft)', marginBottom: 4 }}>
            {locale === 'zh' ? '语言' : 'Locale'}
          </label>
          <select
            className="input"
            style={{ width: '100%', marginBottom: 10 }}
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>

          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-soft)', marginBottom: 4 }}>
            {locale === 'zh' ? '主题' : 'Theme'}
          </label>
          <select
            className="input"
            style={{ width: '100%', marginBottom: 10 }}
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
          >
            <option value="light">{locale === 'zh' ? '浅色' : 'Light'}</option>
            <option value="dark">{locale === 'zh' ? '深色' : 'Dark'}</option>
          </select>

          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-soft)', marginBottom: 4 }}>
            {locale === 'zh' ? '难度' : 'Difficulty'}
          </label>
          <select
            className="input"
            style={{ width: '100%', marginBottom: 10 }}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            <option value="easy">{locale === 'zh' ? '简单' : 'Easy'}</option>
            <option value="normal">{locale === 'zh' ? '普通' : 'Normal'}</option>
            <option value="hard">{locale === 'zh' ? '困难' : 'Hard'}</option>
          </select>

          <button className="btn" style={{ width: '100%' }} onClick={handleReset}>
            {t('refresh')}
          </button>
        </div>
      </aside>

      <section>
        <div className="demo-wrap" data-theme={theme}>
          <div className="demo-host">
            <CaptchaHost plugin={plugin} config={config} resetKey={resetKey} />
          </div>
          {lastResult && (
            <div className={`demo-status ${lastResult.success ? 'success' : 'fail'}`}>
              {lastResult.success ? t('success') : t('fail')}
              <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.7 }}>
                proof: {lastResult.proof.slice(0, 16)}... · {lastResult.duration}ms
              </span>
            </div>
          )}
        </div>

        <div className="code-block" style={{ marginTop: 16 }}>
          <pre>{`import { ${selected.replace(/-/g, '')}Plugin } from '@funnycaptcha/${selected}';
import { CaptchaHost } from '@funnycaptcha/react';

<CaptchaHost
  plugin={${selected.replace(/-/g, '')}Plugin}
  config={{ locale: '${locale}', theme: '${theme}', difficulty: '${difficulty}' }}
/>`}</pre>
        </div>
      </section>
    </div>
  );
}
