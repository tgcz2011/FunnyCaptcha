import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof, TrackRecorder, analyzeTrack } from '@funnycaptcha/core';
import { generateChallenge, proofInput, verifyPosition, type PuzzleChallenge } from './challenge.js';

const STR = {
  zh: { title: '拖动滑块把拼图块移到缺口', success: '验证成功', fail: '未对齐缺口', botFail: '检测到异常操作', refresh: '刷新' },
  en: { title: 'Drag the slider to fit the puzzle', success: 'Verified', fail: 'Not aligned', botFail: 'Bot-like behavior', refresh: 'Refresh' },
};

// 舞台与拼图块尺寸
const STAGE_W = 300;
const STAGE_H = 200;
const PIECE_W = 50;
const MAX_OFFSET = STAGE_W - PIECE_W; // 拼图块可水平移动的最大距离

// 波浪形轨道尺寸（x 单调递增，不跨行）
const TRACK_W = 300;
const TRACK_H = 100;
const HANDLE_W = 40;
const HANDLE_H = 40;

// 正弦波浪路径点（从左到右，x 单调递增，y 上下波动）
function wavePath(): string {
  const margin = HANDLE_W / 2;
  const w = TRACK_W - margin * 2;
  const cy = TRACK_H / 2;
  const amp = (TRACK_H / 2) - margin - 4; // 波幅
  const steps = 80;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = margin + w * t;
    const y = cy + amp * Math.sin(t * Math.PI * 3); // 3 个波峰
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d.trim();
}

// piece 的运动轨迹：从左到右水平移动（y 固定在 stage 中间）
function piecePos(progress: number): { x: number; y: number } {
  const maxX = STAGE_W - PIECE_W;
  const x = maxX * progress;
  const y = (STAGE_H - PIECE_W) / 2;
  return { x, y };
}

