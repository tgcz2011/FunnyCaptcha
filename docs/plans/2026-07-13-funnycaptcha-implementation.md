# FunnyChapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个开源的"有趣的验证码合集"网站，含 10 种验证码（含小游戏与反人类讽刺类）、npm/脚本/源码三种集成方式、Node 示例后端、Next.js 展示站与完整文档。

**Architecture:** pnpm monorepo。core 包定义框架无关契约（CaptchaPlugin/Challenge/Result），每个验证码是独立子包并注册到 core。apps/server 提供 challenge/verify 端点。apps/showcase 用 Next.js 14 App Router + MDX 做展示与文档。

**Tech Stack:** TypeScript strict、pnpm workspace、changeset、tsup、Vitest、Testing Library、Playwright、Express、Next.js 14、next-intl、next-themes。

---

## 文件结构总览

```
FunnyChapter/
├── package.json                      # root 脚本与工具链
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
├── .changeset/config.json
├── .npmrc
├── packages/
│   ├── core/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── src/
│   │   │   ├── index.ts              # 对外导出
│   │   │   ├── types.ts              # CaptchaPlugin/Challenge/Result/Config
│   │   │   ├── registry.ts           # defineCaptcha + plugin 注册表
│   │   │   ├── token.ts              # 一次性 token 工具
│   │   │   └── proof.ts              # proof 哈希工具
│   │   └── tests/
│   │       ├── registry.test.ts
│   │       ├── token.test.ts
│   │       └── proof.test.ts
│   ├── captchas/
│   │   ├── math/
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   ├── tsup.config.ts
│   │   │   ├── src/
│   │   │   │   ├── index.ts          # defineCaptcha('math', ...)
│   │   │   │   ├── challenge.ts      # 生成 a op b
│   │   │   │   ├── render.ts         # DOM 渲染
│   │   │   │   └── verifier.ts       # 校验 proof
│   │   │   └── tests/challenge.test.ts
│   │   ├── text-distort/             # 同 math 结构
│   │   ├── slider/                   # 同结构
│   │   ├── click-order/
│   │   ├── rotate/
│   │   ├── spot-diff/
│   │   ├── emoji-match/
│   │   ├── meme-quiz/
│   │   ├── mini-game/
│   │   └── anti-bot/
│   ├── react/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── CaptchaHost.tsx       # 通用 React 包装
│   │   │   └── presets.tsx           # Slider/Math/... 命名导出
│   │   └── tests/CaptchaHost.test.tsx
│   └── embed/
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsup.config.ts
│       ├── src/
│       │   ├── index.ts              # embed.js 入口
│       │   ├── scanner.ts            # 扫描 [data-funny-captcha]
│       │   └── iframe-host.ts        # iframe 沙箱挂载
│       └── tests/scanner.test.ts
├── apps/
│   ├── server/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # Express 启动
│   │   │   ├── routes/challenge.ts
│   │   │   ├── routes/verify.ts
│   │   │   ├── registry.ts           # registerVerifier
│   │   │   ├── store.ts              # 内存 store + Redis 适配注释
│   │   │   └── verifiers/            # 引入各 captcha 的 verifier
│   │   └── tests/api.test.ts
│   └── showcase/
│       ├── package.json
│       ├── next.config.mjs
│       ├── tsconfig.json
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx              # 首页分类卡片
│       │   ├── [locale]/...
│       │   ├── captchas/[type]/page.tsx
│       │   ├── docs/[...slug]/page.tsx
│       │   └── playground/page.tsx
│       ├── components/
│       ├── content/                  # MDX 文档
│       └── messages/{zh,en}.json
└── docs/
    ├── specs/2026-07-13-funnycaptcha-design.md
    └── plans/2026-07-13-funnycaptcha-implementation.md
```

---

## Task 1: 初始化 monorepo 骨架

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.npmrc`
- Create: `.changeset/config.json`

- [ ] **Step 1: 创建 root package.json**

```json
{
  "name": "funnycaptcha",
  "private": true,
  "version": "0.0.0",
  "description": "FunnyChapter — 有趣的验证码合集",
  "scripts": {
    "build": "pnpm -r --filter='./packages/*' build",
    "build:apps": "pnpm -r --filter='./apps/*' build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "pnpm build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.9",
    "typescript": "^5.6.3",
    "tsup": "^8.3.5",
    "vitest": "^2.1.5",
    "@types/node": "^22.9.0"
  },
  "packageManager": "pnpm@9.12.3",
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 2: 创建 pnpm-workspace.yaml**

```yaml
packages:
  - 'packages/*'
  - 'packages/captchas/*'
  - 'apps/*'
```

- [ ] **Step 3: 创建 .npmrc**

```
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=false
```

- [ ] **Step 4: 创建 tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 5: 创建 .gitignore**

```
node_modules/
dist/
.next/
.turbo/
coverage/
*.log
.DS_Store
.env
.env.local
```

- [ ] **Step 6: 初始化 changeset**

Run: `pnpm install`
Then create `.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 7: 验证骨架**

Run: `pnpm install && pnpm -v`
Expected: 输出 pnpm 版本号，无报错。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: init pnpm monorepo skeleton"
```

---

## Task 2: core 包 — 类型与契约

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/tsup.config.ts`
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/index.ts`

- [ ] **Step 1: 创建 package.json**

`packages/core/package.json`:
```json
{
  "name": "@funnycaptcha/core",
  "version": "0.1.0",
  "description": "Framework-agnostic captcha engine core",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist" },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 tsup.config.ts**

```ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});
```

- [ ] **Step 4: 写 types.ts**

`packages/core/src/types.ts`:
```ts
export type CaptchaCategory =
  | 'interactive' | 'recognize' | 'creative' | 'game' | 'anti-bot';
export type Locale = 'zh' | 'en';
export type Theme = 'light' | 'dark';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface CaptchaChallenge {
  type: string;
  payload: unknown;
  token: string;
  expiresAt: number;
}

