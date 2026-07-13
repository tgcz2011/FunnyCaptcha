import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Playground } from '@/components/Playground';

export default async function PlaygroundPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <header className="hero" style={{ padding: '40px 0 24px' }}>
        <h1>{locale === 'zh' ? 'Playground' : 'Playground'}</h1>
        <p>
          {locale === 'zh'
            ? '选择验证码、切换语言/主题/难度，实时预览效果。'
            : 'Pick a captcha, switch locale/theme/difficulty, and preview live.'}
        </p>
      </header>
      <Playground />
    </>
  );
}
