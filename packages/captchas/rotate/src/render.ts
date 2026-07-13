import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, verifyAlignment, type RotateChallenge } from './challenge.js';

const STR = {
  zh: { title: '拖动滑块将图形转正', success: '验证成功', hint: '让箭头指向上方' },
  en: { title: 'Drag to rotate the figure upright', success: 'Verified', hint: 'Point the arrow up' },
};

export function createRotateInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
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
        .fc-rotate{font-family:-apple-system,system-ui,sans-serif;width:300px;padding:16px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:12px}
        .fc-rotate-title{font-size:14px;color:#333;text-align:center}
        .fc-rotate-stage{position:relative;width:140px;height:140px;display:flex;align-items:center;justify-content:center;border:2px dashed #ccc;border-radius:50%}
        .fc-rotate-figure{width:100px;height:100px;transform-origin:center;transition:transform .05s}
        .fc-rotate-marker{position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:12px solid #e74c3c}
        .fc-rotate-hint{font-size:12px;color:#999}
        .fc-rotate-range{width:240px;accent-color:#4a90d9}
        .fc-rotate-msg{font-size:13px;min-height:18px;text-align:center;color:#2e7d32}
      </style>
      <div class="fc-rotate">
        <div class="fc-rotate-title">${t.title}</div>
        <div class="fc-rotate-stage">
          <div class="fc-rotate-figure" style="transform: rotate(${current.angle}deg)">
            <svg viewBox="0 0 100 100" width="100" height="100"><polygon points="50,12 90,85 10,85" fill="#4a90d9"/></svg>
          </div>
          <div class="fc-rotate-marker"></div>
        </div>
        <div class="fc-rotate-hint">${t.hint}</div>
        <input class="fc-rotate-range" type="range" min="0" max="360" step="1" value="0" />
        <div class="fc-rotate-msg"></div>
      </div>
    `;
    const figure = container.querySelector('.fc-rotate-figure') as HTMLDivElement;
    const range = container.querySelector('.fc-rotate-range') as HTMLInputElement;
    const msg = container.querySelector('.fc-rotate-msg') as HTMLDivElement;

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
