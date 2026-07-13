import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { catalog, pickTitle, pickDesc } from '@/lib/catalog';
import type { CaptchaCategory } from '@funnycaptcha/core';

const CATEGORY_ORDER: CaptchaCategory[] = [
  'interactive',
  'recognize',
  'creative',
  'game',
  'anti-bot',
];

export default function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const t = useTranslations();
  const locale = params.locale as 'zh' | 'en';

  return (
    <>
      <section className="hero">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
        <span className="tagline">{t('tagline')}</span>
      </section>

      {CATEGORY_ORDER.map((cat) => {
        const items = catalog.filter((c) => c.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="section-title">
              {t(`categories.${cat}.label` as const)}
              <span style={{ fontWeight: 400, color: 'var(--text-soft)', marginLeft: 8, fontSize: 13 }}>
                {t(`categories.${cat}.desc` as const)}
              </span>
            </h2>
            <div className="grid">
              {items.map((meta) => (
                <article key={meta.type} className="card">
                  <span className="card-cat">{t(`categories.${cat}.label` as const)}</span>
                  <h3 className="card-title">{pickTitle(meta, locale)}</h3>
                  <p className="card-desc">{pickDesc(meta, locale)}</p>
                  <div className="card-actions">
                    {meta.available ? (
                      <a className="btn btn-primary" href={`/${locale}/captchas/${meta.type}`}>
                        {t('actions.try')}
                      </a>
                    ) : (
                      <span className="btn" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                        {locale === 'zh' ? '即将推出' : 'Coming soon'}
                      </span>
                    )}
                    <a
                      className="btn"
                      href={`https://github.com/funnycaptcha/funnycaptcha/tree/main/packages/captchas/${meta.type}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('actions.source')}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
