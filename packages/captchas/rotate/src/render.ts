import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, verifyAlignment, type RotateChallenge } from './challenge.js';

const STR = {
  zh: { title: '拖动滑块将图形转正', success: '验证成功', hint: '让箭头指向上方', refresh: '刷新' },
  en: { title: 'Drag to rotate the figure upright', success: 'Verified', hint: 'Point the arrow up', refresh: 'Refresh' },
};

export function createRotateInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
  let current: RotateChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let done = false;

  function render() {
    current = generateChallenge();
    startTime = Date.now();
    done = false;
    container.innerHTML = `
      <style>
        .fc-rotate{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:12px}
        .fc-rotate[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-rotate[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-rotate{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-rotate-title{font-size:14px;color:var(--fc-text);text-align:center}
        .fc-rotate-stage{position:relative;width:140px;height:140px;display:flex;align-items:center;justify-content:center;border:2px dashed var(--fc-border);border-radius:50%}
        .fc-rotate-figure{width:100px;height:100px;transform-origin:center;transition:transform .05s}
        .fc-rotate-marker{position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:12px solid var(--fc-danger)}
        .fc-rotate-hint{font-size:12px;color:var(--fc-text-soft)}
        .fc-rotate-range{width:240px;accent-color:var(--fc-accent)}
        .fc-rotate-msg{font-size:13px;min-height:18px;text-align:center;color:var(--fc-success)}
        .fc-rotate-row{display:flex;justify-content:center}
        .fc-rotate-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-rotate-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
      </style>
      <div class="fc-rotate" data-theme="${theme}">
        <div class="fc-rotate-title">${t.title}</div>
        <div class="fc-rotate-stage">
          <div class="fc-rotate-figure" style="transform: rotate(${current.angle}deg)">
            <svg viewBox="0 0 100 100" width="100" height="100"><path d="M 50 8 L 82 42 L 62 42 L 62 92 L 38 92 L 38 42 Z" fill="var(--fc-accent)"/></svg>
          </div>
          <div class="fc-rotate-marker"></div>
        </div>
        <div class="fc-rotate-hint">${t.hint}</div>
        <input class="fc-rotate-range" type="range" min="0" max="360" step="1" value="0" />
        <div class="fc-rotate-msg"></div>
        <div class="fc-rotate-row">
          <button class="fc-rotate-refresh">${t.refresh}</button>
        </div>
      </div>
    `;
    const figure = container.querySelector('.fc-rotate-figure') as HTMLDivElement;
    const range = container.querySelector('.fc-rotate-range') as HTMLInputElement;
    const msg = container.querySelector('.fc-rotate-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-rotate-refresh') as HTMLButtonElement;
    refreshBtn.addEventListener('click', render);

    const update = async () => {
      if (done) return;
      const v = Number(range.value);
      const final = (((current.angle + v) % 360) + 360) % 360;
      figure.style.transform = `rotate(${final}deg)`;
      if (verifyAlignment(current, v)) {
        done = true;
        const result: CaptchaResult = {
          success: true,
          proof: await hashProof(proofInput(current)),
          duration: Date.now() - startTime,
        };
        msg.textContent = t.success;
        range.disabled = true;
        config.onVerify?.(result);
        listeners.forEach(cb => cb(result));
      }
    };

    range.addEventListener('input', update);
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => { container.innerHTML = ''; listeners = []; },
    onResult: cb => listeners.push(cb),
  };
}
