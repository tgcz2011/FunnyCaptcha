import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, verifyPosition, type PuzzleChallenge } from './challenge.js';

const STR = {
  zh: { title: '拖动滑块把拼图块移到缺口', success: '验证成功', refresh: '刷新' },
  en: { title: 'Drag the slider to fit the puzzle', success: 'Verified', refresh: 'Refresh' },
};

// 舞台与拼图块尺寸
const STAGE_W = 300;
const PIECE_W = 50;
const MAX_OFFSET = STAGE_W - PIECE_W; // 拼图块可水平移动的最大距离

export function createPuzzleInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  let current: PuzzleChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let done = false;

  function render() {
    current = generateChallenge();
    startTime = Date.now();
    done = false;
    const gapLeft = (current.gapPosition / 100) * MAX_OFFSET;
    container.innerHTML = `
      <style>
        .fc-puzzle{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-puzzle[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-puzzle[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-puzzle-title{font-size:14px;color:var(--fc-text);margin-bottom:12px;text-align:center}
        .fc-puzzle-stage{position:relative;width:${STAGE_W}px;height:160px;border-radius:8px;overflow:hidden;border:1px solid var(--fc-border);background:linear-gradient(135deg,var(--fc-accent-soft),var(--fc-surface) 60%,var(--fc-accent-soft))}
        .fc-puzzle-gap{position:absolute;top:55px;width:${PIECE_W}px;height:${PIECE_W}px;background:var(--fc-bg);border:2px dashed var(--fc-text-soft);border-radius:6px;box-shadow:inset 0 0 8px rgba(0,0,0,.15)}
        .fc-puzzle-piece{position:absolute;top:55px;left:0;width:${PIECE_W}px;height:${PIECE_W}px;border-radius:6px;background:linear-gradient(135deg,var(--fc-accent),var(--fc-accent-soft));border:2px solid var(--fc-bg);box-shadow:0 2px 6px rgba(0,0,0,.25)}
        .fc-puzzle-range{width:${STAGE_W}px;margin-top:14px;accent-color:var(--fc-accent)}
        .fc-puzzle-msg{font-size:13px;min-height:18px;text-align:center;margin-top:10px;color:var(--fc-success)}
        .fc-puzzle-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer;margin-top:8px;display:block;margin-left:auto;margin-right:auto}
        .fc-puzzle-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
      </style>
      <div class="fc-puzzle" data-theme="${config.theme}">
        <div class="fc-puzzle-title">${t.title}</div>
        <div class="fc-puzzle-stage">
          <div class="fc-puzzle-gap" style="left:${gapLeft}px"></div>
          <div class="fc-puzzle-piece" style="left:0"></div>
        </div>
        <input class="fc-puzzle-range" type="range" min="0" max="100" step="1" value="0" />
        <div class="fc-puzzle-msg"></div>
        <button class="fc-puzzle-refresh">${t.refresh}</button>
      </div>
    `;
    const piece = container.querySelector('.fc-puzzle-piece') as HTMLDivElement;
    const range = container.querySelector('.fc-puzzle-range') as HTMLInputElement;
    const msg = container.querySelector('.fc-puzzle-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-puzzle-refresh') as HTMLButtonElement;
    refreshBtn.addEventListener('click', () => render());

    range.addEventListener('input', async () => {
      if (done) return;
      const v = Number(range.value);
      piece.style.left = `${(v / 100) * MAX_OFFSET}px`;
      if (verifyPosition(current, v)) {
        done = true;
        range.disabled = true;
        piece.style.left = `${gapLeft}px`;
        const result: CaptchaResult = {
          success: true,
          proof: await hashProof(proofInput(current)),
          duration: Date.now() - startTime,
        };
        msg.textContent = t.success;
        config.onVerify?.(result);
        listeners.forEach(cb => cb(result));
      }
    });
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => { container.innerHTML = ''; listeners = []; },
    onResult: cb => listeners.push(cb),
  };
}
