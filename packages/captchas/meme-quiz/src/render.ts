import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type MemeQuizChallenge } from './challenge.js';

const STR = {
  zh: { title: '梗图问答', hint: '选出正确的梗名', success: '验证成功', fail: '答错了，换一题' },
  en: { title: 'Meme Quiz', hint: 'Pick the correct meme name', success: 'Verified', fail: 'Wrong, try again' },
};

export function createMemeQuizInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  let current: MemeQuizChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let finished = false;

  function render() {
    current = generateChallenge();
    finished = false;
    startTime = Date.now();
    const buttons = current.options.map(
      (o, i) => `<button class="fc-meme-quiz-opt" data-idx="${i}">${o}</button>`,
    ).join('');
    container.innerHTML = `
      <style>
        .fc-meme-quiz{font-family:-apple-system,system-ui,sans-serif;width:320px;padding:16px;box-sizing:border-box}
        .fc-meme-quiz-title{font-size:14px;color:#333;margin-bottom:6px;text-align:center;font-weight:600}
        .fc-meme-quiz-hint{font-size:12px;color:#888;margin-bottom:10px;text-align:center}
        .fc-meme-quiz-q{font-size:24px;color:#4a90d9;margin-bottom:14px;text-align:center;letter-spacing:2px}
        .fc-meme-quiz-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .fc-meme-quiz-opt{font-size:15px;height:48px;border:2px solid #e0e0e0;background:#fff;border-radius:8px;cursor:pointer;transition:transform .12s,border-color .12s,background .12s;color:#333}
        .fc-meme-quiz-opt:hover{transform:scale(1.03);border-color:#4a90d9}
        .fc-meme-quiz-opt-wrong{border-color:#e53935;background:#fdecea}
        .fc-meme-quiz-opt-correct{border-color:#2e7d32;background:#e8f5e9}
        .fc-meme-quiz-msg{font-size:13px;min-height:18px;text-align:center;margin-top:12px;color:#e53935}
      </style>
      <div class="fc-meme-quiz">
        <div class="fc-meme-quiz-title">${t.title}</div>
        <div class="fc-meme-quiz-hint">${t.hint}</div>
        <div class="fc-meme-quiz-q">${current.question}</div>
        <div class="fc-meme-quiz-opts">${buttons}</div>
        <div class="fc-meme-quiz-msg"></div>
      </div>
    `;
    const msg = container.querySelector('.fc-meme-quiz-msg') as HTMLDivElement;

    container.querySelectorAll('.fc-meme-quiz-opt').forEach(el => {
      el.addEventListener('click', async () => {
        if (finished) return;
        const btn = el as HTMLButtonElement;
        const pick = btn.textContent ?? '';
        if (verifyAnswer(current, pick)) {
          finished = true;
          btn.classList.add('fc-meme-quiz-opt-correct');
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
          // 答错：高亮错误后换题
          finished = true;
          btn.classList.add('fc-meme-quiz-opt-wrong');
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
