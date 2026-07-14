import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type TextChallenge } from './challenge.js';
import { hashProof } from '@funnycaptcha/core';

const STR = {
  zh: { placeholder: '输入图中字符', submit: '验证', fail: '看不清？换一张', refresh: '刷新' },
  en: { placeholder: 'Type the text', submit: 'Verify', fail: 'Wrong? Try another', refresh: 'Refresh' },
};

function drawDistorted(canvas: HTMLCanvasElement, code: string, surface: string, text: string, border: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // 噪点干扰
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 1.5);
  }
  const chars = code.split('');
  const step = canvas.width / (chars.length + 1);
  chars.forEach((ch, i) => {
    ctx.save();
    const x = step * (i + 1);
    const y = canvas.height / 2 + (Math.random() - 0.5) * 14;
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.font = `${24 + Math.floor(Math.random() * 8)}px sans-serif`;
    ctx.fillStyle = text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  // 6 条弧线干扰
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    const x1 = Math.random() * canvas.width;
    const y1 = Math.random() * canvas.height;
    const x2 = Math.random() * canvas.width;
    const y2 = Math.random() * canvas.height;
    const cpx = Math.random() * canvas.width;
    const cpy = Math.random() * canvas.height;
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cpx, cpy, x2, y2);
    ctx.stroke();
  }
}

function readVar(root: HTMLElement, name: string, fallback: string): string {
  const v = getComputedStyle(root).getPropertyValue(name).trim();
  return v || fallback;
}

export function createTextDistortInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
  let current: TextChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();

  function render() {
    current = generateChallenge();
    startTime = Date.now();
    container.innerHTML = `
      <style>
        .fc-text{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-text[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-text[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-text{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-text-canvas{display:block;width:100%;max-width:240px;height:60px;border-radius:8px;border:1px solid var(--fc-border);margin-bottom:10px}
        .fc-text-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
        .fc-text-input{flex:1;min-width:0;padding:8px 12px;font-size:14px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text);border-radius:8px;box-sizing:border-box;outline:none}
        .fc-text-input:focus{border-color:var(--fc-accent);box-shadow:0 0 0 3px var(--fc-accent-soft)}
        .fc-text-btn{padding:8px 16px;font-size:14px;border:1px solid var(--fc-accent);background:var(--fc-accent);color:#fff;border-radius:8px;cursor:pointer;transition:opacity .15s}
        .fc-text-btn:hover{opacity:.9}
        .fc-text-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-text-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-text-msg{font-size:13px;min-height:18px;margin-top:10px;color:var(--fc-danger)}
      </style>
      <div class="fc-text" data-theme="${theme}">
        <canvas class="fc-text-canvas" width="240" height="60"></canvas>
        <div class="fc-text-row">
          <input class="fc-text-input" placeholder="${t.placeholder}" />
          <button class="fc-text-btn">${t.submit}</button>
          <button class="fc-text-refresh">${t.refresh}</button>
        </div>
        <div class="fc-text-msg"></div>
      </div>
    `;
    const root = container.querySelector('.fc-text') as HTMLElement;
    const canvas = container.querySelector('.fc-text-canvas') as HTMLCanvasElement;
    // 读取 CSS 变量当前值，再绘制 canvas
    const surface = readVar(root, '--fc-surface', '#f6f7f9');
    const text = readVar(root, '--fc-text', '#0f172a');
    const border = readVar(root, '--fc-border', '#e2e8f0');
    drawDistorted(canvas, current.code, surface, text, border);
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
