import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type EmojiMatchChallenge } from './challenge.js';

const STR = {
  zh: { title: '选出符合描述的表情', success: '验证成功', fail: '选错了，再试一次', refresh: '刷新' },
  en: { title: 'Pick the face matching the description', success: 'Verified', fail: 'Wrong, try again', refresh: 'Refresh' },
};

export function createEmojiMatchInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
  let current: EmojiMatchChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let finished = false;

  function render() {
    current = generateChallenge(config.locale);
    finished = false;
    startTime = Date.now();
    const buttons = current.options.map(
      (e) => `<button class="fc-emoji-match-opt" data-emoji="${e}">${e}</button>`,
    ).join('');
    container.innerHTML = `
      <style>
        .fc-emoji-match{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-emoji-match[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-emoji-match[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-emoji-match{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-emoji-match-title{font-size:14px;color:var(--fc-text);margin-bottom:6px;text-align:center;font-weight:600}
        .fc-emoji-match-desc{font-size:15px;color:var(--fc-accent);margin-bottom:14px;text-align:center;font-weight:600}
        .fc-emoji-match-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .fc-emoji-match-opt{font-size:30px;height:64px;border:2px solid var(--fc-border);background:var(--fc-bg);border-radius:10px;cursor:pointer;transition:transform .12s,border-color .12s,background .12s;display:flex;align-items:center;justify-content:center;color:var(--fc-text)}
        .fc-emoji-match-opt:hover{transform:scale(1.06);border-color:var(--fc-accent)}
        .fc-emoji-match-opt-wrong{border-color:var(--fc-danger);background:var(--fc-danger)}
        .fc-emoji-match-opt-correct{border-color:var(--fc-success);background:var(--fc-accent-soft)}
        .fc-emoji-match-msg{font-size:13px;min-height:18px;text-align:center;margin-top:12px;color:var(--fc-danger)}
        .fc-emoji-match-msg-ok{color:var(--fc-success)}
        .fc-emoji-match-row{display:flex;justify-content:center;margin-top:8px}
        .fc-emoji-match-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-emoji-match-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
      </style>
      <div class="fc-emoji-match" data-theme="${theme}">
        <div class="fc-emoji-match-title">${t.title}</div>
        <div class="fc-emoji-match-desc">${current.description}</div>
        <div class="fc-emoji-match-opts">${buttons}</div>
        <div class="fc-emoji-match-msg"></div>
        <div class="fc-emoji-match-row">
          <button class="fc-emoji-match-refresh">${t.refresh}</button>
        </div>
      </div>
    `;
    const msg = container.querySelector('.fc-emoji-match-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-emoji-match-refresh') as HTMLButtonElement;
    refreshBtn.addEventListener('click', render);

    container.querySelectorAll('.fc-emoji-match-opt').forEach(el => {
      el.addEventListener('click', async () => {
        if (finished) return;
        const btn = el as HTMLButtonElement;
        const pick = btn.dataset.emoji!;
        if (verifyAnswer(current, pick)) {
          finished = true;
          btn.classList.add('fc-emoji-match-opt-correct');
          const result: CaptchaResult = {
            success: true,
            proof: await hashProof(current.correct),
            duration: Date.now() - startTime,
          };
          msg.classList.add('fc-emoji-match-msg-ok');
          msg.textContent = t.success;
          config.onVerify?.(result);
          listeners.forEach(cb => cb(result));
        } else {
          // 选错：高亮错误后换题
          finished = true;
          btn.classList.add('fc-emoji-match-opt-wrong');
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
