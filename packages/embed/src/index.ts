import { scan } from './scanner.js';
import { mountInto } from './iframe-host.js';
import '@funnycaptcha/math';
import '@funnycaptcha/text-distort';
import '@funnycaptcha/slider';
import '@funnycaptcha/click-order';
import '@funnycaptcha/rotate';
import '@funnycaptcha/spot-diff';
import '@funnycaptcha/emoji-match';
import '@funnycaptcha/meme-quiz';
import '@funnycaptcha/mini-game';
import '@funnycaptcha/anti-bot';
import '@funnycaptcha/click-text';
import '@funnycaptcha/color-pick';
import '@funnycaptcha/puzzle';
import type { CaptchaInstance } from '@funnycaptcha/core';

const instances = new Map<HTMLElement, CaptchaInstance>();

export function render(root: ParentNode = document) {
  for (const t of scan(root)) {
    if (instances.has(t.el)) continue;
    const inst = mountInto(t.el, t.type, {
      locale: t.locale,
      theme: t.theme,
    });
    if (inst) instances.set(t.el, inst);
  }
}

// 自动扫描 + MutationObserver
export function autoStart() {
  render();
  const obs = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes.forEach(n => {
        if (n instanceof HTMLElement) render(n);
      });
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

export { scan, mountInto };

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStart);
  } else {
    autoStart();
  }
}