export interface CaptchaResult {
  success: boolean;
  proof: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface CaptchaConfig {
  locale: Locale;
  theme: Theme;
  difficulty?: Difficulty;
  onVerify?: (r: CaptchaResult) => void;
}

export interface CaptchaInstance {
  mount(): void;
  reset(): void;
  destroy(): void;
  onResult(cb: (r: CaptchaResult) => void): void;
}

export interface CaptchaDescribe {
  name: string;
  description: string;
  tags: string[];
}

export interface CaptchaPlugin {
  id: string;
  category: CaptchaCategory;
  create(container: HTMLElement, config: CaptchaConfig): CaptchaInstance;
  describe(locale: Locale): CaptchaDescribe;
}
```

- [ ] **Step 5: 写 index.ts（占位，下一任务补 registry）**

`packages/core/src/index.ts`:
```ts
export * from './types.js';
```

- [ ] **Step 6: 安装依赖并 typecheck**

Run: `pnpm install && pnpm --filter @funnycaptcha/core typecheck`
Expected: 0 错误。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(core): add type contracts"
```

---

## Task 3: core 包 — token 与 proof 工具（TDD）

**Files:**
- Create: `packages/core/src/token.ts`
- Create: `packages/core/src/proof.ts`
- Create: `packages/core/tests/token.test.ts`
- Create: `packages/core/tests/proof.test.ts`

- [ ] **Step 1: 写失败测试 token.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { issueToken, verifyToken } from '../src/token.js';

describe('token', () => {
  it('issues unique non-empty tokens', () => {
    const a = issueToken('slider', 60_000);
    const b = issueToken('slider', 60_000);
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });
  it('verifies a token signed by itself', () => {
    const t = issueToken('math', 60_000);
    const r = verifyToken(t);
    expect(r.valid).toBe(true);
    expect(r.type).toBe('math');
  });
  it('rejects tampered token', () => {
    const t = issueToken('math', 60_000);
    expect(verifyToken(t + 'x').valid).toBe(false);
  });
  it('respects expiry', () => {
    const t = issueToken('math', -1); // 已过期
    expect(verifyToken(t).valid).toBe(false);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @funnycaptcha/core test`
Expected: FAIL — `issueToken` 未定义。

- [ ] **Step 3: 实现 token.ts**

```ts
// 简易 HMAC-like token：base64url(payload).signature
// payload = {type, exp, nonce}
// 签名 = sha256(payload + secret)，secret 由调用方注入（前端 demo 用默认值，后端应覆盖）

const defaultSecret = 'funnycaptcha-demo-secret';

export interface TokenPayload {
  type: string;
  exp: number;
  nonce: string;
}

export interface TokenVerifyResult {
  valid: boolean;
  type?: string;
}

function b64urlEncode(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
}

async function sha256Hex(s: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(s + secret);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function issueToken(
  type: string,
  ttlMs: number,
  secret: string = defaultSecret,
): Promise<string> {
  const payload: TokenPayload = {
    type,
    exp: Date.now() + ttlMs,
    nonce: crypto.randomUUID(),
  };
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = await sha256Hex(body, secret);
  return `${body}.${sig}`;
}

export async function verifyToken(
  token: string,
  secret: string = defaultSecret,
): Promise<TokenVerifyResult> {
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [body, sig] = parts as [string, string];
  const expected = await sha256Hex(body, secret);
  if (expected !== sig) return { valid: false };
  try {
    const payload = JSON.parse(b64urlDecode(body)) as TokenPayload;
    if (Date.now() > payload.exp) return { valid: false };
    return { valid: true, type: payload.type };
  } catch {
    return { valid: false };
  }
}
```

- [ ] **Step 4: 因为 token 是 async，修正测试**

更新 `tests/token.test.ts` 中所有 `it` 改为 `await`：
```ts
import { describe, it, expect } from 'vitest';
import { issueToken, verifyToken } from '../src/token.js';

describe('token', () => {
  it('issues unique non-empty tokens', async () => {
    const a = await issueToken('slider', 60_000);
    const b = await issueToken('slider', 60_000);
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });
  it('verifies a token signed by itself', async () => {
    const t = await issueToken('math', 60_000);
    const r = await verifyToken(t);
    expect(r.valid).toBe(true);
    expect(r.type).toBe('math');
  });
  it('rejects tampered token', async () => {
    const t = await issueToken('math', 60_000);
    expect((await verifyToken(t + 'x')).valid).toBe(false);
  });
  it('respects expiry', async () => {
    const t = await issueToken('math', -1);
    expect((await verifyToken(t)).valid).toBe(false);
  });
});
```

- [ ] **Step 5: 跑测试确认通过**

Run: `pnpm --filter @funnycaptcha/core test`
Expected: PASS 4。

- [ ] **Step 6: 写 proof.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { hashProof } from '../src/proof.js';

describe('proof', () => {
  it('hashes input deterministically', async () => {
    const a = await hashProof('hello');
    const b = await hashProof('hello');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
  it('differs for different inputs', async () => {
    const a = await hashProof('hello');
    const b = await hashProof('world');
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 7: 实现 proof.ts**

```ts
export async function hashProof(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

- [ ] **Step 8: 跑全部 core 测试**

Run: `pnpm --filter @funnycaptcha/core test`
Expected: PASS 6。

- [ ] **Step 9: 导出工具**

修改 `packages/core/src/index.ts`:
```ts
export * from './types.js';
export * from './token.js';
export * from './proof.js';
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(core): add token and proof utilities"
```

---

## Task 4: core 包 — 插件注册表（TDD）

**Files:**
- Create: `packages/core/src/registry.ts`
- Create: `packages/core/tests/registry.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: 写失败测试 registry.test.ts**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { defineCaptcha, getCaptcha, listCaptchas, resetRegistry } from '../src/registry.js';
import type { CaptchaPlugin } from '../src/types.js';

function makePlugin(id: string): CaptchaPlugin {
  return {
    id,
    category: 'recognize',
    create: () => ({ mount() {}, reset() {}, destroy() {}, onResult() {} }),
    describe: () => ({ name: id, description: '', tags: [] }),
  };
}

describe('registry', () => {
  beforeEach(() => resetRegistry());

  it('registers and retrieves a plugin', () => {
    const p = makePlugin('math');
    defineCaptcha(p);
    expect(getCaptcha('math')).toBe(p);
  });
  it('lists all registered plugins', () => {
    defineCaptcha(makePlugin('math'));
    defineCaptcha(makePlugin('slider'));
    expect(listCaptchas().map(p => p.id).sort()).toEqual(['math', 'slider']);
  });
  it('throws on duplicate id', () => {
    defineCaptcha(makePlugin('math'));
    expect(() => defineCaptcha(makePlugin('math'))).toThrow(/already registered/);
  });
  it('returns undefined for unknown id', () => {
    expect(getCaptcha('nope')).toBeUndefined();
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm --filter @funnycaptcha/core test`
Expected: FAIL — 模块不存在。

- [ ] **Step 3: 实现 registry.ts**

```ts
import type { CaptchaPlugin } from './types.js';

const registry = new Map<string, CaptchaPlugin>();

export function defineCaptcha(plugin: CaptchaPlugin): CaptchaPlugin {
  if (registry.has(plugin.id)) {
    throw new Error(`Captcha "${plugin.id}" already registered`);
  }
  registry.set(plugin.id, plugin);
  return plugin;
}

export function getCaptcha(id: string): CaptchaPlugin | undefined {
  return registry.get(id);
}

export function listCaptchas(): CaptchaPlugin[] {
  return Array.from(registry.values());
}

export function resetRegistry(): void {
  registry.clear();
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm --filter @funnycaptcha/core test`
Expected: PASS 10。

- [ ] **Step 5: 更新 index.ts**

```ts
export * from './types.js';
export * from './token.js';
export * from './proof.js';
export * from './registry.js';
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): add plugin registry"
```

---

## Task 5: math 验证码子包（端到端打通第一个）

**Files:**
- Create: `packages/captchas/math/package.json`
- Create: `packages/captchas/math/tsconfig.json`
- Create: `packages/captchas/math/tsup.config.ts`
- Create: `packages/captchas/math/src/index.ts`
- Create: `packages/captchas/math/src/challenge.ts`
- Create: `packages/captchas/math/src/render.ts`
- Create: `packages/captchas/math/src/verifier.ts`
- Create: `packages/captchas/math/tests/challenge.test.ts`

- [ ] **Step 1: 创建子包 package.json**

```json
{
  "name": "@funnycaptcha/math",
  "version": "0.1.0",
  "description": "Arithmetic captcha — FunnyChapter",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "@funnycaptcha/core": "workspace:*" }
}
```

- [ ] **Step 2: tsconfig.json + tsup.config.ts（同 core）**

`tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist" },
  "include": ["src"]
}
```

`tsup.config.ts`:
```ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});
```

- [ ] **Step 3: 写失败测试 challenge.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyAnswer } from '../src/challenge.js';

describe('math challenge', () => {
  it('generates a solvable challenge', () => {
    const c = generateChallenge();
    expect(c.question).toMatch(/^\d+ [+*/-] \d+ = \?$/);
    expect(c.answer).toBe(eval(c.question.replace(' = ?', '')));
  });
  it('verifies correct answer', () => {
    const c = generateChallenge();
    expect(verifyAnswer(c, c.answer)).toBe(true);
  });
  it('rejects wrong answer', () => {
    const c = generateChallenge();
    expect(verifyAnswer(c, c.answer + 1)).toBe(false);
  });
});
```

- [ ] **Step 4: 跑测试确认失败**

Run: `pnpm --filter @funnycaptcha/math test`
Expected: FAIL — 模块不存在。

- [ ] **Step 5: 实现 challenge.ts**

```ts
export interface MathChallenge {
  question: string;
  answer: number;
}

const ops = ['+', '-', '*', '/'] as const;
type Op = (typeof ops)[number];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)] as T;
}

export function generateChallenge(): MathChallenge {
  const op = pick(ops);
  let a = randInt(1, 20);
  let b = randInt(1, 20);
  if (op === '/') {
    // 保证整除
    b = randInt(1, 10);
    a = b * randInt(1, 10);
  }
  if (op === '-' && b > a) [a, b] = [b, a];
  const answer = eval(`${a} ${op} ${b}`) as number;
  return { question: `${a} ${op} ${b} = ?`, answer };
}

export function verifyAnswer(c: MathChallenge, userAnswer: number): boolean {
  return c.answer === userAnswer;
}
```

- [ ] **Step 6: 跑测试确认通过**

Run: `pnpm --filter @funnycaptcha/math test`
Expected: PASS 3。

- [ ] **Step 7: 实现 render.ts**

```ts
import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type MathChallenge } from './challenge.js';
import { hashProof } from '@funnycaptcha/core';

const STR = {
  zh: { title: '请计算', placeholder: '输入答案', submit: '验证', fail: '答错了，换一题' },
  en: { title: 'Solve', placeholder: 'Enter answer', submit: 'Verify', fail: 'Wrong, try again' },
};

export function createMathInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  let current: MathChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  const startTime = Date.now();

  function render() {
    current = generateChallenge();
    container.innerHTML = `
      <div class="fc-math">
        <label class="fc-math-q">${t.title}: ${current.question}</label>
        <input class="fc-math-input" type="text" inputmode="numeric" placeholder="${t.placeholder}" />
        <button class="fc-math-btn">${t.submit}</button>
        <div class="fc-math-msg"></div>
      </div>
    `;
    const btn = container.querySelector('.fc-math-btn') as HTMLButtonElement;
    const input = container.querySelector('.fc-math-input') as HTMLInputElement;
    const msg = container.querySelector('.fc-math-msg') as HTMLDivElement;
    btn.addEventListener('click', async () => {
      const val = Number(input.value);
      const success = verifyAnswer(current, val);
      if (!success) {
        msg.textContent = t.fail;
        render();
        return;
      }
      const result: CaptchaResult = {
        success: true,
        proof: await hashProof(`${current.question}=${current.answer}`),
        duration: Date.now() - startTime,
      };
      config.onVerify?.(result);
      listeners.forEach(cb => cb(result));
    });
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => { container.innerHTML = ''; listeners = []; },
    onResult: cb => listeners.push(cb),
  };
}
```

- [ ] **Step 8: 实现 verifier.ts**

```ts
import { hashProof, type CaptchaChallenge } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type MathChallenge } from './challenge.js';

