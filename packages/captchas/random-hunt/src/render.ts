import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, conditionLabel, type RandomHuntChallenge } from './challenge.js';

const STR = {
  zh: { title: '随机数猎手', hunt: '捕获', success: '捕获成功！', fail: '不符合条件，继续', refresh: '换条件', tip: '当数字满足条件时点击捕获' },
  en: { title: 'Random Hunter', hunt: 'Catch!', success: 'Caught it!', fail: 'Not matching, keep going', refresh: 'New rule', tip: 'Click when the number matches' },
};

// 数字闪现间隔（ms）
const TICK_MS = 120;
// 随机数范围
const MIN = 0;
const MAX = 99;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createRandomHuntInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const locale = config.locale;
  const theme = config.theme ?? 'light';
  let current: RandomHuntChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let timer: ReturnType<typeof setInterval> | null = null;
  let number = 0;
  let succeeded = false;

  function clearTimer() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function render() {
    current = generateChallenge();
    startTime = Date.now();
    succeeded = false;
    clearTimer();
    number = randInt(MIN, MAX);
    container.innerHTML = `
      <style>
        .fc-hunt{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-hunt[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-hunt[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-hunt{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-hunt-title{font-size:15px;font-weight:600;color:var(--fc-text);text-align:center;margin-bottom:4px}
        .fc-hunt-cond{font-size:13px;color:var(--fc-accent);text-align:center;margin-bottom:4px;font-weight:600}
        .fc-hunt-tip{font-size:12px;color:var(--fc-text-soft);text-align:center;margin-bottom:12px}
        .fc-hunt-num{font-family:'SF Mono',ui-monospace,monospace;font-size:48px;text-align:center;color:var(--fc-text);min-height:56px;line-height:56px;transition:opacity .08s ease-out,color .15s ease-out;background:var(--fc-surface);border:1px solid var(--fc-border);border-radius:10px;margin-bottom:14px}
        .fc-hunt-num-success{color:var(--fc-success);border-color:var(--fc-success)}
        .fc-hunt-row{display:flex;gap:8px;align-items:center;justify-content:center}
        .fc-hunt-btn{flex:1;padding:12px 16px;font-size:16px;font-weight:600;border:1px solid var(--fc-accent);background:var(--fc-accent);color:#fff;border-radius:8px;cursor:pointer;transition:opacity .15s}
        .fc-hunt-btn:hover{opacity:.9}
        .fc-hunt-btn:disabled{opacity:.5;cursor:not-allowed}
        .fc-hunt-refresh{padding:8px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-hunt-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-hunt-msg{font-size:13px;min-height:18px;margin-top:10px;text-align:center;color:var(--fc-danger)}
      </style>
      <div class="fc-hunt" data-theme="${theme}">
        <div class="fc-hunt-title">${t.title}</div>
        <div class="fc-hunt-cond">${t.hunt}：${conditionLabel(current.condition, locale)}</div>
        <div class="fc-hunt-tip">${t.tip}</div>
        <div class="fc-hunt-num">${number}</div>
        <div class="fc-hunt-row">
          <button class="fc-hunt-btn">${t.hunt}</button>
          <button class="fc-hunt-refresh">${t.refresh}</button>
        </div>
        <div class="fc-hunt-msg"></div>
      </div>
    `;
    const numEl = container.querySelector('.fc-hunt-num') as HTMLDivElement | null;
    const btn = container.querySelector('.fc-hunt-btn') as HTMLButtonElement;
    const msg = container.querySelector('.fc-hunt-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-hunt-refresh') as HTMLButtonElement;

    refreshBtn.addEventListener('click', render);

    // 每 120ms 闪现一个随机数，加微弱闪烁感
    timer = setInterval(() => {
      if (succeeded) return;
      number = randInt(MIN, MAX);
      if (numEl) {
        numEl.textContent = String(number);
        numEl.style.opacity = '0.55';
        requestAnimationFrame(() => { numEl.style.opacity = '1'; });
      }
    }, TICK_MS);

    btn.addEventListener('click', async () => {
      if (succeeded) return;
      const ok = current.check(number);
      if (!ok) {
        msg.textContent = t.fail;
        return;
      }
      // 成功：数字变绿，停止 interval
      succeeded = true;
      clearTimer();
      if (numEl) numEl.classList.add('fc-hunt-num-success');
      btn.disabled = true;
      const duration = Date.now() - startTime;
      const result: CaptchaResult = {
        success: true,
        proof: await hashProof(`random-hunt:${current.condition}:${duration}`),
        duration,
        metadata: { condition: current.condition, number },
      };
      msg.textContent = t.success;
      msg.style.color = 'var(--fc-success)';
      config.onVerify?.(result);
      listeners.forEach(cb => cb(result));
    });
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => { clearTimer(); container.innerHTML = ''; listeners = []; },
    onResult: cb => listeners.push(cb),
  };
}
