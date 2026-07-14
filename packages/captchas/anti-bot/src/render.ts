import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, type AntiBotChallenge } from './challenge.js';

// 挂在 window 上的后门函数名
const BYPASS_FN = '__funnyCaptchaPass';
// 把 globalThis 当作可任意赋值的字典（浏览器里 globalThis === window）
const win = globalThis as unknown as Record<string, unknown>;

const STR = {
  zh: {
    title: '证明你是人类',
    subtitle: '为了确认你不是机器人，请点击下方按钮',
    btn: '我不是机器人',
    verifying: '正在验证您的人类身份……',
    success: '验证通过。您肯定是人类，我们绝对不会错。',
    botHint: '温馨提示：机器人可直接调用 window.__funnyCaptchaPass() 通过本验证（认真的）',
    footer: '本验证码采用企业级安全策略，请放心。',
  },
  en: {
    title: "Prove you're a human",
    subtitle: "To confirm you're not a robot, click the button below",
    btn: "I'm not a robot",
    verifying: 'Verifying your humanity…',
    success: 'Verified. You are definitely human. We never make mistakes.',
    botHint: "Friendly tip: bots can just call window.__funnyCaptchaPass() to pass (seriously)",
    footer: 'This captcha uses enterprise-grade security. Trust us.',
  },
};

export function createAntiBotInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  const theme = config.theme ?? 'light';
  let current: AntiBotChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let finished = false;
  let verifyTimer: ReturnType<typeof setTimeout> | null = null;

  // 触发"通过"——正常点按钮或机器人调用后门都会走到这里
  async function pass() {
    if (finished) return;
    finished = true;
    if (verifyTimer) { clearTimeout(verifyTimer); verifyTimer = null; }
    const msg = container.querySelector('.fc-anti-bot-msg');
    const btn = container.querySelector('.fc-anti-bot-btn') as HTMLButtonElement | null;
    if (msg) msg.textContent = t.success;
    if (btn) { btn.disabled = true; btn.textContent = t.success; }
    const result: CaptchaResult = {
      success: true,
      proof: await hashProof(proofInput(current)),
      duration: Date.now() - startTime,
    };
    config.onVerify?.(result);
    listeners.forEach(cb => cb(result));
  }

  function render() {
    current = generateChallenge();
    finished = false;
    startTime = Date.now();
    if (verifyTimer) { clearTimeout(verifyTimer); verifyTimer = null; }
    container.innerHTML = `
      <style>
        .fc-anti-bot{font-family:-apple-system,system-ui,sans-serif;max-width:360px;width:100%;padding:20px;box-sizing:border-box;border:1px solid var(--fc-border);border-radius:10px;background:var(--fc-surface)}
        .fc-anti-bot[data-theme="light"]{--fc-bg:#ffffff;--fc-surface:#f6f7f9;--fc-text:#0f172a;--fc-text-soft:#64748b;--fc-border:#e2e8f0;--fc-accent:#6366f1;--fc-accent-soft:#eef2ff;--fc-success:#16a34a;--fc-danger:#dc2626}
        .fc-anti-bot[data-theme="dark"]{--fc-bg:#1e2544;--fc-surface:#171c36;--fc-text:#e5e9f0;--fc-text-soft:#94a3b8;--fc-border:#2a3358;--fc-accent:#818cf8;--fc-accent-soft:#252b5c;--fc-success:#4ade80;--fc-danger:#f87171}
        .fc-anti-bot{color:var(--fc-text)}
        .fc-anti-bot-title{font-size:18px;color:var(--fc-text);text-align:center;font-weight:600;margin-bottom:6px}
        .fc-anti-bot-subtitle{font-size:12px;color:var(--fc-text-soft);text-align:center;margin-bottom:16px}
        .fc-anti-bot-btn{display:block;width:100%;padding:12px;font-size:15px;border:1px solid var(--fc-border);background:var(--fc-bg);border-radius:6px;cursor:pointer;color:var(--fc-text);transition:background .15s,border-color .15s}
        .fc-anti-bot-btn:hover:not(:disabled){background:var(--fc-accent-soft);border-color:var(--fc-accent)}
        .fc-anti-bot-btn:disabled{cursor:default;color:var(--fc-success);border-color:var(--fc-success);background:var(--fc-accent-soft)}
        .fc-anti-bot-msg{font-size:13px;min-height:18px;text-align:center;margin-top:12px;color:var(--fc-success)}
        .fc-anti-bot-hint{font-size:11px;color:var(--fc-text-soft);margin-top:14px;text-align:center;line-height:1.5;font-style:italic}
        .fc-anti-bot-footer{font-size:10px;color:var(--fc-text-soft);margin-top:8px;text-align:center;opacity:.7}
      </style>
      <div class="fc-anti-bot" data-theme="${theme}">
        <div class="fc-anti-bot-title">${t.title}</div>
        <div class="fc-anti-bot-subtitle">${t.subtitle}</div>
        <button class="fc-anti-bot-btn">${t.btn}</button>
        <div class="fc-anti-bot-msg"></div>
        <div class="fc-anti-bot-hint">${t.botHint}</div>
        <div class="fc-anti-bot-footer">${t.footer}</div>
      </div>
    `;
    const btn = container.querySelector('.fc-anti-bot-btn') as HTMLButtonElement;
    const msg = container.querySelector('.fc-anti-bot-msg') as HTMLDivElement;

    // 正常路径：点按钮 → "正在验证" → 一段延迟后通过
    btn.addEventListener('click', () => {
      if (finished) return;
      btn.disabled = true;
      msg.textContent = t.verifying;
      verifyTimer = setTimeout(() => { void pass(); }, 900);
    });

    // 讽刺后门：在 window 上挂载全局函数，机器人注入一行 JS 即可通过
    win[BYPASS_FN] = () => { void pass(); };
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => {
      if (verifyTimer) { clearTimeout(verifyTimer); verifyTimer = null; }
      // 拆除后门
      delete win[BYPASS_FN];
      container.innerHTML = '';
      listeners = [];
    },
    onResult: cb => listeners.push(cb),
  };
}
