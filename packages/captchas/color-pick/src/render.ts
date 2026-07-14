import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, colorLabel, proofInput, verifyAnswer, type ColorPickChallenge } from './challenge.js';

const STR = {
  zh: { success: '验证成功', fail: '选错了，再试一次', refresh: '刷新' },
  en: { success: 'Verified', fail: 'Wrong, try again', refresh: 'Refresh' },
};

export function createColorPickInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  let current: ColorPickChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let finished = false;

  function render() {
    current = generateChallenge();
    finished = false;
    startTime = Date.now();
    const label = colorLabel(current.targetColor, config.locale);
    const prompt = config.locale === 'zh'
      ? `请点击${label}的方块`
      : `Click the ${label} square`;
    const squares = current.options.map(o =>
      `<button class="fc-color-pick-opt" data-hex="${o.hex}" style="background:${o.hex}" aria-label="${o.name}"></button>`,
    ).join('');
    container.innerHTML = `
      <style>
        .fc-color-pick{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-color-pick[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-color-pick[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-color-pick-prompt{font-size:15px;color:var(--fc-text);margin-bottom:12px;text-align:center;font-weight:600}
        .fc-color-pick-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .fc-color-pick-opt{height:56px;border:2px solid var(--fc-border);border-radius:10px;cursor:pointer;transition:transform .12s,border-color .12s;outline:none;padding:0}
        .fc-color-pick-opt:hover{transform:scale(1.06);border-color:var(--fc-accent)}
        .fc-color-pick-opt-correct{border-color:var(--fc-success);transform:scale(1.06)}
        .fc-color-pick-opt-wrong{border-color:var(--fc-danger)}
        .fc-color-pick-msg{font-size:13px;min-height:18px;text-align:center;margin-top:12px;color:var(--fc-danger)}
        .fc-color-pick-msg-success{color:var(--fc-success)}
        .fc-color-pick-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer;margin-top:8px;display:block;margin-left:auto;margin-right:auto}
        .fc-color-pick-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
      </style>
      <div class="fc-color-pick" data-theme="${config.theme}">
        <div class="fc-color-pick-prompt">${prompt}</div>
        <div class="fc-color-pick-opts">${squares}</div>
        <div class="fc-color-pick-msg"></div>
        <button class="fc-color-pick-refresh">${t.refresh}</button>
      </div>
    `;
    const msg = container.querySelector('.fc-color-pick-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-color-pick-refresh') as HTMLButtonElement;
    refreshBtn.addEventListener('click', () => render());

    container.querySelectorAll('.fc-color-pick-opt').forEach(el => {
      el.addEventListener('click', async () => {
        if (finished) return;
        const btn = el as HTMLButtonElement;
        const pick = btn.dataset.hex!;
        if (verifyAnswer(current, pick)) {
          finished = true;
          btn.classList.add('fc-color-pick-opt-correct');
          msg.classList.add('fc-color-pick-msg-success');
          const result: CaptchaResult = {
            success: true,
            proof: await hashProof(proofInput(current)),
            duration: Date.now() - startTime,
          };
          msg.textContent = t.success;
          config.onVerify?.(result);
          listeners.forEach(cb => cb(result));
        } else {
          finished = true;
          btn.classList.add('fc-color-pick-opt-wrong');
          msg.textContent = t.fail;
          setTimeout(render, 800);
        }
      });
    });
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => { container.innerHTML = ''; listeners = []; },
    onResult: cb => listeners.push(cb),
  };
}
