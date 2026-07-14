import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type MemeQuizChallenge } from './challenge.js';

const STR = {
  zh: { title: '梗图问答', hint: '选出正确的梗名', success: '验证成功', fail: '答错了，换一题', refresh: '刷新' },
  en: { title: 'Meme Quiz', hint: 'Pick the correct meme name', success: 'Verified', fail: 'Wrong, try again', refresh: 'Refresh' },
};

export function createMemeQuizInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
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
        .fc-meme-quiz{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-meme-quiz[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-meme-quiz[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-meme-quiz{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-meme-quiz-title{font-size:14px;color:var(--fc-text);margin-bottom:6px;text-align:center;font-weight:600}
        .fc-meme-quiz-hint{font-size:12px;color:var(--fc-text-soft);margin-bottom:10px;text-align:center}
        .fc-meme-quiz-q{font-size:24px;color:var(--fc-accent);margin-bottom:14px;text-align:center;letter-spacing:2px}
        .fc-meme-quiz-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .fc-meme-quiz-opt{font-size:15px;height:48px;border:2px solid var(--fc-border);background:var(--fc-bg);border-radius:8px;cursor:pointer;transition:transform .12s,border-color .12s,background .12s;color:var(--fc-text)}
        .fc-meme-quiz-opt:hover{transform:scale(1.03);border-color:var(--fc-accent)}
        .fc-meme-quiz-opt-wrong{border-color:var(--fc-danger);background:var(--fc-danger)}
        .fc-meme-quiz-opt-correct{border-color:var(--fc-success);background:var(--fc-accent-soft)}
        .fc-meme-quiz-msg{font-size:13px;min-height:18px;text-align:center;margin-top:12px;color:var(--fc-danger)}
        .fc-meme-quiz-msg-ok{color:var(--fc-success)}
        .fc-meme-quiz-row{display:flex;justify-content:center;margin-top:8px}
        .fc-meme-quiz-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-meme-quiz-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
      </style>
      <div class="fc-meme-quiz" data-theme="${theme}">
        <div class="fc-meme-quiz-title">${t.title}</div>
        <div class="fc-meme-quiz-hint">${t.hint}</div>
        <div class="fc-meme-quiz-q">${current.question}</div>
        <div class="fc-meme-quiz-opts">${buttons}</div>
        <div class="fc-meme-quiz-msg"></div>
        <div class="fc-meme-quiz-row">
          <button class="fc-meme-quiz-refresh">${t.refresh}</button>
        </div>
      </div>
    `;
    const msg = container.querySelector('.fc-meme-quiz-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-meme-quiz-refresh') as HTMLButtonElement;
    refreshBtn.addEventListener('click', render);

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
          msg.classList.add('fc-meme-quiz-msg-ok');
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
