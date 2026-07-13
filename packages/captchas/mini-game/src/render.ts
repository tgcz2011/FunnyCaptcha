import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, proofInput, verifyScore, type MiniGameChallenge } from './challenge.js';

const STR = {
  zh: {
    title: '打地鼠',
    rule: '30 秒内打到 10 分即通过',
    score: '分数',
    time: '剩余',
    sec: '秒',
    success: '验证成功！你果然是人类',
    fail: '时间到，没达到目标分数',
  },
  en: {
    title: 'Whack-a-Mole',
    rule: 'Score 10 in 30s to pass',
    score: 'Score',
    time: 'Time',
    sec: 's',
    success: 'Verified! You are human.',
    fail: "Time's up, target not reached",
  },
};

// 3x3 共 9 个洞
const HOLE_COUNT = 9;

export function createMiniGameInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  let current: MiniGameChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  let startTime = Date.now();
  let score = 0;
  let ended = false;
  let activeHole = -1;
  let remainingMs = 0;
  // 三个定时器：倒计时、地鼠出现、单只地鼠自动消失
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let moleTimer: ReturnType<typeof setInterval> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTimers() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (moleTimer) { clearInterval(moleTimer); moleTimer = null; }
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }

  // 结束游戏：达到目标即成功，否则失败
  async function endGame(success: boolean) {
    if (ended) return;
    ended = true;
    clearTimers();
    const holes = container.querySelectorAll<HTMLElement>('.fc-mini-game-hole');
    holes.forEach(h => h.classList.remove('fc-mini-game-mole-active'));
    const msg = container.querySelector('.fc-mini-game-msg');
    if (success) {
      const result: CaptchaResult = {
        success: true,
        proof: await hashProof(proofInput(current)),
        duration: Date.now() - startTime,
        metadata: { score, targetScore: current.targetScore },
      };
      if (msg) msg.textContent = t.success;
      config.onVerify?.(result);
      listeners.forEach(cb => cb(result));
    } else {
      if (msg) msg.textContent = t.fail;
    }
  }

  // 随机在一个洞里弹出地鼠
  function showMole() {
    if (ended) return;
    const holes = container.querySelectorAll<HTMLElement>('.fc-mini-game-hole');
    holes.forEach(h => h.classList.remove('fc-mini-game-mole-active'));
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    const next = Math.floor(Math.random() * HOLE_COUNT);
    activeHole = next;
    const hole = holes[next];
    if (hole) hole.classList.add('fc-mini-game-mole-active');
    // 一段时间后地鼠自动缩回
    hideTimer = setTimeout(() => {
      if (ended) return;
      const cur = container.querySelectorAll<HTMLElement>('.fc-mini-game-hole')[next];
      if (cur) cur.classList.remove('fc-mini-game-mole-active');
      if (activeHole === next) activeHole = -1;
    }, 700);
  }

  function startGame() {
    clearTimers();
    score = 0;
    ended = false;
    activeHole = -1;
    remainingMs = current.timeLimit;
    startTime = Date.now();
    const scoreEl = container.querySelector('.fc-mini-game-score');
    const timeEl = container.querySelector('.fc-mini-game-time');
    const msg = container.querySelector('.fc-mini-game-msg');
    if (scoreEl) scoreEl.textContent = `0 / ${current.targetScore}`;
    if (timeEl) timeEl.textContent = `${Math.ceil(remainingMs / 1000)}${t.sec}`;
    if (msg) msg.textContent = '';
    // 倒计时：每 100ms 更新
    countdownTimer = setInterval(() => {
      if (ended) return;
      remainingMs -= 100;
      if (timeEl) timeEl.textContent = `${Math.max(0, Math.ceil(remainingMs / 1000))}${t.sec}`;
      if (remainingMs <= 0) {
        void endGame(verifyScore(current, score));
      }
    }, 100);
    // 地鼠出现：每 850ms 弹一只
    moleTimer = setInterval(showMole, 850);
    showMole();
  }

  function render() {
    current = generateChallenge();
    score = 0;
    ended = false;
    activeHole = -1;
    clearTimers();
    const holes = Array.from({ length: HOLE_COUNT }, (_, i) =>
      `<div class="fc-mini-game-hole" data-idx="${i}"><span class="fc-mini-game-mole">🐹</span></div>`,
    ).join('');
    container.innerHTML = `
      <style>
        .fc-mini-game{font-family:-apple-system,system-ui,sans-serif;width:340px;padding:16px;box-sizing:border-box}
        .fc-mini-game-title{font-size:15px;color:#333;margin-bottom:4px;text-align:center;font-weight:600}
        .fc-mini-game-rule{font-size:12px;color:#888;margin-bottom:10px;text-align:center}
        .fc-mini-game-hud{display:flex;justify-content:space-between;font-size:13px;color:#555;margin-bottom:10px}
        .fc-mini-game-hud b{color:#4a90d9}
        .fc-mini-game-board{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:8px;width:300px;height:300px;margin:0 auto;background:#e8f5e9;border:1px solid #c8e6c9;border-radius:10px;padding:8px;box-sizing:border-box}
        .fc-mini-game-hole{position:relative;background:radial-gradient(circle at 50% 60%,#6d4c41,#4e342e);border-radius:50%;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;cursor:pointer;user-select:none}
        .fc-mini-game-hole:hover{background:radial-gradient(circle at 50% 60%,#7d5c51,#5e443e)}
        .fc-mini-game-mole{font-size:34px;line-height:1;transform:translateY(120%);transition:transform .12s ease-out;pointer-events:none}
        .fc-mini-game-mole-active .fc-mini-game-mole{transform:translateY(0)}
        .fc-mini-game-msg{font-size:13px;min-height:18px;text-align:center;margin-top:12px;color:#2e7d32}
      </style>
      <div class="fc-mini-game">
        <div class="fc-mini-game-title">${t.title}</div>
        <div class="fc-mini-game-rule">${t.rule}</div>
        <div class="fc-mini-game-hud">
          <div>${t.score}: <b class="fc-mini-game-score">0 / ${current.targetScore}</b></div>
          <div>${t.time}: <b class="fc-mini-game-time">${current.timeLimit / 1000}${t.sec}</b></div>
        </div>
        <div class="fc-mini-game-board">${holes}</div>
        <div class="fc-mini-game-msg"></div>
      </div>
    `;

    container.querySelectorAll<HTMLElement>('.fc-mini-game-hole').forEach(el => {
      el.addEventListener('click', () => {
        if (ended) return;
        const idx = Number(el.dataset.idx);
        // 仅当点击的是当前有地鼠的洞时计分
        if (idx === activeHole && el.classList.contains('fc-mini-game-mole-active')) {
          score += 1;
          el.classList.remove('fc-mini-game-mole-active');
          activeHole = -1;
          if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
          const scoreEl = container.querySelector('.fc-mini-game-score');
          if (scoreEl) scoreEl.textContent = `${score} / ${current.targetScore}`;
          if (verifyScore(current, score)) {
            void endGame(true);
          }
        }
      });
    });

    startGame();
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => { clearTimers(); container.innerHTML = ''; listeners = []; },
    onResult: cb => listeners.push(cb),
  };
}
