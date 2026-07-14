import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type SliderChallenge } from './challenge.js';

const STR = {
  zh: { title: '拖动滑块到最右端', tip: '向右拖动', success: '验证成功', fail: '请拖到尽头', refresh: '刷新' },
  en: { title: 'Drag the slider to the right end', tip: 'Drag right', success: 'Verified', fail: 'Drag to the end', refresh: 'Refresh' },
};

export function createSliderInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
  let current: SliderChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let done = false;

  function render() {
    current = generateChallenge();
    startTime = Date.now();
    done = false;
    container.innerHTML = `
      <style>
        .fc-slider{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-slider[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-slider[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-slider{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-slider-title{font-size:14px;color:var(--fc-text);margin-bottom:12px;text-align:center}
        .fc-slider-track{position:relative;height:40px;background:var(--fc-surface);border:1px solid var(--fc-border);border-radius:20px}
        .fc-slider-progress{position:absolute;left:0;top:0;height:100%;width:0;background:var(--fc-accent);border-radius:20px;transition:width .05s,background .15s}
        .fc-slider-handle{position:absolute;left:0;top:50%;transform:translateY(-50%);width:50px;height:50px;background:var(--fc-bg);border:2px solid var(--fc-accent);border-radius:50%;cursor:grab;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.15);user-select:none;touch-action:none;transition:border-color .15s,color .15s}
        .fc-slider-handle:active{cursor:grabbing}
        .fc-slider-handle::after{content:'\\2192';color:var(--fc-accent);font-size:18px;font-weight:bold;transition:color .15s}
        .fc-slider-tip{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:13px;color:var(--fc-text-soft);pointer-events:none;transition:opacity .2s}
        .fc-slider-msg{font-size:13px;min-height:18px;text-align:center;margin-top:10px;color:var(--fc-success)}
        .fc-slider-row{display:flex;justify-content:center;margin-top:10px}
        .fc-slider-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-slider-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-slider-done .fc-slider-handle{border-color:var(--fc-success)}
        .fc-slider-done .fc-slider-handle::after{color:var(--fc-success)}
        .fc-slider-done .fc-slider-progress{background:var(--fc-success)}
      </style>
      <div class="fc-slider" data-theme="${theme}">
        <div class="fc-slider-title">${t.title}</div>
        <div class="fc-slider-track">
          <div class="fc-slider-progress"></div>
          <div class="fc-slider-handle" role="slider" tabindex="0"></div>
          <span class="fc-slider-tip">${t.tip}</span>
        </div>
        <div class="fc-slider-msg"></div>
        <div class="fc-slider-row">
          <button class="fc-slider-refresh">${t.refresh}</button>
        </div>
      </div>
    `;
    const root = container.querySelector('.fc-slider') as HTMLDivElement;
    const track = container.querySelector('.fc-slider-track') as HTMLDivElement;
    const handle = container.querySelector('.fc-slider-handle') as HTMLDivElement;
    const progress = container.querySelector('.fc-slider-progress') as HTMLDivElement;
    const tip = container.querySelector('.fc-slider-tip') as HTMLSpanElement;
    const msg = container.querySelector('.fc-slider-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-slider-refresh') as HTMLButtonElement;
    refreshBtn.addEventListener('click', render);

    let dragging = false;
    let startX = 0;
    let startOffset = 0;
    let currentOffset = 0;

    function applyPos(px: number) {
      handle.style.left = `${px}px`;
      progress.style.width = `${px}px`;
      tip.style.opacity = px > 8 ? '0' : '1';
    }

    handle.addEventListener('pointerdown', (e) => {
      if (done) return;
      dragging = true;
      startX = e.clientX;
      startOffset = currentOffset;
      try { handle.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const maxX = track.clientWidth - handle.offsetWidth;
      let px = startOffset + (e.clientX - startX);
      px = Math.max(0, Math.min(maxX, px));
      currentOffset = px;
      applyPos(px);
    });

    const finish = async () => {
      if (!dragging) return;
      dragging = false;
      const maxX = Math.max(1, track.clientWidth - handle.offsetWidth);
      if (currentOffset / maxX >= 0.95) {
        done = true;
        applyPos(maxX);
        root.classList.add('fc-slider-done');
        const result: CaptchaResult = {
          success: true,
          proof: await hashProof(proofInput(current)),
          duration: Date.now() - startTime,
        };
        msg.textContent = t.success;
        config.onVerify?.(result);
        listeners.forEach(cb => cb(result));
      } else {
        // 未到终点，弹回
        currentOffset = 0;
        handle.style.transition = 'left .3s';
        progress.style.transition = 'width .3s';
        applyPos(0);
        msg.textContent = t.fail;
        setTimeout(() => {
          handle.style.transition = '';
          progress.style.transition = '';
          if (!done) msg.textContent = '';
        }, 320);
      }
    };

    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => { container.innerHTML = ''; listeners = []; },
    onResult: cb => listeners.push(cb),
  };
}
