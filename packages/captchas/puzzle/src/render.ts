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

// 直角转弯轨道尺寸（S 形折返路径）
const TRACK_W = 300;
const TRACK_H = 100;
const HANDLE_W = 40;
const HANDLE_H = 40;

// S 形直角转弯路径点（3 段：右 -> 下 -> 左 -> 下 -> 右）
// 这是一个"回"字形折返路径，从左上角出发，到右下角终点
function zigzagPoints(): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const margin = HANDLE_W / 2;
  const w = TRACK_W - margin * 2;
  const h = TRACK_H - margin * 2;
  // 段 1: 从左到右 (y = margin)
  const seg1Steps = 30;
  for (let i = 0; i <= seg1Steps; i++) {
    pts.push({ x: margin + (w / seg1Steps) * i, y: margin });
  }
  // 段 2: 从右到下 (x = TRACK_W - margin, y 增长到中间)
  const seg2Steps = 10;
  const midY = margin + h / 4;
  for (let i = 1; i <= seg2Steps; i++) {
    pts.push({ x: TRACK_W - margin, y: margin + (midY - margin) / seg2Steps * i });
  }
  // 段 3: 从右到左 (y = midY)
  for (let i = 1; i <= seg1Steps; i++) {
    pts.push({ x: TRACK_W - margin - (w / seg1Steps) * i, y: midY });
  }
  // 段 4: 从左到下 (x = margin, y 增长到 3/4)
  const midY2 = margin + (h * 3) / 4;
  for (let i = 1; i <= seg2Steps; i++) {
    pts.push({ x: margin, y: midY + (midY2 - midY) / seg2Steps * i });
  }
  // 段 5: 从左到右 (y = midY2)
  for (let i = 1; i <= seg1Steps; i++) {
    pts.push({ x: margin + (w / seg1Steps) * i, y: midY2 });
  }
  // 段 6: 从右到下终点 (x = TRACK_W - margin, y 到底)
  for (let i = 1; i <= seg2Steps; i++) {
    pts.push({ x: TRACK_W - margin, y: midY2 + (TRACK_H - margin - midY2) / seg2Steps * i });
  }
  return pts;
}

function zigzagPath(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
}

function pointAtProgress(pts: { x: number; y: number }[], progress: number): { x: number; y: number } {
  const idx = Math.min(pts.length - 1, Math.max(0, Math.round(progress * (pts.length - 1))));
  return pts[idx]!;
}

// piece 的运动轨迹：圆形（与 handle 进度反向）
// progress 0 -> 1 时，piece 沿圆周从 0° 转到 -360°（逆时针）
function pieceCirclePos(progress: number): { x: number; y: number } {
  const cx = STAGE_W / 2;
  const cy = STAGE_H / 2;
  const radius = Math.min(STAGE_W, STAGE_H) / 2 - PIECE_W / 2 - 8;
  // piece 反向运动：进度增加时角度减小
  const angle = -progress * Math.PI * 2;
  return {
    x: cx + radius * Math.cos(angle) - PIECE_W / 2,
    y: cy + radius * Math.sin(angle) - PIECE_W / 2,
  };
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
    const pts = zigzagPoints();
    const pathD = zigzagPath(pts);
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

    const trackRect = track.getBoundingClientRect();
    const scaleX = trackRect.width / TRACK_W;
    const scaleY = trackRect.height / TRACK_H;

    function applyProgress(p: number) {
      currentProgress = Math.max(0, Math.min(1, p));
      // handle 沿直角转弯轨道移动
      const pt = pointAtProgress(pts, currentProgress);
      handle.style.left = `${(pt.x / TRACK_W) * 100}%`;
      handle.style.top = `${(pt.y / TRACK_H) * 100}%`;
      fgPath.style.strokeDashoffset = `${totalLen * (1 - currentProgress)}`;
      // piece 沿圆形路径运动（与进度反向）
      const piecePos = pieceCirclePos(currentProgress);
      piece.style.left = `${piecePos.x}px`;
      piece.style.top = `${piecePos.y}px`;
    }

    function bounceBack() {
      handle.style.transition = 'left .35s ease, top .35s ease, border-color .15s';
      piece.style.transition = 'left .35s ease, top .35s ease, background .15s, border-color .15s';
      fgPath.style.transition = 'stroke-dashoffset .35s ease, stroke .15s';
      applyProgress(0);
      setTimeout(() => {
        handle.style.transition = 'border-color .15s';
        piece.style.transition = 'background .15s, border-color .15s';
        fgPath.style.transition = 'stroke .15s';
      }, 360);
    }

    applyProgress(0);

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
      const dx = e.clientX - startPointer.x;
      const dy = e.clientY - startPointer.y;
      // 计算朝向终点的方向投影
      const currentPt = pointAtProgress(pts, startProgress);
      const currentScreenX = trackRect.left + currentPt.x * scaleX;
      const currentScreenY = trackRect.top + currentPt.y * scaleY;
      // 终点方向（路径上的下一个点）
      const nextIdx = Math.min(pts.length - 1, Math.round(startProgress * (pts.length - 1)) + 5);
      const nextPt = pts[nextIdx]!;
      const nextScreenX = trackRect.left + nextPt.x * scaleX;
      const nextScreenY = trackRect.top + nextPt.y * scaleY;
      const dirX = nextScreenX - currentScreenX;
      const dirY = nextScreenY - currentScreenY;
      const dirLen = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
      // 鼠标移动在路径切线方向的投影
      const projection = (dx * dirX + dy * dirY) / dirLen;
      const pathLen = totalLen * scaleX; // 转换为屏幕像素
      const deltaProgress = projection / pathLen;
      applyProgress(startProgress + deltaProgress);
      recorder.record(e.clientX, e.clientY);
    });

    const finish = async () => {
      if (!dragging) return;
      dragging = false;
      const trackPoints = recorder.stop();

      // piece 当前的水平百分比位置（用于校验是否对齐缺口）
      // piece 走圆形，其对齐缺口的位置是圆形上 x 最接近 gapLeft 的点
      // 简化：当 progress 对应的 piece x 位置在缺口容差内即通过
      const piecePos = pieceCirclePos(currentProgress);
      const pieceLeftPct = (piecePos.x / STAGE_W) * 100;
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
