import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, verifyOrder, type ClickOrderChallenge } from './challenge.js';

const STR = {
  zh: { title: '按 1 → 2 → 3 → 4 顺序点击', success: '验证成功', fail: '顺序错误，请重试' },
  en: { title: 'Click in order 1 → 2 → 3 → 4', success: 'Verified', fail: 'Wrong order, try again' },
};

// 4 个不重叠的预设槽位（2x2 网格），280x180 区域内
const SLOTS = [
  { x: 20, y: 20 },
  { x: 160, y: 20 },
  { x: 20, y: 100 },
  { x: 160, y: 100 },
];

export function createClickOrderInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
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
    const boxes = current.targets.map((num, i) => {
      const slot = SLOTS[i]!;
      return `<div class="fc-click-box" data-num="${num}" style="left:${slot.x}px;top:${slot.y}px;">${num}</div>`;
    }).join('');
    container.innerHTML = `
      <style>
        .fc-click{font-family:-apple-system,system-ui,sans-serif;width:320px;padding:16px;box-sizing:border-box}
        .fc-click-title{font-size:14px;color:#333;margin-bottom:12px;text-align:center}
        .fc-click-area{position:relative;width:280px;height:180px;background:#f5f5f5;border-radius:8px;border:1px solid #e0e0e0;overflow:hidden}
        .fc-click-box{position:absolute;width:100px;height:60px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:#4a90d9;background:#fff;border:2px solid #4a90d9;border-radius:8px;cursor:pointer;user-select:none;transition:transform .15s,background .15s,color .15s}
        .fc-click-box:hover{transform:scale(1.05)}
        .fc-click-box-active{background:#4a90d9;color:#fff}
        .fc-click-box-done{background:#2e7d32;border-color:#2e7d32;color:#fff;cursor:default}
        .fc-click-box-done:hover{transform:none}
        .fc-click-msg{font-size:13px;min-height:18px;text-align:center;margin-top:10px;color:#2e7d32}
      </style>
      <div class="fc-click">
        <div class="fc-click-title">${t.title}</div>
        <div class="fc-click-area">${boxes}</div>
        <div class="fc-click-msg"></div>
      </div>
    `;
    const area = container.querySelector('.fc-click-area') as HTMLDivElement;
    const msg = container.querySelector('.fc-click-msg') as HTMLDivElement;

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