export function createPuzzleInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
  const recorder = new TrackRecorder();
  let current: PuzzleChallenge;
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
    const gapLeft = (current.gapPosition / 100) * MAX_OFFSET;
    const pathD = wavePath();
    container.innerHTML = `
      <style>
        .fc-puzzle{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-puzzle[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-puzzle[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-puzzle{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-puzzle-title{font-size:14px;color:var(--fc-text);margin-bottom:12px;text-align:center}
        .fc-puzzle-stage{position:relative;width:${STAGE_W}px;height:${STAGE_H}px;margin:0 auto;border-radius:8px;overflow:hidden;border:1px solid var(--fc-border);background:linear-gradient(135deg,var(--fc-accent-soft),var(--fc-surface) 60%,var(--fc-accent-soft))}
        .fc-puzzle-gap{position:absolute;top:${(STAGE_H - PIECE_W) / 2}px;width:${PIECE_W}px;height:${PIECE_W}px;background:var(--fc-bg);border:2px dashed var(--fc-text-soft);border-radius:6px;box-shadow:inset 0 0 8px rgba(0,0,0,.15);transition:left .15s}
        .fc-puzzle-piece{position:absolute;width:${PIECE_W}px;height:${PIECE_W}px;border-radius:6px;background:linear-gradient(135deg,var(--fc-accent),var(--fc-accent-soft));border:2px solid var(--fc-bg);box-shadow:0 2px 6px rgba(0,0,0,.25);transition:background .15s,border-color .15s}
        .fc-puzzle-track{position:relative;width:${TRACK_W}px;height:${TRACK_H}px;margin:14px auto 0;background:var(--fc-surface);border:1px solid var(--fc-border);border-radius:8px;overflow:hidden}
        .fc-puzzle-svg{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
        .fc-puzzle-path-bg{fill:none;stroke:var(--fc-border);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
        .fc-puzzle-path-fg{fill:none;stroke:var(--fc-accent);stroke-width:4;stroke-linecap:round;stroke-linejoin:round;transition:stroke .15s}
        .fc-puzzle-handle{position:absolute;width:${HANDLE_W}px;height:${HANDLE_H}px;background:var(--fc-bg);border:2px solid var(--fc-accent);border-radius:50%;cursor:grab;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.2);user-select:none;touch-action:none;transition:border-color .15s;transform:translate(-50%,-50%);z-index:2}
        .fc-puzzle-handle:active{cursor:grabbing}
        .fc-puzzle-handle::after{content:'\\2192';color:var(--fc-accent);font-size:16px;font-weight:bold;transition:color .15s}
        .fc-puzzle-msg{font-size:13px;min-height:18px;text-align:center;margin-top:10px;color:var(--fc-success)}
        .fc-puzzle-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer;margin-top:8px;display:block;margin-left:auto;margin-right:auto}
        .fc-puzzle-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-puzzle-done .fc-puzzle-piece{background:linear-gradient(135deg,var(--fc-success),var(--fc-accent-soft));border-color:var(--fc-success)}
        .fc-puzzle-done .fc-puzzle-handle{border-color:var(--fc-success)}
        .fc-puzzle-done .fc-puzzle-handle::after{color:var(--fc-success)}
        .fc-puzzle-done .fc-puzzle-path-fg{stroke:var(--fc-success)}
      </style>
      <div class="fc-puzzle" data-theme="${theme}">
        <div class="fc-puzzle-title">${t.title}</div>
        <div class="fc-puzzle-stage">
          <div class="fc-puzzle-gap" style="left:${gapLeft}px"></div>
          <div class="fc-puzzle-piece" style="left:0;top:${(STAGE_H - PIECE_W) / 2}px"></div>
        </div>
        <div class="fc-puzzle-track">
          <svg class="fc-puzzle-svg" viewBox="0 0 ${TRACK_W} ${TRACK_H}">
            <path class="fc-puzzle-path-bg" d="${pathD}"></path>
            <path class="fc-puzzle-path-fg" d="${pathD}"></path>
          </svg>
          <div class="fc-puzzle-handle" role="slider" tabindex="0"></div>
        </div>
        <div class="fc-puzzle-msg"></div>
        <button class="fc-puzzle-refresh">${t.refresh}</button>
      </div>
    `;
    const root = container.querySelector('.fc-puzzle') as HTMLDivElement;
    const piece = container.querySelector('.fc-puzzle-piece') as HTMLDivElement;
    const track = container.querySelector('.fc-puzzle-track') as HTMLDivElement;
    const handle = container.querySelector('.fc-puzzle-handle') as HTMLDivElement;
    const msg = container.querySelector('.fc-puzzle-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-puzzle-refresh') as HTMLButtonElement;
    const fgPath = container.querySelector('.fc-puzzle-path-fg') as SVGPathElement;
    refreshBtn.addEventListener('click', () => render());

    const totalLen = fgPath.getTotalLength();
    fgPath.style.strokeDasharray = `${totalLen}`;
    fgPath.style.strokeDashoffset = `${totalLen}`;

    let dragging = false;
    let startPointer = { x: 0, y: 0 };
    let startProgress = 0;
    let currentProgress = 0;

    function applyProgress(p: number) {
      currentProgress = Math.max(0, Math.min(1, p));
      fgPath.style.strokeDashoffset = `${totalLen * (1 - currentProgress)}`;
      // piece 沿圆形路径运动（与进度反向）
      const pp = piecePos(currentProgress);
      piece.style.left = `${pp.x}px`;
      piece.style.top = `${pp.y}px`;
    }

    function bounceBack() {
      handle.style.transition = 'left .35s ease, top .35s ease, border-color .15s';
      piece.style.transition = 'left .35s ease, top .35s ease, background .15s, border-color .15s';
      fgPath.style.transition = 'stroke-dashoffset .35s ease, stroke .15s';
      handle.style.left = `${(HANDLE_W / 2 / TRACK_W) * 100}%`;
      handle.style.top = '50%';
      applyProgress(0);
      setTimeout(() => {
        handle.style.transition = 'border-color .15s';
        piece.style.transition = 'background .15s, border-color .15s';
        fgPath.style.transition = 'stroke .15s';
      }, 360);
    }

    applyProgress(0);
    handle.style.left = `${(HANDLE_W / 2 / TRACK_W) * 100}%`;
    handle.style.top = '50%';

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
      // handle 直接跟鼠标（真正跟手），进度按 x 位置计算（波浪路径 x 单调递增，不跨行）
      const rect = track.getBoundingClientRect();
      const svgX = (e.clientX - rect.left) / (rect.width / TRACK_W);
      const svgY = (e.clientY - rect.top) / (rect.height / TRACK_H);
      const clampedX = Math.max(0, Math.min(TRACK_W, svgX));
      const clampedY = Math.max(0, Math.min(TRACK_H, svgY));
      handle.style.left = `${(clampedX / TRACK_W) * 100}%`;
      handle.style.top = `${(clampedY / TRACK_H) * 100}%`;
      // 进度 = x 位置百分比
      applyProgress(clampedX / TRACK_W);
      recorder.record(e.clientX, e.clientY);
    });

    const finish = async () => {
      if (!dragging) return;
      dragging = false;
      const trackPoints = recorder.stop();

      // piece 当前的水平百分比位置（用于校验是否对齐缺口）
      // piece 走圆形，其对齐缺口的位置是圆形上 x 最接近 gapLeft 的点
      // 简化：当 progress 对应的 piece x 位置在缺口容差内即通过
      const pp = piecePos(currentProgress);
      const pieceLeftPct = (pp.x / STAGE_W) * 100;
      if (!verifyPosition(current, pieceLeftPct)) {
        bounceBack();
        msg.style.color = 'var(--fc-danger)';
        msg.textContent = t.fail;
        return;
      }

      const analysis = analyzeTrack(trackPoints);

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

      done = true;
      root.classList.add('fc-puzzle-done');
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