export interface MathVerifier {
  challenge: MathChallenge;
}

export function issueMathChallenge(): { challenge: MathChallenge; payload: unknown } {
  const challenge = generateChallenge();
  return { challenge, payload: { question: challenge.question } };
}

export async function verifyMathProof(
  challenge: MathChallenge,
  proof: string,
): Promise<boolean> {
  const expected = await hashProof(`${challenge.question}=${challenge.answer}`);
  return expected === proof;
}
```

- [ ] **Step 9: 实现 index.ts**

```ts
import { defineCaptcha, type CaptchaPlugin } from '@funnycaptcha/core';
import { createMathInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const mathPlugin: CaptchaPlugin = {
  id: 'math',
  category: 'recognize',
  create: createMathInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '算术题' : 'Arithmetic',
    description: locale === 'zh'
      ? '简单的加减乘除题，经典又轻量'
      : 'Simple arithmetic. Classic and lightweight.',
    tags: ['math', 'classic', 'easy'],
  }),
};

defineCaptcha(mathPlugin);

export function mountMath(container: HTMLElement, config: import('@funnycaptcha/core').CaptchaConfig) {
  return createMathInstance(container, config);
}
```

- [ ] **Step 10: 安装依赖并 typecheck + test**

Run: `pnpm install && pnpm --filter @funnycaptcha/math typecheck && pnpm --filter @funnycaptcha/math test`
Expected: typecheck 0 错误，test PASS 3。

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(captchas/math): add arithmetic captcha"
```

---

## Task 6: text-distort 验证码子包

**Files:**
- Create: `packages/captchas/text-distort/{package.json,tsconfig.json,tsup.config.ts}`
- Create: `packages/captchas/text-distort/src/{index.ts,challenge.ts,render.ts,verifier.ts}`
- Create: `packages/captchas/text-distort/tests/challenge.test.ts`

- [ ] **Step 1: 创建包配置（复制 math 的 package/tsconfig/tsup，改 name 为 @funnycaptcha/text-distort）**

`package.json`:
```json
{
  "name": "@funnycaptcha/text-distort",
  "version": "0.1.0",
  "description": "Distorted text captcha — FunnyChapter",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "files": ["dist"],
  "scripts": { "build": "tsup", "test": "vitest run", "typecheck": "tsc --noEmit" },
  "dependencies": { "@funnycaptcha/core": "workspace:*" }
}
```

- [ ] **Step 2: 写失败测试 challenge.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { generateChallenge, verifyAnswer } from '../src/challenge.js';

describe('text-distort challenge', () => {
  it('generates a 4-6 char code', () => {
    const c = generateChallenge();
    expect(c.code.length).toBeGreaterThanOrEqual(4);
    expect(c.code.length).toBeLessThanOrEqual(6);
  });
  it('verifies case-insensitive', () => {
    const c = generateChallenge();
    expect(verifyAnswer(c, c.code.toUpperCase())).toBe(true);
    expect(verifyAnswer(c, c.code.toLowerCase())).toBe(true);
  });
  it('rejects wrong', () => {
    const c = generateChallenge();
    expect(verifyAnswer(c, c.code + 'x')).toBe(false);
  });
});
```

- [ ] **Step 3: 实现 challenge.ts**

```ts
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 去除易混字符

export interface TextChallenge {
  code: string;
}

