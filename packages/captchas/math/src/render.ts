import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type MathChallenge } from './challenge.js';
import { hashProof } from '@funnycaptcha/core';

const STR = {
  zh: { title: '请计算', placeholder: '输入答案', submit: '验证', fail: '答错了，换一题', refresh: '刷新' },
  en: { title: 'Solve', placeholder: 'Enter answer', submit: 'Verify', fail: 'Wrong, try again', refresh: 'Refresh' },
};

export function createMathInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
  let current: MathChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();

  function render() {
    current = generateChallenge();
    startTime = Date.now();
    container.innerHTML = `
      <style>
        .fc-math{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-math[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-math[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-math{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-math-q{display:block;font-size:14px;font-weight:600;color:var(--fc-text);margin-bottom:12px}
        .fc-math-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
        .fc-math-input{flex:1;min-width:0;padding:8px 12px;font-size:14px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text);border-radius:8px;box-sizing:border-box;outline:none}
        .fc-math-input:focus{border-color:var(--fc-accent);box-shadow:0 0 0 3px var(--fc-accent-soft)}
        .fc-math-btn{padding:8px 16px;font-size:14px;border:1px solid var(--fc-accent);background:var(--fc-accent);color:#fff;border-radius:8px;cursor:pointer;transition:opacity .15s}
        .fc-math-btn:hover{opacity:.9}
        .fc-math-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-math-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-math-msg{font-size:13px;min-height:18px;margin-top:10px;color:var(--fc-danger)}
      </style>
      <div class="fc-math" data-theme="${theme}">
        <label class="fc-math-q">${t.title}: ${current.question}</label>
        <div class="fc-math-row">
          <input class="fc-math-input" type="text" inputmode="numeric" placeholder="${t.placeholder}" />
          <button class="fc-math-btn">${t.submit}</button>
          <button class="fc-math-refresh">${t.refresh}</button>
        </div>
        <div class="fc-math-msg"></div>
      </div>
    `;
    const btn = container.querySelector('.fc-math-btn') as HTMLButtonElement;
    const input = container.querySelector('.fc-math-input') as HTMLInputElement;
    const msg = container.querySelector('.fc-math-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-math-refresh') as HTMLButtonElement;
    refreshBtn.addEventListener('click', render);
    btn.addEventListener('click', async () => {
      const val = Number(input.value);
      const success = verifyAnswer(current, val);
      if (!success) {
        msg.textContent = t.fail;
        render();
        return;
      }
      const result: CaptchaResult = {
        success: true,
        proof: await hashProof(`${current.question}=${current.answer}`),
        duration: Date.now() - startTime,
      };
      config.onVerify?.(result);
      listeners.forEach(cb => cb(result));
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => { container.innerHTML = ''; listeners = []; },
    onResult: cb => listeners.push(cb),
  };
}
