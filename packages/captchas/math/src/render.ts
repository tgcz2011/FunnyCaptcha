import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type MathChallenge } from './challenge.js';
import { hashProof } from '@funnycaptcha/core';

const STR = {
  zh: { title: '请计算', placeholder: '输入答案', submit: '验证', fail: '答错了，换一题' },
  en: { title: 'Solve', placeholder: 'Enter answer', submit: 'Verify', fail: 'Wrong, try again' },
};

export function createMathInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  let current: MathChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();

  function render() {
    current = generateChallenge();
    startTime = Date.now();
    container.innerHTML = `
      <div class="fc-math">
        <label class="fc-math-q">${t.title}: ${current.question}</label>
        <input class="fc-math-input" type="text" inputmode="numeric" placeholder="${t.placeholder}" />
        <button class="fc-math-btn">${t.submit}</button>
        <div class="fc-math-msg"></div>
      </div>
    `;
    const btn = container.querySelector('.fc-math-btn') as HTMLButtonElement;
    const input = container.querySelector('.fc-math-input') as HTMLInputElement;
    const msg = container.querySelector('.fc-math-msg') as HTMLDivElement;
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
