import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof, TrackRecorder, analyzeTrack } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type SliderChallenge } from './challenge.js';

const STR = {
  zh: { title: '沿曲线拖动滑块到终点', tip: '向右拖动', success: '验证成功', fail: '请拖到尽头', botFail: '检测到异常操作', refresh: '刷新' },
  en: { title: 'Drag along the curve to the end', tip: 'Drag right', success: 'Verified', fail: 'Drag to the end', botFail: 'Bot-like behavior', refresh: 'Refresh' },
};

const TRACK_H = 60;
const HANDLE_W = 50;
const HANDLE_H = 50;
const AMP = 14;
const BASE_Y = TRACK_H / 2 - HANDLE_H / 2;

// 生成正弦曲线路径
function sinePath(width: number, height: number, amp: number): string {
  const steps = 40;
  const baseY = height / 2;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const y = baseY + amp * Math.sin((i / steps) * Math.PI * 2);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d;
}

export function createSliderInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
  const recorder = new TrackRecorder();
  let current: SliderChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let done = false;
  let locked = false;

  function render() {
    current = generateChallenge();
    startTime = Date.now();
    done = false;
    locked = false;
    recorder.clear();
    container.innerHTML = `
      <style>
        .fc-slider{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-slider[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-slider[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-slider{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-slider-title{font-size:14px;color:var(--fc-text);margin-bottom:12px;text-align:center}
        .fc-slider-track{position:relative;height:${TRACK_H}px;background:var(--fc-surface);border:1px solid var(--fc-border);border-radius:20px}
        .fc-slider-curve{position:absolute;left:0;top:0;width:100%;height:${TRACK_H}px;pointer-events:none}
        .fc-slider-curve-bg{fill:none;stroke:var(--fc-border);stroke-width:4;stroke-linecap:round}
        .fc-slider-curve-fg{fill:none;stroke:var(--fc-accent);stroke-width:4;stroke-linecap:round;transition:stroke .15s}
        .fc-slider-handle{position:absolute;left:0;top:${BASE_Y}px;width:${HANDLE_W}px;height:${HANDLE_H}px;background:var(--fc-bg);border:2px solid var(--fc-accent);border-radius:50%;cursor:grab;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.15);user-select:none;touch-action:none;transition:border-color .15s,color .15s}
        .fc-slider-handle:active{cursor:grabbing}
        .fc-slider-handle::after{content:'\\2192';color:var(--fc-accent);font-size:18px;font-weight:bold;transition:color .15s}
        .fc-slider-tip{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:13px;color:var(--fc-text-soft);pointer-events:none;transition:opacity .2s}
        .fc-slider-msg{font-size:13px;min-height:18px;text-align:center;margin-top:10px;color:var(--fc-success)}
        .fc-slider-row{display:flex;justify-content:center;margin-top:10px}
        .fc-slider-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-slider-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-slider-done .fc-slider-handle{border-color:var(--fc-success)}
        .fc-slider-done .fc-slider-handle::after{color:var(--fc-success)}
        .fc-slider-done .fc-slider-curve-fg{stroke:var(--fc-success)}
      </style>
      <div class="fc-slider" data-theme="${theme}">
        <div class="fc-slider-title">${t.title}</div>
        <div class="fc-slider-track">
          <svg class="fc-slider-curve" width="100%" height="${TRACK_H}" preserveAspectRatio="none">
            <path class="fc-slider-curve-bg"></path>
            <path class="fc-slider-curve-fg"></path>
          </svg>
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
    const tip = container.querySelector('.fc-slider-tip') as HTMLSpanElement;
    const msg = container.querySelector('.fc-slider-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-slider-refresh') as HTMLButtonElement;
    const bgPath = container.querySelector('.fc-slider-curve-bg') as SVGPathElement;
    const fgPath = container.querySelector('.fc-slider-curve-fg') as SVGPathElement;
    refreshBtn.addEventListener('click', render);

    // 绘制正弦曲线
    const width = track.clientWidth;
    const d = sinePath(width, TRACK_H, AMP);
    bgPath.setAttribute('d', d);
    fgPath.setAttribute('d', d);
    const totalLen = fgPath.getTotalLength();
    fgPath.style.strokeDasharray = `${totalLen}`;
    fgPath.style.strokeDashoffset = `${totalLen}`;

    let dragging = false;
    let startX = 0;
    let startOffset = 0;
    let currentOffset = 0;

    function maxX(): number {
      return Math.max(1, track.clientWidth - handle.offsetWidth);
    }

    function curveTop(left: number): number {
      return BASE_Y + AMP * Math.sin((left / maxX()) * Math.PI * 2);
    }

    function applyPos(px: number) {
      handle.style.left = `${px}px`;
      handle.style.top = `${curveTop(px)}px`;
      const frac = px / maxX();
      fgPath.style.strokeDashoffset = `${totalLen * (1 - frac)}`;
      tip.style.opacity = px > 8 ? '0' : '1';
    }

    function bounceBack() {
      currentOffset = 0;
      handle.style.transition = 'left .3s, top .3s, border-color .15s, color .15s';
      fgPath.style.transition = 'stroke-dashoffset .3s, stroke .15s';
      applyPos(0);
      setTimeout(() => {
        handle.style.transition = '';
        fgPath.style.transition = 'stroke .15s';
      }, 320);
    }

    applyPos(0);

    handle.addEventListener('pointerdown', (e) => {
      if (done || locked) return;
      dragging = true;
      startX = e.clientX;
      startOffset = currentOffset;
      recorder.start();
      try { handle.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      let px = startOffset + (e.clientX - startX);
      px = Math.max(0, Math.min(maxX(), px));
      currentOffset = px;
      recorder.record(e.clientX, e.clientY);
      applyPos(px);
    });

    const finish = async () => {
      if (!dragging) return;
      dragging = false;
      const trackPoints = recorder.stop();

      // a. 位置判定（松手后）
      if (currentOffset / maxX() < 0.92) {
        bounceBack();
        msg.style.color = 'var(--fc-danger)';
        msg.textContent = t.fail;
        return;
      }

      // c. 行为分析
      const analysis = analyzeTrack(trackPoints);

      // d. 机器人检测
      if (analysis.isBot) {
        locked = true;
        msg.style.color = 'var(--fc-danger)';
        msg.textContent = config.locale === 'zh'
          ? `疑似机器人操作（${analysis.reasons.join('、')}）`
          : `${t.botFail} detected`;
        bounceBack();
        setTimeout(() => { if (!done) render(); }, 2000);
        return;
      }

      // e. 通过
      done = true;
      applyPos(maxX());
      root.classList.add('fc-slider-done');
      const result: CaptchaResult = {
        success: true,
        proof: await hashProof(proofInput(current)),
        duration: Date.now() - startTime,
        metadata: { humanScore: analysis.humanScore, reasons: analysis.reasons },
      };
      msg.style.color = 'var(--fc-success)';
      msg.textContent = t.success;
      config.onVerify?.(result);
      listeners.forEach(cb => cb(result));
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
