import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof, TrackRecorder, analyzeTrack } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type SliderChallenge } from './challenge.js';

const STR = {
  zh: { title: '沿螺旋拖动滑块到终点', tip: '沿螺旋路径拖动', success: '验证成功', fail: '请拖到尽头', botFail: '检测到异常操作', refresh: '刷新' },
  en: { title: 'Drag along the spiral to the center', tip: 'Follow the spiral', success: 'Verified', fail: 'Drag to the end', botFail: 'Bot-like behavior', refresh: 'Refresh' },
};

// 螺旋轨道画布尺寸
const CANVAS_W = 320;
const CANVAS_H = 200;
const HANDLE_W = 36;
const HANDLE_H = 36;

// 螺旋参数：阿基米德螺旋 r = a + b*θ
// 从外向内，θ 从 0 到 6π（3 圈）
// 半径受画布限制：CY=100，留 8px 边距，r_max ≤ 92
// r_max = SPIRAL_B * SPIRAL_THETA_MAX = 5 * 6π ≈ 94.2
const SPIRAL_THETA_MAX = 6 * Math.PI;
const SPIRAL_A = 0;   // 起始半径（0 = 终点在正中心）
const SPIRAL_B = 5;   // 每圈半径增量（调小以适配画布）

// 中心点
const CX = CANVAS_W / 2;
const CY = CANVAS_H / 2;

// 螺旋外端最大半径（用于极坐标距离映射）
const SPIRAL_R_MAX = SPIRAL_B * SPIRAL_THETA_MAX;

// 预生成螺旋路径点（从外向内，用户从外端开始拖到中心）
function spiralPoints(): { x: number; y: number; theta: number }[] {
  const steps = 200;
  const pts: { x: number; y: number; theta: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    // t: 0 -> 1, theta: SPIRAL_THETA_MAX -> 0（外到内）
    const t = i / steps;
    const theta = SPIRAL_THETA_MAX * (1 - t);
    const r = SPIRAL_A + SPIRAL_B * theta;
    const x = CX + r * Math.cos(theta);
    const y = CY + r * Math.sin(theta);
    pts.push({ x, y, theta });
  }
  return pts;
}

// 生成 SVG path
function spiralPath(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
}