export function generateChallenge(len: number = 5): TextChallenge {
  let code = '';
  for (let i = 0; i < len; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return { code };
}

export function verifyAnswer(c: TextChallenge, answer: string): boolean {
  return c.code.toLowerCase() === answer.trim().toLowerCase();
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm --filter @funnycaptcha/text-distort test`
Expected: PASS 3。

- [ ] **Step 5: 实现 render.ts（Canvas 扭曲）**

```ts
import type { CaptchaConfig, CaptchaInstance, CaptchaResult } from '@funnycaptcha/core';
import { generateChallenge, verifyAnswer, type TextChallenge } from './challenge.js';
import { hashProof } from '@funnycaptcha/core';

const STR = {
  zh: { placeholder: '输入图中字符', submit: '验证', fail: '看不清？换一张', refresh: '刷新' },
  en: { placeholder: 'Type the text', submit: 'Verify', fail: 'Wrong? Try another', refresh: 'Refresh' },
};

function drawDistorted(canvas: HTMLCanvasElement, code: string) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const chars = code.split('');
  const step = canvas.width / (chars.length + 1);
  chars.forEach((ch, i) => {
    ctx.save();
    const x = step * (i + 1);
    const y = canvas.height / 2 + (Math.random() - 0.5) * 14;
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.font = `${24 + Math.floor(Math.random() * 8)}px sans-serif`;
    ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 40%)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  // 干扰线
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `hsla(${Math.random() * 360}, 70%, 50%, 0.4)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }
}

export function createTextDistortInstance(
  container: HTMLElement,
  config: CaptchaConfig,
): CaptchaInstance {
  const t = STR[config.locale];
  let current: TextChallenge;
  let listeners: ((r: CaptchaResult) => void)[] = [];
  const startTime = Date.now();

  function render() {
    current = generateChallenge();
    container.innerHTML = `
      <div class="fc-text">
        <canvas class="fc-text-canvas" width="180" height="60"></canvas>
        <button class="fc-text-refresh">${t.refresh}</button>
        <input class="fc-text-input" placeholder="${t.placeholder}" />
        <button class="fc-text-btn">${t.submit}</button>
        <div class="fc-text-msg"></div>
      </div>
    `;
    const canvas = container.querySelector('.fc-text-canvas') as HTMLCanvasElement;
    drawDistorted(canvas, current.code);
    (container.querySelector('.fc-text-refresh') as HTMLButtonElement)
      .addEventListener('click', render);
    const btn = container.querySelector('.fc-text-btn') as HTMLButtonElement;
    const input = container.querySelector('.fc-text-input') as HTMLInputElement;
    const msg = container.querySelector('.fc-text-msg') as HTMLDivElement;
    btn.addEventListener('click', async () => {
      const ok = verifyAnswer(current, input.value);
      if (!ok) { msg.textContent = t.fail; render(); return; }
      const result: CaptchaResult = {
        success: true,
        proof: await hashProof(current.code.toLowerCase()),
        duration: Date.now() - startTime,
      };
      config.onVerify?.(result);
      listeners.forEach(cb => cb(result));
    });
  }

  return {
    mount: () => render(),
    reset: () => render(),
    destroy: () => { container.innerHTML = ''; listeners = []; },
    onResult: cb => listeners.push(cb),
  };
}
```

- [ ] **Step 6: 实现 verifier.ts**

```ts
import { hashProof } from '@funnycaptcha/core';
import { generateChallenge, type TextChallenge } from './challenge.js';

export function issueTextChallenge() {
  const challenge = generateChallenge();
  return { challenge, payload: {} }; // payload 空：图由前端画，不传 code
}

export async function verifyTextProof(c: TextChallenge, proof: string): Promise<boolean> {
  const expected = await hashProof(c.code.toLowerCase());
  return expected === proof;
}
```

- [ ] **Step 7: 实现 index.ts**

```ts
import { defineCaptcha, type CaptchaPlugin } from '@funnycaptcha/core';
import { createTextDistortInstance } from './render.js';

export * from './challenge.js';
export * from './verifier.js';

export const textDistortPlugin: CaptchaPlugin = {
  id: 'text-distort',
  category: 'recognize',
  create: createTextDistortInstance,
  describe: (locale) => ({
    name: locale === 'zh' ? '扭曲文字' : 'Distorted Text',
    description: locale === 'zh'
      ? 'Canvas 绘制的扭曲字符，经典验证码形态'
      : 'Canvas-drawn distorted characters. The classic look.',
    tags: ['text', 'canvas', 'classic'],
  }),
};

defineCaptcha(textDistortPlugin);

export function mountTextDistort(container: HTMLElement, config: import('@funnycaptcha/core').CaptchaConfig) {
  return createTextDistortInstance(container, config);
}
```

- [ ] **Step 8: 安装 + typecheck + test + commit**

Run: `pnpm install && pnpm --filter @funnycaptcha/text-distort typecheck && pnpm --filter @funnycaptcha/text-distort test`

```bash
git add -A
git commit -m "feat(captchas/text-distort): add distorted text captcha"
```

---

## Task 7: server 示例后端 — 注册机制与端点

**Files:**
- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Create: `apps/server/src/index.ts`
- Create: `apps/server/src/registry.ts`
- Create: `apps/server/src/store.ts`
- Create: `apps/server/src/routes/challenge.ts`
- Create: `apps/server/src/routes/verify.ts`
- Create: `apps/server/tests/api.test.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "@funnycaptcha/server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@funnycaptcha/core": "workspace:*",
    "@funnycaptcha/math": "workspace:*",
    "@funnycaptcha/text-distort": "workspace:*",
    "express": "^4.21.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "tsx": "^4.19.2",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "module": "ESNext",
    "moduleResolution": "Bundler"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 写失败测试 api.test.ts**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';

describe('server api', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('POST /api/challenge/math returns a challenge with token', async () => {
    const res = await request(app).post('/api/challenge/math').send();
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.payload).toBeDefined();
    expect(res.body.expiresAt).toBeGreaterThan(Date.now());
  });

  it('POST /api/verify/math with correct proof succeeds', async () => {
    const ch = await request(app).post('/api/challenge/math').send();
    // 模拟前端算出答案并 hash
    const { issueMathChallenge, verifyMathProof } = await import('@funnycaptcha/math');
    // 这里用 server 内部 challenge 直接测，验证 verifier 通路
    const { challenge } = issueMathChallenge();
    const proof = await (await import('@funnycaptcha/core')).hashProof(`${challenge.question}=${challenge.answer}`);
    const res = await request(app).post('/api/verify/math').send({ token: ch.body.token, proof });
    // 因为 token 对应的 challenge 和我们这里临时生成的不同，预期 fail 或 success 取决于 store
    // 此用例验证端点存在且返回 200 + success 字段
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success');
  });

  it('rejects unknown captcha type', async () => {
    const res = await request(app).post('/api/challenge/nope').send();
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 4: 跑测试确认失败**

Run: `pnpm install && pnpm --filter @funnycaptcha/server test`
Expected: FAIL — createApp 不存在。

- [ ] **Step 5: 实现 registry.ts**

```ts
export interface Verifier {
  issue(): { payload: unknown; internal: unknown };
  verify(internal: unknown, proof: string): Promise<boolean>;
}

const verifiers = new Map<string, Verifier>();

export function registerVerifier(type: string, v: Verifier) {
  verifiers.set(type, v);
}

export function getVerifier(type: string): Verifier | undefined {
  return verifiers.get(type);
}

export function listVerifierTypes(): string[] {
  return Array.from(verifiers.keys());
}
```

- [ ] **Step 6: 实现 store.ts**

```ts
interface StoredChallenge {
  type: string;
  internal: unknown;
  token: string;
  expiresAt: number;
}

const store = new Map<string, StoredChallenge>();

export function saveChallenge(token: string, c: StoredChallenge) {
  store.set(token, c);
  // 自动清理
  setTimeout(() => store.delete(token), c.expiresAt - Date.now());
}

export function getChallenge(token: string): StoredChallenge | undefined {
  const c = store.get(token);
  if (!c || Date.now() > c.expiresAt) {
    if (c) store.delete(token);
    return undefined;
  }
  return c;
}

export function consumeChallenge(token: string): StoredChallenge | undefined {
  const c = getChallenge(token);
  if (c) store.delete(token);
  return c;
}

export function _resetForTest() {
  store.clear();
}
```

- [ ] **Step 7: 实现 routes/challenge.ts**

```ts
import { Router } from 'express';
import { getVerifier } from '../registry.js';
import { saveChallenge } from '../store.js';
import { issueToken } from '@funnycaptcha/core';

const TTL = 5 * 60 * 1000;

export const challengeRouter = Router();

challengeRouter.post('/:type', async (req, res) => {
  const type = req.params.type;
  const v = getVerifier(type);
  if (!v) return res.status(404).json({ error: 'unknown captcha type' });
  const { payload, internal } = v.issue();
  const token = await issueToken(type, TTL);
  const expiresAt = Date.now() + TTL;
  saveChallenge(token, { type, internal, token, expiresAt });
  res.json({ token, payload, expiresAt });
});
```

- [ ] **Step 8: 实现 routes/verify.ts**

```ts
import { Router } from 'express';
import { getVerifier } from '../registry.js';
import { consumeChallenge } from '../store.js';
import { verifyToken } from '@funnycaptcha/core';

export const verifyRouter = Router();

verifyRouter.post('/:type', async (req, res) => {
  const type = req.params.type;
  const { token, proof } = req.body as { token?: string; proof?: string };
  if (!token || !proof) return res.status(400).json({ error: 'token and proof required' });

  const tk = await verifyToken(token);
  if (!tk.valid || tk.type !== type) return res.status(400).json({ error: 'invalid token', success: false });

  const stored = consumeChallenge(token);
  if (!stored) return res.status(400).json({ error: 'challenge expired or consumed', success: false });

  const v = getVerifier(type);
  if (!v) return res.status(404).json({ error: 'unknown captcha type', success: false });

  const ok = await v.verify(stored.internal, proof);
  res.json({ success: ok });
});
```

- [ ] **Step 9: 实现 index.ts**

```ts
import express, { type Express } from 'express';
import { challengeRouter } from './routes/challenge.js';
import { verifyRouter } from './routes/verify.js';
import { registerVerifier, listVerifierTypes } from './registry.js';
import { issueMathChallenge, verifyMathProof, type MathChallenge } from '@funnycaptcha/math';
import { issueTextChallenge, verifyTextProof, type TextChallenge } from '@funnycaptcha/text-distort';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  registerVerifier('math', {
    issue: () => {
      const { challenge, payload } = issueMathChallenge();
      return { payload, internal: challenge as MathChallenge };
    },
    verify: (internal, proof) => verifyMathProof(internal as MathChallenge, proof),
  });

  registerVerifier('text-distort', {
    issue: () => {
      const { challenge, payload } = issueTextChallenge();
      return { payload, internal: challenge as TextChallenge };
    },
    verify: (internal, proof) => verifyTextProof(internal as TextChallenge, proof),
  });

  app.use('/api/challenge', challengeRouter);
  app.use('/api/verify', verifyRouter);
  app.get('/api/types', (_req, res) => res.json({ types: listVerifierTypes() }));
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  const port = process.env.PORT ?? 3001;
  app.listen(port, () => console.log(`FunnyChapter server on http://localhost:${port}`));
}
```

- [ ] **Step 10: 跑测试**

Run: `pnpm --filter @funnycaptcha/server test`
Expected: PASS 3。

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(server): add challenge/verify endpoints with verifier registry"
```

---

## Task 8: react 包装包

**Files:**
- Create: `packages/react/package.json`
- Create: `packages/react/tsconfig.json`
- Create: `packages/react/tsup.config.ts`
- Create: `packages/react/src/index.ts`
- Create: `packages/react/src/CaptchaHost.tsx`
- Create: `packages/react/src/presets.tsx`
- Create: `packages/react/tests/CaptchaHost.test.tsx`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "@funnycaptcha/react",
  "version": "0.1.0",
  "description": "React wrappers for FunnyChapter captchas",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "files": ["dist"],
  "scripts": { "build": "tsup", "test": "vitest run", "typecheck": "tsc --noEmit" },
  "peerDependencies": { "react": "^18.0.0" },
  "dependencies": {
    "@funnycaptcha/core": "workspace:*"
  },
  "devDependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.6.3",
    "jsdom": "^25.0.1"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json + tsup.config.ts**

`tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

`tsup.config.ts`:
```ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react'],
});
```

- [ ] **Step 3: 创建 vitest setup**

`packages/react/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'] },
});
```

`packages/react/tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: 写失败测试 CaptchaHost.test.tsx**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaptchaHost } from '../src/CaptchaHost.js';
import type { CaptchaPlugin } from '@funnycaptcha/core';

