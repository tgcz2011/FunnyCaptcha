import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { catalog, getMeta, pickTitle, pickDesc } from '@/lib/catalog';
import { buildSnippets } from '@/lib/integration-snippets';
import { CaptchaDemo } from '@/components/CaptchaDemo';
import { CodeBlock } from '@/components/CodeBlock';

export function generateStaticParams() {
  return catalog.map((c) => ({ type: c.type }));
}

export default async function CaptchaDetailPage({
  params,
}: {
  params: { locale: string; type: string };
}) {
  const { locale, type } = params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const loc = locale as 'zh' | 'en';

  const meta = getMeta(type);
  if (!meta) notFound();

  const snippets = buildSnippets(meta);
  const catLabel = t(`categories.${meta.category}.label` as 'categories.interactive.label');

  return (
    <>
      <a href={`/${locale}`} className="back-link">
        ← {t('actions.back')}
      </a>

      <header className="detail-header">
        <h1>{pickTitle(meta, loc)}</h1>
        <p>{pickDesc(meta, loc)}</p>
        <span className="card-cat" style={{ marginTop: 8 }}>
          {catLabel}
        </span>
      </header>

      <section>
        <h2 className="section-title">
          {loc === 'zh' ? '实时演示' : 'Live Demo'}
        </h2>
        <CaptchaDemo type={meta.type} />
      </section>

      <section>
        <h2 className="section-title">
          {loc === 'zh' ? '集成方式' : 'Integration'}
        </h2>
        {snippets.map((s) => (
          <CodeBlock key={s.id} snippet={s} />
        ))}
      </section>
    </>
  );
}