// 根据进度 (0-1) 获取螺旋上的点
function pointAtProgress(pts: { x: number; y: number }[], progress: number): { x: number; y: number } {
  const idx = Math.min(pts.length - 1, Math.max(0, Math.round(progress * (pts.length - 1))));
  return pts[idx]!;
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
    const pts = spiralPoints();
    const pathD = spiralPath(pts);
    container.innerHTML = `
      <style>
        .fc-slider{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-slider[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-slider[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-slider{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-slider-title{font-size:14px;color:var(--fc-text);margin-bottom:12px;text-align:center}
        .fc-slider-stage{position:relative;width:${CANVAS_W}px;height:${CANVAS_H}px;margin:0 auto;background:var(--fc-surface);border:1px solid var(--fc-border);border-radius:10px;overflow:hidden}
        .fc-slider-svg{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
        .fc-slider-path-bg{fill:none;stroke:var(--fc-border);stroke-width:3;stroke-linecap:round}
        .fc-slider-path-fg{fill:none;stroke:var(--fc-accent);stroke-width:4;stroke-linecap:round;transition:stroke .15s}
        .fc-slider-target{fill:none;stroke:var(--fc-success);stroke-width:2;stroke-dasharray:4 3;opacity:.7}
        .fc-slider-handle{position:absolute;width:${HANDLE_W}px;height:${HANDLE_H}px;background:var(--fc-bg);border:2px solid var(--fc-accent);border-radius:50%;cursor:grab;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.2);user-select:none;touch-action:none;transition:border-color .15s;transform:translate(-50%,-50%);z-index:2}
        .fc-slider-handle:active{cursor:grabbing}
        .fc-slider-handle::after{content:'';width:10px;height:10px;background:var(--fc-accent);border-radius:50%;transition:background .15s}
        .fc-slider-tip{position:absolute;left:50%;top:8px;transform:translateX(-50%);font-size:12px;color:var(--fc-text-soft);pointer-events:none;transition:opacity .2s;background:var(--fc-bg);padding:2px 8px;border-radius:4px}
        .fc-slider-msg{font-size:13px;min-height:18px;text-align:center;margin-top:10px;color:var(--fc-success)}
        .fc-slider-row{display:flex;justify-content:center;margin-top:10px}
        .fc-slider-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-slider-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-slider-done .fc-slider-handle{border-color:var(--fc-success)}
        .fc-slider-done .fc-slider-handle::after{background:var(--fc-success)}
        .fc-slider-done .fc-slider-path-fg{stroke:var(--fc-success)}
      </style>
      <div class="fc-slider" data-theme="${theme}">
        <div class="fc-slider-title">${t.title}</div>
        <div class="fc-slider-stage">
          <svg class="fc-slider-svg" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
            <path class="fc-slider-path-bg" d="${pathD}"></path>
            <path class="fc-slider-path-fg" d="${pathD}"></path>
            <circle class="fc-slider-target" cx="${CX}" cy="${CY}" r="14"></circle>
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
    const stage = container.querySelector('.fc-slider-stage') as HTMLDivElement;
    const handle = container.querySelector('.fc-slider-handle') as HTMLDivElement;
    const tip = container.querySelector('.fc-slider-tip') as HTMLSpanElement;
    const msg = container.querySelector('.fc-slider-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-slider-refresh') as HTMLButtonElement;
    const fgPath = container.querySelector('.fc-slider-path-fg') as SVGPathElement;
    refreshBtn.addEventListener('click', render);

    // 计算路径总长度，用于进度
    const totalLen = fgPath.getTotalLength();
    fgPath.style.strokeDasharray = `${totalLen}`;
    fgPath.style.strokeDashoffset = `${totalLen}`;

    let dragging = false;
    let startPointer = { x: 0, y: 0 };
    let startProgress = 0;
    let currentProgress = 0; // 0 = 外端, 1 = 中心

    function applyProgress(p: number) {
      currentProgress = Math.max(0, Math.min(1, p));
      const pt = pointAtProgress(pts, currentProgress);
      // handle 用百分比定位，适配 stage 实际尺寸
      handle.style.left = `${(pt.x / CANVAS_W) * 100}%`;
      handle.style.top = `${(pt.y / CANVAS_H) * 100}%`;
      fgPath.style.strokeDashoffset = `${totalLen * (1 - currentProgress)}`;
      tip.style.opacity = currentProgress > 0.02 ? '0' : '1';
    }

    function bounceBack() {
      handle.style.transition = 'left .35s ease, top .35s ease, border-color .15s';
      fgPath.style.transition = 'stroke-dashoffset .35s ease, stroke .15s';
      applyProgress(0);
      setTimeout(() => {
        handle.style.transition = 'border-color .15s';
        fgPath.style.transition = 'stroke .15s';
      }, 360);
    }

    applyProgress(0);

    // 核心：把鼠标水平/垂直位移映射到螺旋进度
    // 由于螺旋是 2D 的，我们用鼠标移动的距离（向中心方向的投影）来推进进度
    handle.addEventListener('pointerdown', (e) => {
      if (done || locked) return;
      dragging = true;
      startPointer = { x: e.clientX, y: e.clientY };
      startProgress = currentProgress;
      recorder.start();
      try { handle.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      // 极坐标距离映射：鼠标到中心的距离 r → 螺旋进度
      // 阿基米德螺旋 r = SPIRAL_B * theta，theta 从 theta_max(外) 到 0(中心)
      // progress = 1 - theta/theta_max = 1 - r/r_max
      // 鼠标越接近中心 → r 越小 → progress 越接近 1（终点）
      // 鼠标越远离中心 → r 越大 → progress 越接近 0（起点）
      // 实时获取 stage 坐标（避免页面滚动后 stageRect 过时）
      const rect = stage.getBoundingClientRect();
      const sx = rect.width / CANVAS_W;
      const sy = rect.height / CANVAS_H;
      const svgX = (e.clientX - rect.left) / sx;
      const svgY = (e.clientY - rect.top) / sy;
      const dx = svgX - CX;
      const dy = svgY - CY;
      const r = Math.sqrt(dx * dx + dy * dy);
      const progress = 1 - r / SPIRAL_R_MAX;
      // 平滑推进：限制单步变化幅度，避免抖动跨越圈
      const step = progress - currentProgress;
      const maxStep = 0.08; // 单次最多推进 8%
      const clampedStep = Math.max(-maxStep, Math.min(maxStep, step));
      applyProgress(currentProgress + clampedStep);
      recorder.record(e.clientX, e.clientY);
    });

    const finish = async () => {
      if (!dragging) return;
      dragging = false;
      const trackPoints = recorder.stop();

      // a. 位置判定：进度 >= 0.92 算到达中心
      if (currentProgress < 0.85) {
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
      applyProgress(1);
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
