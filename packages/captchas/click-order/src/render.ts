import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, verifyOrder, type ClickOrderChallenge } from './challenge.js';

const STR = {
  zh: { title: '按 1 → 2 → 3 → 4 顺序点击', success: '验证成功', fail: '顺序错误，请重试', refresh: '刷新' },
  en: { title: 'Click in order 1 → 2 → 3 → 4', success: 'Verified', fail: 'Wrong order, try again', refresh: 'Refresh' },
};

// 区域尺寸
const AREA_W = 280;
const AREA_H = 180;
const BOX_W = 100;
const BOX_H = 60;
// 最小间距（任意两个槽位中心/左上角之间的欧氏距离），防重叠
const MIN_DIST = 110;

// 在 AREA_W×AREA_H 区域内随机生成 count 个不重叠槽位
function generateSlots(count: number): { x: number; y: number }[] {
  const maxX = AREA_W - BOX_W;
  const maxY = AREA_H - BOX_H;
  const slots: { x: number; y: number }[] = [];
  let attempts = 0;
  while (slots.length < count && attempts < 1000) {
    attempts++;
    const candidate = { x: Math.random() * maxX, y: Math.random() * maxY };
    let ok = true;
    for (const s of slots) {
      const dx = candidate.x - s.x;
      const dy = candidate.y - s.y;
      if (Math.sqrt(dx * dx + dy * dy) < MIN_DIST) { ok = false; break; }
    }
    if (ok) slots.push(candidate);
  }
  // 兜底：若拒绝采样未填满，剩余用伪随机补齐（极少触发）
  while (slots.length < count) {
    slots.push({ x: Math.random() * maxX, y: Math.random() * maxY });
  }
  return slots;
}

export function createClickOrderInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
  let current: ClickOrderChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let clicked: number[] = [];
  let finished = false;

  function render() {
    current = generateChallenge();
    clicked = [];
    finished = false;
    startTime = Date.now();
    const slots = generateSlots(current.targets.length);
    const boxes = current.targets.map((num, i) => {
      const slot = slots[i]!;
      return `<div class="fc-click-box" data-num="${num}" style="left:${Math.round(slot.x)}px;top:${Math.round(slot.y)}px;">${num}</div>`;
    }).join('');
    container.innerHTML = `
      <style>
        .fc-click{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-click[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-click[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-click{background:var(--fc-bg);border:1px solid var(--fc-border);border-radius:10px;color:var(--fc-text)}
        .fc-click-title{font-size:14px;color:var(--fc-text);margin-bottom:12px;text-align:center}
        .fc-click-area{position:relative;width:${AREA_W}px;height:${AREA_H}px;background:var(--fc-surface);border-radius:8px;border:1px solid var(--fc-border);overflow:hidden}
        .fc-click-box{position:absolute;width:${BOX_W}px;height:${BOX_H}px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:var(--fc-accent);background:var(--fc-bg);border:2px solid var(--fc-accent);border-radius:8px;cursor:pointer;user-select:none;transition:transform .15s,background .15s,color .15s,border-color .15s}
        .fc-click-box:hover{transform:scale(1.05)}
        .fc-click-box-active{background:var(--fc-accent);color:var(--fc-bg)}
        .fc-click-box-done{background:var(--fc-success);border-color:var(--fc-success);color:#fff;cursor:default}
        .fc-click-box-done:hover{transform:none}
        .fc-click-row{display:flex;justify-content:center;margin-top:10px}
        .fc-click-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer}
        .fc-click-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
        .fc-click-msg{font-size:13px;min-height:18px;text-align:center;margin-top:10px;color:var(--fc-success)}
      </style>
      <div class="fc-click" data-theme="${theme}">
        <div class="fc-click-title">${t.title}</div>
        <div class="fc-click-area">${boxes}</div>
        <div class="fc-click-msg"></div>
        <div class="fc-click-row">
          <button class="fc-click-refresh">${t.refresh}</button>
        </div>
      </div>
    `;
    const area = container.querySelector('.fc-click-area') as HTMLDivElement;
    const msg = container.querySelector('.fc-click-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-click-refresh') as HTMLButtonElement;
    refreshBtn.addEventListener('click', render);

    area.querySelectorAll('.fc-click-box').forEach(el => {
      el.addEventListener('click', async () => {
        if (finished) return;
        const box = el as HTMLElement;
        if (box.classList.contains('fc-click-box-done')) return; // 已点过
        const num = Number(box.dataset.num);
        const expected = current.order[clicked.length]!;
        if (num === expected) {
          // 点击正确：高亮并锁定
          clicked.push(num);
          box.classList.add('fc-click-box-done');
          if (clicked.length === current.order.length) {
            // 全部正确
            finished = true;
            const result: CaptchaResult = {
              success: true,
              proof: await hashProof(proofInput(current)),
              duration: Date.now() - startTime,
            };
            msg.textContent = t.success;
            config.onVerify?.(result);
            listeners.forEach(cb => cb(result));
          }
        } else {
          // 顺序错误：重置
          finished = true;
          box.classList.add('fc-click-box-active');
          msg.textContent = t.fail;
          setTimeout(render, 700);
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
