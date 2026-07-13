import { useEffect, useRef } from 'react';
import type { CaptchaPlugin, CaptchaConfig, CaptchaInstance } from '@funnycaptcha/core';

export interface CaptchaHostProps {
  plugin: CaptchaPlugin;
  config: CaptchaConfig;
  resetKey?: unknown;
}

export function CaptchaHost({ plugin, config, resetKey }: CaptchaHostProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const instRef = useRef<CaptchaInstance | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const inst = plugin.create(ref.current, config);
    instRef.current = inst;
    inst.mount();
    return () => inst.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugin, config.locale, config.theme, config.difficulty]);

  useEffect(() => {
    if (resetKey === undefined) return;
    instRef.current?.reset();
  }, [resetKey]);

  return <div ref={ref} />;
}
