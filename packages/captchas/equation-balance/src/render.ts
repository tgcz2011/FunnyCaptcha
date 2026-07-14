import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type EquationBalanceChallenge } from './challenge.js';

const STR = {
  zh: { title: '配平化学方程式', submit: '验证', fail: '系数不对，再试试', refresh: '换一题', hint: '系数为1也要填', success: '配平成功！' },
  en: { title: 'Balance the equation', submit: 'Verify', fail: 'Wrong coefficients', refresh: 'Next', hint: 'Enter 1 if needed', success: 'Balanced!' },
};

export function createEquationBalanceInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
  let current: EquationBalanceChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();

  function render() {
    current = generateChallenge();
    startTime = Date.now();
    // reactants 拼上 products，对应 coefficients 顺序
    const items = [...current.reactants, ...current.products];
    const R = current.reactants.length;
    const eqHtml = items.map((formula, i) => {
      // 0 之前无分隔；跨越反应物→生成物用 →；其余用 +
      const sep = i === 0 ? '' : i === R ? '→' : '+';
      const sepHtml = sep ? `<span class="fc-eqbal-sep">${sep}</span>` : '';
      return `${sepHtml}<span class="fc-eqbal-term"><input class="fc-eqbal-coef" type="text" inputmode="numeric" maxlength="2" aria-label="${formula}" /><span class="fc-eqbal-formula">${formula}</span></span>`;
    }).join('');
    container.innerHTML = `
      <style>
        .fc-eqbal{font-family:-apple-system,system-ui,sans-serif;max-width:420px;width:100%;padding:16px;box-sizing:border-box}
        .fc-eqbal[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-eqbal[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-eqbal{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-eqbal-title{display:block;font-size:14px;font-weight:600;color:var(--fc-text);margin-bottom:4px}
        .fc-eqbal-hint{display:block;font-size:12px;color:var(--fc-text-soft);margin-bottom:12px}
        .fc-eqbal-eq{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:18px;color:var(--fc-text);margin-bottom:14px;justify-content:center}
        .fc-eqbal-term{display:inline-flex;align-items:center;gap:4px}
        .fc-eqbal-sep{color:var(--fc-text-soft);font-weight:600}
        .fc-eqbal-formula{font-family:'SF Mono',ui-monospace,monospace}
        .fc-eqbal-coef{width:40px;text-align:center;padding:4px 0;font-size:16px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text);border-radius:6px;outline:none;box-sizing:border-box}
        .fc-eqbal-coef:focus{border-color:var(--fc-accent);box-shadow:0 0 0 3px var(--fc-accent-soft)}
        .fc-eqbal-row{display:flex;gap:8px;align-items:center;justify-content:center}
        .fc-eqbal-btn{padding:8px 16px;font-size:14px;border:1px solid var(--fc-accent);background:var(--fc-accent);color:#fff;border-radius:8px;cursor:pointer;transition:opacity .15s}
        .fc-eqbal-btn:hover{opacity:.9}
        .fc-eqbal-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-eqbal-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-eqbal-msg{font-size:13px;min-height:18px;margin-top:10px;text-align:center;color:var(--fc-danger)}
      </style>
      <div class="fc-eqbal" data-theme="${theme}">
        <label class="fc-eqbal-title">${t.title}</label>
        <span class="fc-eqbal-hint">${t.hint}</span>
        <div class="fc-eqbal-eq">${eqHtml}</div>
        <div class="fc-eqbal-row">
          <button class="fc-eqbal-btn">${t.submit}</button>
          <button class="fc-eqbal-refresh">${t.refresh}</button>
        </div>
        <div class="fc-eqbal-msg"></div>
      </div>
    `;
    const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('.fc-eqbal-coef'));
    const btn = container.querySelector('.fc-eqbal-btn') as HTMLButtonElement;
    const msg = container.querySelector('.fc-eqbal-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-eqbal-refresh') as HTMLButtonElement;
    refreshBtn.addEventListener('click', render);
    btn.addEventListener('click', async () => {
      const vals = inputs.map(i => Number(i.value));
      if (!verifyAnswer(current, vals)) {
        msg.textContent = t.fail;
        return;
      }
      const result: CaptchaResult = {
        success: true,
        proof: await hashProof(`equation-balance:${current.reactants.join('+')}>${current.products.join('+')}:${current.coefficients.join(',')}`),
        duration: Date.now() - startTime,
      };
      msg.style.color = 'var(--fc-success)';
      msg.textContent = t.success;
      btn.disabled = true;
      inputs.forEach(i => i.disabled = true);
      config.onVerify?.(result);
      listeners.forEach(cb => cb(result));
    });
    inputs.forEach((input, idx) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btn.click();
      });
      if (idx === 0) input.focus();
    });
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => { container.innerHTML = ''; listeners = []; },
    onResult: cb => listeners.push(cb),
  };
}
