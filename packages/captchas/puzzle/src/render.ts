import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof, TrackRecorder, analyzeTrack } from '@funnycaptcha/core';
import { generateChallenge, proofInput, verifyPosition, type PuzzleChallenge } from './challenge.js';

const STR = {
  zh: { title: '拖动滑块把拼图块移到缺口', success: '验证成功', fail: '未对齐缺口', botFail: '检测到异常操作', refresh: '刷新' },
  en: { title: 'Drag the slider to fit the puzzle', success: 'Verified', fail: 'Not aligned', botFail: 'Bot-like behavior', refresh: 'Refresh' },
};

// 舞台与拼图块尺寸
const STAGE_W = 300;
const PIECE_W = 50;
const MAX_OFFSET = STAGE_W - PIECE_W; // 拼图块可水平移动的最大距离

// 拖拽轨道尺寸
const TRACK_W = 300;
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
    container.innerHTML = `
      <style>
        .fc-puzzle{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-puzzle[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-puzzle[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-puzzle{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-puzzle-title{font-size:14px;color:var(--fc-text);margin-bottom:12px;text-align:center}
        .fc-puzzle-stage{position:relative;width:${STAGE_W}px;height:160px;border-radius:8px;overflow:hidden;border:1px solid var(--fc-border);background:linear-gradient(135deg,var(--fc-accent-soft),var(--fc-surface) 60%,var(--fc-accent-soft))}
        .fc-puzzle-gap{position:absolute;top:55px;width:${PIECE_W}px;height:${PIECE_W}px;background:var(--fc-bg);border:2px dashed var(--fc-text-soft);border-radius:6px;box-shadow:inset 0 0 8px rgba(0,0,0,.15)}
        .fc-puzzle-piece{position:absolute;top:55px;left:0;width:${PIECE_W}px;height:${PIECE_W}px;border-radius:6px;background:linear-gradient(135deg,var(--fc-accent),var(--fc-accent-soft));border:2px solid var(--fc-bg);box-shadow:0 2px 6px rgba(0,0,0,.25);transition:background .15s,border-color .15s}
        .fc-puzzle-track{position:relative;width:${TRACK_W}px;height:${TRACK_H}px;margin:14px auto 0;background:var(--fc-surface);border:1px solid var(--fc-border);border-radius:20px}
        .fc-puzzle-curve{position:absolute;left:0;top:0;width:100%;height:${TRACK_H}px;pointer-events:none}
        .fc-puzzle-curve-bg{fill:none;stroke:var(--fc-border);stroke-width:4;stroke-linecap:round}
        .fc-puzzle-curve-fg{fill:none;stroke:var(--fc-accent);stroke-width:4;stroke-linecap:round;transition:stroke .15s}
        .fc-puzzle-handle{position:absolute;left:0;top:${BASE_Y}px;width:${HANDLE_W}px;height:${HANDLE_H}px;background:var(--fc-bg);border:2px solid var(--fc-accent);border-radius:50%;cursor:grab;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.15);user-select:none;touch-action:none;transition:border-color .15s}
        .fc-puzzle-handle:active{cursor:grabbing}
        .fc-puzzle-handle::after{content:'\\2192';color:var(--fc-accent);font-size:18px;font-weight:bold;transition:color .15s}
        .fc-puzzle-msg{font-size:13px;min-height:18px;text-align:center;margin-top:10px;color:var(--fc-success)}
        .fc-puzzle-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer;margin-top:8px;display:block;margin-left:auto;margin-right:auto}
        .fc-puzzle-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-puzzle-done .fc-puzzle-piece{background:linear-gradient(135deg,var(--fc-success),var(--fc-accent-soft));border-color:var(--fc-success)}
        .fc-puzzle-done .fc-puzzle-handle{border-color:var(--fc-success)}
        .fc-puzzle-done .fc-puzzle-handle::after{color:var(--fc-success)}
        .fc-puzzle-done .fc-puzzle-curve-fg{stroke:var(--fc-success)}
      </style>
      <div class="fc-puzzle" data-theme="${theme}">
        <div class="fc-puzzle-title">${t.title}</div>
        <div class="fc-puzzle-stage">
          <div class="fc-puzzle-gap" style="left:${gapLeft}px"></div>
          <div class="fc-puzzle-piece" style="left:0"></div>
        </div>
        <div class="fc-puzzle-track">
          <svg class="fc-puzzle-curve" width="100%" height="${TRACK_H}" preserveAspectRatio="none">
            <path class="fc-puzzle-curve-bg"></path>
            <path class="fc-puzzle-curve-fg"></path>
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
    const bgPath = container.querySelector('.fc-puzzle-curve-bg') as SVGPathElement;
    const fgPath = container.querySelector('.fc-puzzle-curve-fg') as SVGPathElement;
    refreshBtn.addEventListener('click', () => render());

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
      // piece 水平移动（与 handle 位置成比例）
      piece.style.left = `${(px / maxX()) * MAX_OFFSET}px`;
    }

    function bounceBack() {
      currentOffset = 0;
      handle.style.transition = 'left .3s, top .3s, border-color .15s';
      piece.style.transition = 'left .3s, background .15s, border-color .15s';
      fgPath.style.transition = 'stroke-dashoffset .3s, stroke .15s';
      applyPos(0);
      setTimeout(() => {
        handle.style.transition = '';
        piece.style.transition = 'background .15s, border-color .15s';
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

      // a. 位置容差判定（松手后）：value 为 0-100 百分比
      const percentage = (currentOffset / maxX()) * 100;
      if (!verifyPosition(current, percentage)) {
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
      piece.style.left = `${gapLeft}px`;
      applyPos(maxX());
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
