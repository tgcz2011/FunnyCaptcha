import type { CaptchaConfig, CaptchaInstance } from '@funnycaptcha/core';
import { getCaptcha } from '@funnycaptcha/core';

export function mountInto(
  container: HTMLElement,
  type: string,
  config: CaptchaConfig,
): CaptchaInstance | null {
  const plugin = getCaptcha(type);
  if (!plugin) {
    container.innerHTML = `<div style="color:red">Unknown captcha: ${type}</div>`;
    return null;
  }
  const inst = plugin.create(container, config);
  inst.mount();
  return inst;
}
