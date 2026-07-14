import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, verifyOrder, type ClickTextChallenge } from './challenge.js';

const STR = {
  zh: { title: '请按顺序点击（位置会变）', success: '验证成功', fail: '顺序错误，请重试', refresh: '刷新' },
  en: { title: 'Click in order (positions shift)', success: 'Verified', fail: 'Wrong order, try again', refresh: 'Refresh' },
};

// 区域尺寸（与 challenge.ts 保持一致）
const AREA_W = 320;
const AREA_H = 200;
const BOX_W = 44;
const BOX_H = 44;
// 重新分布时任意两槽位最小间距
const MIN_DIST = 80;

// 在 AREA_W×AREA_H 区域内随机生成 count 个不重叠槽位（拒绝采样）
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

export function createClickTextInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  let current: ClickTextChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let clicked: string[] = [];
  let doneSet = new Set<number>();
  let finished = false;

  function render() {
    current = generateChallenge();
    clicked = [];
    doneSet = new Set<number>();
    finished = false;
    startTime = Date.now();
    const prompt = current.chars.join('、');
    const chars = current.chars.map((ch, i) => {
      const p = current.positions[i]!;
      return `<div class="fc-click-text-char" data-idx="${i}" data-ch="${ch}" style="left:${p.x}px;top:${p.y}px;">${ch}</div>`;
    }).join('');
    container.innerHTML = `
      <style>
        .fc-click-text{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:16px;box-sizing:border-box}
        .fc-click-text[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-click-text[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-click-text-title{font-size:14px;color:var(--fc-text);margin-bottom:4px;text-align:center}
        .fc-click-text-prompt{font-size:15px;color:var(--fc-accent);margin-bottom:12px;text-align:center;font-weight:600}
        .fc-click-text-area{position:relative;width:320px;height:200px;background:var(--fc-surface);border-radius:8px;border:1px solid var(--fc-border);overflow:hidden}
        .fc-click-text-char{position:absolute;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:600;color:var(--fc-text);background:var(--fc-bg);border:2px solid var(--fc-border);border-radius:8px;cursor:pointer;user-select:none;transition:left .4s cubic-bezier(.4,0,.2,1),top .4s cubic-bezier(.4,0,.2,1),transform .15s,background .15s,color .15s,border-color .15s}
        .fc-click-text-char:hover{transform:scale(1.08);border-color:var(--fc-accent)}
        .fc-click-text-char-done{background:var(--fc-success);border-color:var(--fc-success);color:#fff;cursor:default}
        .fc-click-text-char-done:hover{transform:none}
        .fc-click-text-char-wrong{background:var(--fc-danger);border-color:var(--fc-danger);color:#fff}
        .fc-click-text-msg{font-size:13px;min-height:18px;text-align:center;margin-top:10px;color:var(--fc-success)}
        .fc-click-text-msg-fail{color:var(--fc-danger)}
        .fc-click-text-refresh{padding:4px 12px;font-size:12px;border:1px solid var(--fc-border);background:var(--fc-surface);color:var(--fc-text-soft);border-radius:6px;cursor:pointer;margin-top:8px;display:block;margin-left:auto;margin-right:auto}
        .fc-click-text-refresh:hover{border-color:var(--fc-accent);color:var(--fc-accent)}
      </style>
      <div class="fc-click-text" data-theme="${config.theme}">
        <div class="fc-click-text-title">${t.title}</div>
        <div class="fc-click-text-prompt">${prompt}</div>
        <div class="fc-click-text-area">${chars}</div>
        <div class="fc-click-text-msg"></div>
        <button class="fc-click-text-refresh">${t.refresh}</button>
      </div>
    `;
    const area = container.querySelector('.fc-click-text-area') as HTMLDivElement;
    const msg = container.querySelector('.fc-click-text-msg') as HTMLDivElement;
    const refreshBtn = container.querySelector('.fc-click-text-refresh') as HTMLButtonElement;
    refreshBtn.addEventListener('click', () => render());

    function relocateChars(excludeIndex: number) {
      const remaining = current.chars.map((_, i) => i).filter(i => i !== excludeIndex && !doneSet.has(i));
      if (remaining.length === 0) return;
      const newSlots = generateSlots(remaining.length);
      remaining.forEach((idx, j) => {
        const box = area.querySelector(`[data-idx="${idx}"]`) as HTMLElement;
        const slot = newSlots[j]!;
        box.style.left = `${Math.round(slot.x)}px`;
        box.style.top = `${Math.round(slot.y)}px`;
      });
    }

    container.querySelectorAll('.fc-click-text-char').forEach(el => {
      el.addEventListener('click', async () => {
        if (finished) return;
        const box = el as HTMLElement;
        if (box.classList.contains('fc-click-text-char-done')) return;
        const ch = box.dataset.ch!;
        const expected = current.chars[clicked.length]!;
        if (ch === expected) {
          const idx = Number(box.dataset.idx);
          clicked.push(ch);
          doneSet.add(idx);
          box.classList.add('fc-click-text-char-done');
          if (clicked.length === current.chars.length) {
            finished = true;
            const result: CaptchaResult = {
              success: true,
              proof: await hashProof(proofInput(current)),
              duration: Date.now() - startTime,
            };
            msg.textContent = t.success;
            config.onVerify?.(result);
            listeners.forEach(cb => cb(result));
          } else {
            relocateChars(idx);
          }
        } else {
          finished = true;
          box.classList.add('fc-click-text-char-wrong');
          msg.classList.add('fc-click-text-msg-fail');
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
