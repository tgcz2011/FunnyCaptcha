import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type TextChallenge } from './challenge.js';
import { hashProof } from '@funnycaptcha/core';

const STR = {
  zh: { placeholder: '输入图中字符', submit: '验证', fail: '看不清？换一张', refresh: '刷新' },
  en: { placeholder: 'Type the text', submit: 'Verify', fail: 'Wrong? Try another', refresh: 'Refresh' },
};

function drawDistorted(canvas: HTMLCanvasElement, code: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const chars = code.split('');
  const step = canvas.width / (chars.length + 1);
  chars.forEach((ch, i) => {
    ctx.save();
    const x = step * (i + 1);
    const y = canvas.height / 2 + (Math.random() - 0.5) * 14;
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.font = `${24 + Math.floor(Math.random() * 8)}px sans-serif`;
    ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 40%)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  // 干扰线
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `hsla(${Math.random() * 360}, 70%, 50%, 0.4)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }
}

export function createTextDistortInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  let current: TextChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();

  function render() {
    current = generateChallenge();
    startTime = Date.now();
    container.innerHTML = `
      <div class="fc-text">
        <canvas class="fc-text-canvas" width="180" height="60"></canvas>
        <button class="fc-text-refresh">${t.refresh}</button>
        <input class="fc-text-input" placeholder="${t.placeholder}" />
        <button class="fc-text-btn">${t.submit}</button>
        <div class="fc-text-msg"></div>
      </div>
    `;
    const canvas = container.querySelector('.fc-text-canvas') as HTMLCanvasElement;
    drawDistorted(canvas, current.code);
    (container.querySelector('.fc-text-refresh') as HTMLButtonElement)
      .addEventListener('click', render);
    const btn = container.querySelector('.fc-text-btn') as HTMLButtonElement;
    const input = container.querySelector('.fc-text-input') as HTMLInputElement;
    const msg = container.querySelector('.fc-text-msg') as HTMLDivElement;
    btn.addEventListener('click', async () => {
      const ok = verifyAnswer(current, input.value);
      if (!ok) { msg.textContent = t.fail; render(); return; }
      const result: CaptchaResult = {
        success: true,
        proof: await hashProof(current.code.toLowerCase()),
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
