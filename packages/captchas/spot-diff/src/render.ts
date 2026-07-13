import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, verifyDiffs, type SpotDiffChallenge } from './challenge.js';

const STR = {
  zh: { title: '找出两处不同', hint: '点击右侧网格中不同的格子', found: '已找到', success: '验证成功', fail: '找得不对，再来一次' },
  en: { title: 'Spot 2 differences', hint: 'Click the differing cells on the right grid', found: 'Found', success: 'Verified', fail: 'Not quite, try again' },
};

export function createSpotDiffInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  let current: SpotDiffChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let marked: Set<number> = new Set();
  let finished = false;

  function renderGrid(emojis: string[], clickable: boolean): string {
    const cls = clickable ? 'fc-spot-diff-cell fc-spot-diff-clickable' : 'fc-spot-diff-cell';
    return emojis.map((e, i) => `<div class="${cls}" data-idx="${i}">${e}</div>`).join('');
  }

  function render() {
    current = generateChallenge();
    marked = new Set();
    finished = false;
    startTime = Date.now();
    container.innerHTML = `
      <style>
        .fc-spot-diff{font-family:-apple-system,system-ui,sans-serif;width:360px;padding:16px;box-sizing:border-box}
        .fc-spot-diff-title{font-size:14px;color:#333;margin-bottom:6px;text-align:center;font-weight:600}
        .fc-spot-diff-hint{font-size:12px;color:#888;margin-bottom:12px;text-align:center}
        .fc-spot-diff-grids{display:flex;gap:16px;justify-content:center}
        .fc-spot-diff-grid{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(3,48px);gap:4px;background:#f5f5f5;padding:8px;border-radius:8px;border:1px solid #e0e0e0}
        .fc-spot-diff-cell{display:flex;align-items:center;justify-content:center;font-size:26px;background:#fff;border-radius:6px;user-select:none}
        .fc-spot-diff-clickable{cursor:pointer;transition:transform .12s,box-shadow .12s}
        .fc-spot-diff-clickable:hover{transform:scale(1.06)}
        .fc-spot-diff-marked{box-shadow:0 0 0 3px #4a90d9 inset;background:#eaf3ff}
        .fc-spot-diff-wrong{box-shadow:0 0 0 3px #e53935 inset;background:#fdecea}
        .fc-spot-diff-status{font-size:13px;min-height:18px;text-align:center;margin-top:12px;color:#2e7d32}
        .fc-spot-diff-status-fail{color:#e53935}
      </style>
      <div class="fc-spot-diff">
        <div class="fc-spot-diff-title">${t.title}</div>
        <div class="fc-spot-diff-hint">${t.hint}</div>
        <div class="fc-spot-diff-grids">
          <div class="fc-spot-diff-grid">${renderGrid(current.gridA, false)}</div>
          <div class="fc-spot-diff-grid fc-spot-diff-grid-b">${renderGrid(current.gridB, true)}</div>
        </div>
        <div class="fc-spot-diff-status">${t.found} 0/${current.diffs.length}</div>
      </div>
    `;
    const gridB = container.querySelector('.fc-spot-diff-grid-b') as HTMLDivElement;
    const status = container.querySelector('.fc-spot-diff-status') as HTMLDivElement;

    gridB.querySelectorAll('.fc-spot-diff-clickable').forEach(el => {
      el.addEventListener('click', async () => {
        if (finished) return;
        const cell = el as HTMLElement;
        const idx = Number(cell.dataset.idx);
        if (marked.has(idx)) {
          // 取消标记
          marked.delete(idx);
          cell.classList.remove('fc-spot-diff-marked');
        } else {
          marked.add(idx);
          cell.classList.add('fc-spot-diff-marked');
        }
        status.textContent = `${t.found} ${marked.size}/${current.diffs.length}`;
        // 标记数达到差异数时自动校验
        if (marked.size === current.diffs.length) {
          const userDiffs = Array.from(marked);
          const ok = verifyDiffs(current, userDiffs);
          if (ok) {
            finished = true;
            const result: CaptchaResult = {
              success: true,
              proof: await hashProof(userDiffs.slice().sort((a, b) => a - b).join(',')),
              duration: Date.now() - startTime,
            };
            status.textContent = t.success;
            config.onVerify?.(result);
            listeners.forEach(cb => cb(result));
          } else {
            // 标错：高亮错误后重置
            finished = true;
            status.textContent = t.fail;
            status.classList.add('fc-spot-diff-status-fail');
            userDiffs.forEach(i => {
              const node = gridB.querySelector(`[data-idx="${i}"]`) as HTMLElement;
              node.classList.add('fc-spot-diff-wrong');
            });
            setTimeout(render, 800);
          }
        }
      });
    });
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => { container.innerHTML = ''; listeners = []; },
    onResult: cb => listeners.push(cb),
  };
}
