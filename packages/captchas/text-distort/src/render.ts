import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type TextChallenge } from './challenge.js';
import { hashProof } from '@funnycaptcha/core';

const STR = {
  zh: { placeholder: '观察闪烁文字并输入', submit: '验证', fail: '看不清？换一张', refresh: '刷新', pause: '暂停', resume: '继续' },
  en: { placeholder: 'Watch the flicker and type', submit: 'Verify', fail: 'Wrong? Try another', refresh: 'Refresh', pause: 'Pause', resume: 'Resume' },
};

const PERIOD = 180;

function drawFrame(
  canvas: HTMLCanvasElement,
  code: string,
  frame: number,
  surface: string,
  text: string,
  border: string,
  accentSoft: string,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const f = frame % PERIOD;

  type Phase = 'strong' | 'fade-out' | 'clear' | 'fade-in';
  let phase: Phase;
  if (f < 90) phase = 'strong';
  else if (f < 120) phase = 'fade-out';
  else if (f < 150) phase = 'clear';
  else phase = 'fade-in';

  let intensity: number;
  if (phase === 'strong') intensity = 1;
  else if (phase === 'fade-out') intensity = 1 - (f - 90) / 30;
  else if (phase === 'clear') intensity = 0;
  else intensity = (f - 150) / 30;

  let bg = surface;
  if (phase === 'strong') {
    bg = Math.floor(frame / 5) % 2 === 0 ? surface : accentSoft;
  }

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const noiseCount = Math.floor(40 + intensity * 80);
  for (let i = 0; i < noiseCount; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12 * (0.3 + intensity * 0.7)})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
  }

  const chars = code.split('');
  const step = W / (chars.length + 1);
  const focusIndex = phase === 'strong' ? frame % chars.length : -1;

  chars.forEach((ch, i) => {
    ctx.save();
    const jitter = 3 + intensity * 5;
    const dx = (Math.random() - 0.5) * jitter * 2;
    const dy = (Math.random() - 0.5) * jitter * 2;
    const x = step * (i + 1) + dx;
    const y = H / 2 + dy;
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * (0.2 + intensity * 0.3));
    const fontSize = 24 + Math.floor(Math.random() * 8);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let alpha: number;
    let blur: number;
    if (phase === 'strong') {
      if (i === focusIndex) {
        alpha = 0.85 + Math.random() * 0.15;
        blur = 0;
      } else {
        alpha = 0.1 + Math.random() * 0.3;
        blur = 3;
      }
    } else if (phase === 'clear') {
      alpha = 0.85 + Math.random() * 0.15;
      blur = 0;
    } else {
      const t = 1 - intensity;
      alpha = 0.5 + t * 0.2 + (Math.random() - 0.5) * 0.05;
      blur = intensity * 3;
    }

    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    if (blur > 0) ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = text;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });

  const lineCount = Math.floor(2 + intensity * 6);
  for (let i = 0; i < lineCount; i++) {
    ctx.save();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.globalAlpha = 0.4 + intensity * 0.4;
    ctx.beginPath();
    const x1 = Math.random() * W;
    const y1 = Math.random() * H;
    const x2 = Math.random() * W;
    const y2 = Math.random() * H;
    const cpx = Math.random() * W;
    const cpy = Math.random() * H;
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cpx, cpy, x2, y2);
    ctx.stroke();
    ctx.restore();
  }
}

function readVar(root: HTMLElement, name: string, fallback: string): string {
  const v = getComputedStyle(root).getPropertyValue(name).trim();
  return v || fallback;
}

interface CssVars {
  surface: string;
  text: string;
  border: string;
  accentSoft: string;
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
  let rafId = 0;
  let frame = 0;
  let paused = false;
  let cssCache: CssVars | null = null;
  let cssCacheFrame = -100;

  function render() {
    current = generateChallenge();
    startTime = Date.now();
    cancelAnimationFrame(rafId);
    frame = 0;
    paused = false;
    cssCache = null;
    cssCacheFrame = -100;

    container.innerHTML = `
      <style>
        .fc-text{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-text[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-text[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-text{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-text-canvas{display:block;width:100%;max-width:280px;height:60px;border-radius:8px;border:1px solid var(--fc-border);margin-bottom:10px;box-shadow:0 0 0 1px var(--fc-border)}
        .fc-text-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
        .fc-text-input{flex:1;min-width:0;padding:8px 12px;font-size:14px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text);border-radius:8px;box-sizing:border-box;outline:none}
        .fc-text-input:focus{border-color:var(--fc-accent);box-shadow:0 0 0 3px var(--fc-accent-soft)}
        .fc-text-btn{padding:8px 16px;font-size:14px;border:1px solid var(--fc-accent);background:var(--fc-accent);color:#fff;border-radius:8px;cursor:pointer;transition:opacity .15s}
        .fc-text-btn:hover{opacity:.9}
        .fc-text-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-text-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-text-pause{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-text-pause:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-text-msg{font-size:13px;min-height:18px;margin-top:10px;color:var(--fc-danger)}
      </style>
      <div class="fc-text" data-theme="${theme}">
        <canvas class="fc-text-canvas" width="280" height="60"></canvas>
        <div class="fc-text-row">
          <input class="fc-text-input" placeholder="${t.placeholder}" />
          <button class="fc-text-btn">${t.submit}</button>
          <button class="fc-text-refresh">${t.refresh}</button>
          <button class="fc-text-pause">${t.pause}</button>
        </div>
        <div class="fc-text-msg"></div>
      </div>
    `;
    const root = container.querySelector('.fc-text') as HTMLElement;
    const canvas = container.querySelector('.fc-text-canvas') as HTMLCanvasElement;
    const code = current.code;

    function readCssVars(): CssVars {
      return {
        surface: readVar(root, '--fc-surface', '#f6f7f9'),
        text: readVar(root, '--fc-text', '#0f172a'),
        border: readVar(root, '--fc-border', '#e2e8f0'),
        accentSoft: readVar(root, '--fc-accent-soft', '#eef2ff'),
      };
    }

    function tick() {
      if (paused) return;
      if (!cssCache || frame - cssCacheFrame >= 30) {
        cssCache = readCssVars();
        cssCacheFrame = frame;
      }
      const c = cssCache;
      if (c) {
        drawFrame(canvas, code, frame, c.surface, c.text, c.border, c.accentSoft);
      }
      frame++;
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    (container.querySelector('.fc-text-refresh') as HTMLButtonElement)
      .addEventListener('click', render);

    const pauseBtn = container.querySelector('.fc-text-pause') as HTMLButtonElement;
    pauseBtn.addEventListener('click', () => {
      if (paused) {
        paused = false;
        pauseBtn.textContent = t.pause;
        rafId = requestAnimationFrame(tick);
      } else {
        paused = true;
        cancelAnimationFrame(rafId);
        pauseBtn.textContent = t.resume;
      }
    });

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
    destroy: () => {
      cancelAnimationFrame(rafId);
      container.innerHTML = '';
      listeners = [];
    },
    onResult: cb => listeners.push(cb),
  };
}
