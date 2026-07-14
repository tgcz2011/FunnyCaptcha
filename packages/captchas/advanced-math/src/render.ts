import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type AdvancedMathChallenge } from './challenge.js';

const STR = {
  zh: {
    title: '高等数学',
    placeholder: '输入答案（支持 ^ 和 *）',
    submit: '验证',
    fail: '答错了，换一题',
    refresh: '刷新',
    hint: '提示：x²可写为x^2，可省略*',
    success: '验证通过',
  },
  en: {
    title: 'Calculus',
    placeholder: 'Enter answer (^ and * supported)',
    submit: 'Verify',
    fail: 'Wrong, try again',
    refresh: 'Refresh',
    hint: 'Tip: x² = x^2, * optional',
    success: 'Verified',
  },
};

export function createAdvancedMathInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
  let current: AdvancedMathChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();

  function render(): void {
    current = generateChallenge();
    startTime = Date.now();
    container.innerHTML = `
      <style>
        .fc-amath{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-amath[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-amath[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-amath{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-amath-q{display:block;font-size:14px;font-weight:600;color:var(--fc-text);margin-bottom:8px}
        .fc-amath-hint{display:block;font-size:11px;color:var(--fc-text-soft);margin-bottom:12px}
        .fc-amath-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
        .fc-amath-input{flex:1;min-width:0;padding:8px 12px;font-size:14px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text);border-radius:8px;box-sizing:border-box;outline:none}
        .fc-amath-input:focus{border-color:var(--fc-accent);box-shadow:0 0 0 3px var(--fc-accent-soft)}
        .fc-amath-btn{padding:8px 16px;font-size:14px;border:1px solid var(--fc-accent);background:var(--fc-accent);color:#fff;border-radius:8px;cursor:pointer;transition:opacity .15s}
        .fc-amath-btn:hover{opacity:.9}
        .fc-amath-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-amath-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-amath-msg{font-size:13px;min-height:18px;margin-top:10px;color:var(--fc-danger)}
      </style>
      <div class="fc-amath" data-theme="${theme}">
        <label class="fc-amath-q">${t.title}: ${current.question}</label>
        <span class="fc-amath-hint">${t.hint}</span>
        <div class="fc-amath-row">
          <input class="fc-amath-input" type="text" autocomplete="off" placeholder="${t.placeholder}" />
          <button class="fc-amath-btn">${t.submit}</button>
          <button class="fc-amath-refresh">${t.refresh}</button>
        </div>
        <div class="fc-amath-msg"></div>
      </div>
    `;
    const btn = container.querySelector('.fc-amath-btn') as HTMLButtonElement;
    const input = container.querySelector('.fc-amath-input') as HTMLInputElement;
    const msg = container.querySelector('.fc-amath-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-amath-refresh') as HTMLButtonElement;
    refreshBtn.addEventListener('click', render);
    btn.addEventListener('click', async () => {
      const val = input.value;
      const success = verifyAnswer(current, val);
      if (!success) {
        msg.textContent = t.fail;
        render();
        return;
      }
      msg.style.color = 'var(--fc-success)';
      msg.textContent = t.success;
      btn.disabled = true;
      input.disabled = true;
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