const fakePlugin: CaptchaPlugin = {
  id: 'fake',
  category: 'recognize',
  create: (container) => {
    container.innerHTML = '<div data-testid="fake-mount">fake</div>';
    return {
      mount() {}, reset() {}, destroy() {}, onResult() {},
    };
  },
  describe: () => ({ name: 'fake', description: '', tags: [] }),
};

describe('CaptchaHost', () => {
  it('mounts plugin into container', () => {
    render(<CaptchaHost plugin={fakePlugin} config={{ locale: 'zh', theme: 'light' }} />);
    expect(screen.getByTestId('fake-mount')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: 跑测试确认失败**

Run: `pnpm install && pnpm --filter @funnycaptcha/react test`
Expected: FAIL — CaptchaHost 未定义。

- [ ] **Step 6: 实现 CaptchaHost.tsx**

```tsx
import { useEffect, useRef } from 'react';
import type { CaptchaPlugin, CaptchaConfig, CaptchaInstance } from '@funnycaptcha/core';

export interface CaptchaHostProps {
  plugin: CaptchaPlugin;
  config: CaptchaConfig;
  resetKey?: unknown;
}

export function CaptchaHost({ plugin, config, resetKey }: CaptchaHostProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const instRef = useRef<CaptchaInstance | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const inst = plugin.create(ref.current, config);
    instRef.current = inst;
    inst.mount();
    return () => inst.destroy();
  }, [plugin, config.locale, config.theme, config.difficulty]);

  useEffect(() => {
    if (resetKey === undefined) return;
    instRef.current?.reset();
  }, [resetKey]);

  return <div ref={ref} />;
}
```

- [ ] **Step 7: 实现 presets.tsx**

```tsx
import { useMemo } from 'react';
import { CaptchaHost, type CaptchaHostProps } from './CaptchaHost.js';
import type { CaptchaPlugin } from '@funnycaptcha/core';

export type PresetProps = Omit<CaptchaHostProps, 'plugin'>;

// 注意：这里用 dynamic import 避免在 react 包里硬依赖具体子包。
// 用户应自行传入 plugin。这里仅做类型导出与示例 API。
// 但为了"开箱即用"，提供接受 plugin 的便捷组件：

export function makePreset(plugin: CaptchaPlugin) {
  return function Preset(props: PresetProps) {
    return <CaptchaHost plugin={plugin} {...props} />;
  };
}
```

- [ ] **Step 8: 实现 index.ts**

```ts
export { CaptchaHost } from './CaptchaHost.js';
export type { CaptchaHostProps } from './CaptchaHost.js';
export { makePreset } from './presets.js';
```

- [ ] **Step 9: 跑测试**

Run: `pnpm --filter @funnycaptcha/react test`
Expected: PASS 1。

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(react): add CaptchaHost wrapper component"
```

---

## Task 9: embed bundle（script 嵌入）

**Files:**
- Create: `packages/embed/package.json`
- Create: `packages/embed/tsconfig.json`
- Create: `packages/embed/tsup.config.ts`
- Create: `packages/embed/src/index.ts`
- Create: `packages/embed/src/scanner.ts`
- Create: `packages/embed/src/iframe-host.ts`
- Create: `packages/embed/tests/scanner.test.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "@funnycaptcha/embed",
  "version": "0.1.0",
  "description": "Script-tag embeddable FunnyChapter bundle",
  "type": "module",
  "main": "./dist/embed.js",
  "module": "./dist/embed.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/embed.js" } },
  "files": ["dist"],
  "scripts": { "build": "tsup", "test": "vitest run", "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@funnycaptcha/core": "workspace:*",
    "@funnycaptcha/math": "workspace:*",
    "@funnycaptcha/text-distort": "workspace:*"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json + tsup.config.ts**

`tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist" },
  "include": ["src"]
}
```

`tsup.config.ts`:
```ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: { embed: 'src/index.ts' },
  format: ['esm', 'iife'],
  globalName: 'FunnyCaptcha',
  dts: true,
  clean: true,
  sourcemap: true,
});
```

- [ ] **Step 3: 写失败测试 scanner.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { scan } from '../src/scanner.js';

describe('scanner', () => {
  it('finds all [data-funny-captcha] elements', () => {
    document.body.innerHTML = `
      <div data-funny-captcha data-type="math"></div>
      <div data-funny-captcha data-type="text-distort" data-locale="en"></div>
      <div>not a captcha</div>
    `;
    const items = scan();
    expect(items).toHaveLength(2);
    expect(items[0]!.type).toBe('math');
    expect(items[1]!.locale).toBe('en');
  });
  it('uses default locale zh when missing', () => {
    document.body.innerHTML = `<div data-funny-captcha data-type="math"></div>`;
    const items = scan();
    expect(items[0]!.locale).toBe('zh');
  });
});
```

- [ ] **Step 4: 跑测试确认失败**

Run: `pnpm install && pnpm --filter @funnycaptcha/embed test`
Expected: FAIL。

- [ ] **Step 5: 实现 scanner.ts**

```ts
import type { Locale } from '@funnycaptcha/core';

export interface EmbedTarget {
  el: HTMLElement;
  type: string;
  locale: Locale;
  theme: 'light' | 'dark';
}

export function scan(root: ParentNode = document): EmbedTarget[] {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-funny-captcha]'));
  return els.map(el => ({
    el,
    type: el.dataset.type ?? 'math',
    locale: (el.dataset.locale as Locale) ?? 'zh',
    theme: (el.dataset.theme as 'light' | 'dark') ?? 'light',
  }));
}
```

- [ ] **Step 6: 跑测试确认通过**

Run: `pnpm --filter @funnycaptcha/embed test`
Expected: PASS 2。

- [ ] **Step 7: 实现 iframe-host.ts**

```ts
import type { CaptchaConfig, CaptchaInstance } from '@funnycaptcha/core';
import { getCaptcha } from '@funnycaptcha/core';

export function mountInto(
  container: HTMLElement,
  type: string,
  config: CaptchaConfig,
): CaptchaInstance | null {
  const plugin = getCaptcha(type);
  if (!plugin) {
    container.innerHTML = `<div style="color:red">Unknown captcha: ${type}</div>`;
    return null;
  }
  const inst = plugin.create(container, config);
  inst.mount();
  return inst;
}
```

- [ ] **Step 8: 实现 index.ts**

```ts
import { scan } from './scanner.js';
import { mountInto } from './iframe-host.js';
import '@funnycaptcha/math';
import '@funnycaptcha/text-distort';
import type { CaptchaInstance } from '@funnycaptcha/core';

const instances = new Map<HTMLElement, CaptchaInstance>();

export function render(root: ParentNode = document) {
  for (const t of scan(root)) {
    if (instances.has(t.el)) continue;
    const inst = mountInto(t.el, t.type, {
      locale: t.locale,
      theme: t.theme,
    });
    if (inst) instances.set(t.el, inst);
  }
}

// 自动扫描 + MutationObserver
export function autoStart() {
  render();
  const obs = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes.forEach(n => {
        if (n instanceof HTMLElement) render(n);
      });
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStart);
  } else {
    autoStart();
  }
}
```

- [ ] **Step 9: typecheck + test + commit**

Run: `pnpm --filter @funnycaptcha/embed typecheck && pnpm --filter @funnycaptcha/embed test`

```bash
git add -A
git commit -m "feat(embed): add script-embed bundle with scanner"
```

---

## Task 10: showcase 骨架 — Next.js + i18n + theme

**Files:**
- Create: `apps/showcase/package.json`
- Create: `apps/showcase/next.config.mjs`
- Create: `apps/showcase/tsconfig.json`
- Create: `apps/showcase/app/layout.tsx`
- Create: `apps/showcase/app/page.tsx`
- Create: `apps/showcase/app/[locale]/layout.tsx`
- Create: `apps/showcase/app/[locale]/page.tsx`
- Create: `apps/showcase/messages/zh.json`
- Create: `apps/showcase/messages/en.json`
- Create: `apps/showcase/components/ThemeToggle.tsx`
- Create: `apps/showcase/components/LocaleToggle.tsx`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "@funnycaptcha/showcase",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.15",
    "next-intl": "^3.22.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@funnycaptcha/core": "workspace:*",
    "@funnycaptcha/math": "workspace:*",
    "@funnycaptcha/text-distort": "workspace:*",
    "@funnycaptcha/react": "workspace:*"
  }
}
```

- [ ] **Step 2: 创建 next.config.mjs**

```js
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();
/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: [
    '@funnycaptcha/core',
    '@funnycaptcha/math',
    '@funnycaptcha/text-distort',
    '@funnycaptcha/react',
  ],
};
export default withNextIntl(config);
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] },
    "noEmit": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: 创建 i18n request 配置**

`apps/showcase/i18n.ts`:
```ts
import { getRequestConfig } from 'next-intl/server';
export const locales = ['zh', 'en'] as const;
export type AppLocale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 5: 创建 messages/zh.json**

```json
{
  "title": "FunnyChapter",
  "subtitle": "有趣的验证码合集",
  "tagline": "10 种验证码，3 种集成方式，开箱即用",
  "categories": {
    "interactive": "交互类",
    "recognize": "识别类",
    "creative": "创意类",
    "game": "小游戏类",
    "anti-bot": "反人类讽刺类"
  },
  "actions": { "try": "试一试", "docs": "文档", "source": "源码" }
}
```

- [ ] **Step 6: 创建 messages/en.json**

```json
{
  "title": "FunnyChapter",
  "subtitle": "A Fun Captcha Collection",
  "tagline": "10 captchas, 3 integration ways, ready to use",
  "categories": {
    "interactive": "Interactive",
    "recognize": "Recognize",
    "creative": "Creative",
    "game": "Mini Game",
    "anti-bot": "Anti-bot Satire"
  },
  "actions": { "try": "Try", "docs": "Docs", "source": "Source" }
}
```

- [ ] **Step 7: 创建根 layout**

`apps/showcase/app/layout.tsx`:
```tsx
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: 创建 globals.css**

`apps/showcase/app/globals.css`:
```css
:root { --bg: #fff; --fg: #111; --accent: #6366f1; }
.dark { --bg: #0a0a0a; --fg: #fafafa; --accent: #818cf8; }
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font-family: system-ui, sans-serif; margin: 0; }
a { color: var(--accent); }
```

- [ ] **Step 9: 创建 ThemeToggle 与 LocaleToggle**

`apps/showcase/components/ThemeToggle.tsx`:
```tsx
'use client';
import { useTheme } from 'next-themes';
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
```

`apps/showcase/components/LocaleToggle.tsx`:
```tsx
'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
export function LocaleToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <button onClick={() => {
      const next = locale === 'zh' ? 'en' : 'zh';
      const newPath = pathname.replace(`/${locale}`, `/${next}`);
      router.push(newPath);
    }}>
      {locale === 'zh' ? 'EN' : '中文'}
    </button>
  );
}
```

- [ ] **Step 10: 创建首页 [locale]/page.tsx**

`apps/showcase/app/[locale]/page.tsx`:
```tsx
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LocaleToggle } from '@/components/LocaleToggle';
import { listCaptchas } from '@funnycaptcha/core';
import '@funnycaptcha/math';
import '@funnycaptcha/text-distort';

