import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type EmojiMatchChallenge } from './challenge.js';

const STR = {
  zh: { title: '选出符合描述的表情', success: '验证成功', fail: '选错了，再试一次' },
  en: { title: 'Pick the face matching the description', success: 'Verified', fail: 'Wrong, try again' },
};

export function createEmojiMatchInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
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
        .fc-emoji-match{font-family:-apple-system,system-ui,sans-serif;width:320px;padding:16px;box-sizing:border-box}
        .fc-emoji-match-title{font-size:14px;color:#333;margin-bottom:6px;text-align:center;font-weight:600}
        .fc-emoji-match-desc{font-size:15px;color:#4a90d9;margin-bottom:14px;text-align:center;font-weight:600}
        .fc-emoji-match-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .fc-emoji-match-opt{font-size:30px;height:64px;border:2px solid #e0e0e0;background:#fff;border-radius:10px;cursor:pointer;transition:transform .12s,border-color .12s,background .12s;display:flex;align-items:center;justify-content:center}
        .fc-emoji-match-opt:hover{transform:scale(1.06);border-color:#4a90d9}
        .fc-emoji-match-opt-wrong{border-color:#e53935;background:#fdecea}
        .fc-emoji-match-opt-correct{border-color:#2e7d32;background:#e8f5e9}
        .fc-emoji-match-msg{font-size:13px;min-height:18px;text-align:center;margin-top:12px;color:#e53935}
      </style>
      <div class="fc-emoji-match">
        <div class="fc-emoji-match-title">${t.title}</div>
        <div class="fc-emoji-match-desc">${current.description}</div>
        <div class="fc-emoji-match-opts">${buttons}</div>
        <div class="fc-emoji-match-msg"></div>
      </div>
    `;
    const msg = container.querySelector('.fc-emoji-match-msg') as HTMLDivElement;

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
          msg.style.color = '#2e7d32';
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
