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
        .fc-anti-bot{font-family:-apple-system,system-ui,sans-serif;width:320px;padding:20px;box-sizing:border-box;border:1px solid #e0e0e0;border-radius:10px;background:#fafafa}
        .fc-anti-bot-title{font-size:18px;color:#333;text-align:center;font-weight:600;margin-bottom:6px}
        .fc-anti-bot-subtitle{font-size:12px;color:#888;text-align:center;margin-bottom:16px}
        .fc-anti-bot-btn{display:block;width:100%;padding:12px;font-size:15px;border:1px solid #ccc;background:#fff;border-radius:6px;cursor:pointer;color:#333;transition:background .15s}
        .fc-anti-bot-btn:hover:not(:disabled){background:#f0f7ff}
        .fc-anti-bot-btn:disabled{cursor:default;color:#2e7d32;border-color:#2e7d32;background:#e8f5e9}
        .fc-anti-bot-msg{font-size:13px;min-height:18px;text-align:center;margin-top:12px;color:#2e7d32}
        .fc-anti-bot-hint{font-size:11px;color:#bbb;margin-top:14px;text-align:center;line-height:1.5;font-style:italic}
        .fc-anti-bot-footer{font-size:10px;color:#ccc;margin-top:8px;text-align:center}
      </style>
      <div class="fc-anti-bot">
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