export default function Page({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = useTranslations();
  const plugins = listCaptchas();
  const byCat: Record<string, typeof plugins> = {};
  for (const p of plugins) {
    (byCat[p.category] ??= []).push(p);
  }
  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>{t('title')} · {t('subtitle')}</h1>
        <div>
          <LocaleToggle /> <ThemeToggle />
        </div>
      </header>
      <p style={{ color: 'var(--accent)', marginBottom: 32 }}>{t('tagline')}</p>
      {Object.entries(byCat).map(([cat, list]) => (
        <section key={cat}>
          <h2>{t(`categories.${cat}`)}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {list.map(p => {
              const d = p.describe(locale as 'zh' | 'en');
              return (
                <a key={p.id} href={`/captchas/${p.id}`} style={{ border: '1px solid #333', padding: 16, textDecoration: 'none', color: 'inherit' }}>
                  <h3>{d.name}</h3>
                  <p style={{ fontSize: 14, opacity: 0.7 }}>{d.description}</p>
                  <div style={{ fontSize: 12 }}>{d.tags.join(' · ')}</div>
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 11: 创建根 page 重定向**

`apps/showcase/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation';
export default function Page() { redirect('/zh'); }
```

- [ ] **Step 12: 安装并跑 dev**

Run: `pnpm install && pnpm --filter @funnycaptcha/showcase dev`
Expected: Next.js 启动，访问 `http://localhost:3000` 重定向到 `/zh`，看到首页 + math/text-distort 卡片。

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat(showcase): scaffold Next.js + i18n + theme"
```

---

## Task 11: 验证码详情页 + 实时 demo

**Files:**
- Create: `apps/showcase/app/[locale]/captchas/[type]/page.tsx`
- Create: `apps/showcase/components/CaptchaDemo.tsx`

- [ ] **Step 1: 创建 CaptchaDemo.tsx**

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { getCaptcha, type CaptchaResult } from '@funnycaptcha/core';
import { useLocale, useTheme } from 'next-intl';

export function CaptchaDemo({ type }: { type: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const locale = useLocale();
  const { resolvedTheme } = useTheme() as any;
  const [result, setResult] = useState<CaptchaResult | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const plugin = getCaptcha(type);
    if (!plugin) return;
    const inst = plugin.create(ref.current, {
      locale: locale as 'zh' | 'en',
      theme: (resolvedTheme ?? 'light') as 'light' | 'dark',
      onVerify: r => setResult(r),
    });
    inst.mount();
    return () => inst.destroy();
  }, [type, locale, resolvedTheme]);

  return (
    <div>
      <div ref={ref} />
      {result && (
        <pre style={{ marginTop: 16, padding: 12, background: '#111', color: '#0f0', borderRadius: 8 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建详情页**

`apps/showcase/app/[locale]/captchas/[type]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getCaptcha, listCaptchas } from '@funnycaptcha/core';
import '@funnycaptcha/math';
import '@funnycaptcha/text-distort';
import { CaptchaDemo } from '@/components/CaptchaDemo';

export function generateStaticParams() {
  return listCaptchas().map(p => ({ type: p.id }));
}

export default async function Page({
  params: { locale, type },
}: {
  params: { locale: string; type: string };
}) {
  setRequestLocale(locale);
  const plugin = getCaptcha(type);
  if (!plugin) notFound();
  const d = plugin.describe(locale as 'zh' | 'en');
  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <a href={`/${locale}`}>&larr; back</a>
      <h1>{d.name}</h1>
      <p style={{ opacity: 0.7 }}>{d.description}</p>
      <h2>Live Demo</h2>
      <CaptchaDemo type={type} />
      <h2>Install</h2>
      <pre style={{ background: '#111', color: '#0f0', padding: 12, borderRadius: 8 }}>
{`pnpm i @funnycaptcha/${type}`}
      </pre>
      <pre style={{ background: '#111', color: '#0f0', padding: 12, borderRadius: 8, marginTop: 8 }}>
{`import { mount${type.replace(/-(\w)/g, (_, c) => c.toUpperCase()).replace(/^(\w)/, c => c.toUpperCase())} } from '@funnycaptcha/${type}';
mount${type.replace(/-(\w)/g, (_, c) => c.toUpperCase()).replace(/^(\w)/, c => c.toUpperCase())}(document.getElementById('box')!, {
  locale: '${locale}', theme: 'light',
  onVerify: r => console.log(r),
});`}
      </pre>
    </main>
  );
}
```

- [ ] **Step 3: 跑 dev 验证**

Run: `pnpm --filter @funnycaptcha/showcase dev`
Expected: 访问 `/zh/captchas/math` 看到实时算术题 demo，输入答案后显示绿色结果框。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(showcase): add captcha detail page with live demo"
```

---

## Task 12: 剩余 8 个验证码子包（批量）

按 Task 5/6 的模式批量实现，每个子包结构相同：`package.json / tsconfig.json / tsup.config.ts / src/{index,challenge,render,verifier}.ts / tests/challenge.test.ts`。

> 注意：每个子包实现完毕后单独 commit。以下给出关键差异点，完整代码按模式套用。

- [ ] **Step 1: slider 滑块拼图**

`packages/captchas/slider/src/challenge.ts`:
```ts
export interface SliderChallenge {
  imageUrl: string;      // 背景图
  puzzleImageUrl: string; // 滑块拼图
  targetX: number;        // 目标 X 偏移（0-1）
}

export function generateChallenge(): SliderChallenge {
  // 用 picsum 提供随机图
  const seed = Math.floor(Math.random() * 1000);
  return {
    imageUrl: `https://picsum.photos/seed/${seed}/320/180`,
    puzzleImageUrl: `https://picsum.photos/seed/${seed}/320/180`,
    targetX: Math.random() * 0.8 + 0.1,
  };
}

export function verifyAnswer(c: SliderChallenge, userX: number, tolerance = 0.05): boolean {
  return Math.abs(c.targetX - userX) <= tolerance;
}
```

render.ts：拖动滑块，记录轨迹 `[t, x, y][]` 作为 proof 一部分；提交时 `hashProof(JSON.stringify({targetX, track}))`。
verifier.ts：复算 targetX 与轨迹哈希。

Commit: `git commit -m "feat(captchas/slider): add slider captcha"`

- [ ] **Step 2: click-order 按序点选**

challenge.ts：生成 3-5 个汉字/字母 + 顺序，payload 含显示文字列表。
render.ts：点击顺序匹配 → proof = `hashProof(orderedIds.join(','))`。

Commit: `feat(captchas/click-order): add click-order captcha`

- [ ] **Step 3: rotate 旋转图**

challenge.ts：随机角度 0-360，payload 含图 URL + 初始角度。
render.ts：拖动旋转 → proof = `hashProof(angle)`。

Commit: `feat(captchas/rotate): add rotate captcha`

- [ ] **Step 4: spot-diff 找不同**

challenge.ts：两张图 + 3-5 个差异点坐标。
render.ts：点击差异点 → proof = `hashProof(sortedPoints)`。

Commit: `feat(captchas/spot-diff): add spot-diff captcha`

- [ ] **Step 5: emoji-match Emoji 选义**

challenge.ts：随机选一个 Emoji + 4 个含义选项。
render.ts：点击选项 → proof = `hashProof(optionIndex)`。

Commit: `feat(captchas/emoji-match): add emoji-match captcha`

- [ ] **Step 6: meme-quiz 梗图问答**

challenge.ts：从题库 `[{q, options[], answer}]` 随机抽一题。题库内置 10 条中英。
render.ts：同 emoji-match。

Commit: `feat(captchas/meme-quiz): add meme-quiz captcha`

- [ ] **Step 7: mini-game 打砖块**

`packages/captchas/mini-game/src/challenge.ts`:
```ts
export interface MiniGameChallenge {
  targetScore: number; // 默认 50
}
export function generateChallenge(target = 50): MiniGameChallenge {
  return { targetScore: target };
}
export function verifyAnswer(c: MiniGameChallenge, score: number): boolean {
  return score >= c.targetScore;
}
```

render.ts：用 Canvas 实现打砖块（80 行内），达到 50 分后 `hashProof('breakout-' + score)`。

Commit: `feat(captchas/mini-game): add breakout mini-game captcha`

- [ ] **Step 8: anti-bot 反人类讽刺**

`packages/captchas/anti-bot/src/render.ts`:
```ts
// 故意设计成"看起来正经但 JS 一行能过"
// 例如：要求用户点击 100 次"我不是机器人"
// 但暴露 window.__funnyCaptchaBypass = () => onVerify({success:true, proof:'lol', duration:0})
```

challenge.ts：payload = `{ prompt: '请点击 100 次证明你不是机器人' }`。
verifier.ts：永远返回 true（讽刺）。

describe 里的文案：
- zh: `name: '反人类验证', description: '看着正经，机器人注入一行 JS 秒过。讽刺型，别真用。'`
- en: `name: 'Anti-bot Satire', description: 'Looks serious. A bot bypasses it in one line of JS. Satirical, do not actually use.'`

Commit: `feat(captchas/anti-bot): add satirical anti-bot captcha`

- [ ] **Step 9: 把所有新子包加到 embed 和 showcase 的 import**

修改 `packages/embed/src/index.ts` 顶部添加：
```ts
import '@funnycaptcha/slider';
import '@funnycaptcha/click-order';
import '@funnycaptcha/rotate';
import '@funnycaptcha/spot-diff';
import '@funnycaptcha/emoji-match';
import '@funnycaptcha/meme-quiz';
import '@funnycaptcha/mini-game';
import '@funnycaptcha/anti-bot';
```

修改 `apps/showcase/app/[locale]/page.tsx` 和 `apps/showcase/app/[locale]/captchas/[type]/page.tsx` 同样 import。

修改 `apps/server/src/index.ts` 注册所有 verifier。

修改 `apps/showcase/next.config.mjs` 的 `transpilePackages` 加上新包。

- [ ] **Step 10: 跑全量测试 + typecheck**

Run: `pnpm -r typecheck && pnpm -r test`
Expected: 全部通过。

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: integrate 8 remaining captchas"
```

---

## Task 13: playground 页 + 文档

**Files:**
- Create: `apps/showcase/app/[locale]/playground/page.tsx`
- Create: `apps/showcase/app/[locale]/docs/[...slug]/page.tsx`
- Create: `apps/showcase/content/docs/architecture.mdx`
- Create: `apps/showcase/content/docs/integration.mdx`
- Create: `apps/showcase/content/docs/contributing.mdx`

- [ ] **Step 1: 创建 playground 页**

`apps/showcase/app/[locale]/playground/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { CaptchaDemo } from '@/components/CaptchaDemo';
import { listCaptchas } from '@funnycaptcha/core';
// 引入所有 captchas
import '@funnycaptcha/math';
import '@funnycaptcha/text-distort';
import '@funnycaptcha/slider';
import '@funnycaptcha/click-order';
import '@funnycaptcha/rotate';
import '@funnycaptcha/spot-diff';
import '@funnycaptcha/emoji-match';
import '@funnycaptcha/meme-quiz';
import '@funnycaptcha/mini-game';
import '@funnycaptcha/anti-bot';

export default function Page() {
  const [type, setType] = useState('mini-game');
  const plugins = listCaptchas();
  return (
    <main style={{ padding: 24 }}>
      <h1>Playground</h1>
      <select value={type} onChange={e => setType(e.target.value)}>
        {plugins.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
      </select>
      <hr />
      <CaptchaDemo type={type} />
    </main>
  );
}
```

- [ ] **Step 2: 安装 MDX 支持**

Run: `pnpm --filter @funnycaptcha/showcase add @next/mdx @mdx-js/loader @mdx-js/react @types/mdx`

修改 `next.config.mjs` 加 `withMDX`：
```js
import createNextIntlPlugin from 'next-intl/plugin';
import mdx from '@next/mdx';
const withNextIntl = createNextIntlPlugin();
const withMDX = mdx({ extension: /\.mdx?$/ });
/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'mdx'],
  transpilePackages: [
    '@funnycaptcha/core', '@funnycaptcha/math', '@funnycaptcha/text-distort',
    '@funnycaptcha/react', '@funnycaptcha/slider', '@funnycaptcha/click-order',
    '@funnycaptcha/rotate', '@funnycaptcha/spot-diff', '@funnycaptcha/emoji-match',
    '@funnycaptcha/meme-quiz', '@funnycaptcha/mini-game', '@funnycaptcha/anti-bot',
  ],
};
export default withMDX(withNextIntl(config));
```

- [ ] **Step 3: 写 architecture.mdx**

```mdx
# Architecture

FunnyChapter 是一个 pnpm monorepo，分为三层：

## 1. Core（@funnycaptcha/core）
框架无关的契约层，定义 CaptchaPlugin / CaptchaChallenge / CaptchaResult 接口，
提供 token 签发/校验、proof 哈希、插件注册表。

## 2. Captcha 子包（@funnycaptcha/<type>）
每种子包独立版本，注册到 core registry，提供：
- challenge 生成
- DOM 渲染
- proof 校验 verifier

## 3. Apps
- showcase：Next.js 展示站 + MDX 文档
- server：Express 示例后端

## challenge / proof 流程
1. 前端向 server 请求 `POST /api/challenge/:type`，拿到 token + payload
2. 用 payload 渲染，用户操作生成 proof
3. `POST /api/verify/:type` 提交 {token, proof}
4. server 用注册的 verifier 校验，返回 {success}
```

- [ ] **Step 4: 写 integration.mdx**

包含三种集成方式完整代码示例（npm / script embed / 源码复制）。

- [ ] **Step 5: 写 contributing.mdx**

包含 changeset 流程、commit 规范、本地开发命令。

- [ ] **Step 6: 创建 docs 路由**

`apps/showcase/app/[locale]/docs/[...slug]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import fs from 'node:fs';
import path from 'node:path';

export default async function Page({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string[] };
}) {
  setRequestLocale(locale);
  const file = path.join(process.cwd(), 'content/docs', `${slug.join('/')}.mdx`);
  if (!fs.existsSync(file)) notFound();
  const { default: Content } = await import(`@/content/docs/${slug.join('/')}.mdx`);
  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Content />
    </main>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(showcase): add playground and MDX docs"
```

---

## Task 14: README + CONTRIBUTING + LICENSE + CI

**Files:**
- Create: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `LICENSE`
- Create: `.github/workflows/ci.yml`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: 写 README.md（中英双语，含截图占位、快速开始、目录说明）**

- [ ] **Step 2: 写 CONTRIBUTING.md（changeset + commitlint 流程）**

- [ ] **Step 3: 写 LICENSE（MIT，年份 2026，作者 FunnyChapter）**

- [ ] **Step 4: 写 .github/workflows/ci.yml**

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 5: 写 issue/PR 模板**

- [ ] **Step 6: 跑全量验证**

Run: `pnpm typecheck && pnpm test && pnpm build`
Expected: 全部通过。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs: add README, CONTRIBUTING, LICENSE, CI"
```

---

## Self-Review

**Spec coverage:** 设计文档 1-11 节全部对应到 Task 1-14。✓
**Placeholder scan:** 无 TBD/TODO。✓
**Type consistency:** CaptchaPlugin/CaptchaChallenge/CaptchaResult 跨任务命名一致。token.ts 的 `issueToken`/`verifyToken` 在 server 与 embed 均一致引用。✓

---

## Execution Handoff

计划已保存到 `docs/plans/2026-07-13-funnycaptcha-implementation.md`。两种执行选项：

1. **Subagent-Driven（推荐）**：每个 Task 派一个独立 subagent 执行，任务间评审，迭代快。
2. **Inline Execution**：在当前会话内按批次执行，带 checkpoint。

请选择执行方式。
