# FunnyChapter 架构文档

## 项目结构

```
funnycaptcha/
├── packages/
│   ├── core/              # 核心类型与工具（框架无关）
│   ├── react/             # React 绑定（CaptchaHost 组件）
│   ├── embed/             # 脚本嵌入方案（IIFE + 自动扫描）
│   └── captchas/          # 10 个验证码子包
│       ├── math/          # 算术题（recognize）
│       ├── text-distort/  # 扭曲文字（recognize）
│       ├── slider/        # 滑动拼图（interactive）
│       ├── click-order/   # 点选顺序（interactive）
│       ├── rotate/        # 旋转对齐（interactive）
│       ├── spot-diff/     # 找不同（creative）
│       ├── emoji-match/   # 表情匹配（creative）
│       ├── meme-quiz/     # 梗图问答（creative）
│       ├── mini-game/     # 迷你游戏（game）
│       └── anti-bot/      # 反人类讽刺（anti-bot）
├── apps/
│   ├── server/            # Node.js 示例后端（Express）
│   └── showcase/          # Next.js 展示站
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .changeset/
```

## 核心设计

### 1. 框架无关的 core 包

`@funnycaptcha/core` 只依赖标准 DOM API 和 Web Crypto API，不耦合任何框架：

- **类型契约**：`CaptchaPlugin`、`CaptchaInstance`、`CaptchaConfig`、`CaptchaResult`
- **注册表**：`defineCaptcha(plugin)` / `getCaptcha(id)` / `listCaptchas()`
- **Proof 哈希**：`hashProof(input)` 使用 SHA-256（`crypto.subtle.digest`）
- **Token**：`issueToken(payload, secret)` / `verifyToken(token, secret)`，HMAC-like 模式

### 2. Challenge / Proof 分离模式

前端渲染 challenge，用户操作生成 proof，后端校验 proof：

```
[前端]                    [后端]
  │  请求 challenge         │
  │ ──────────────────────> │
  │  challenge (含 token)    │
  │ <────────────────────── │
  │                         │
  │  用户交互 → 生成 proof   │
  │                         │
  │  提交 proof              │
  │ ──────────────────────> │
  │  验证结果                │
  │ <────────────────────── │
```

每个验证码子包包含：
- `challenge.ts` — 题目生成（纯逻辑）
- `render.ts` — DOM 渲染 + 交互
- `verifier.ts` — 服务端校验（`issueXxxChallenge` + `verifyXxxProof`）

### 3. 插件注册表

前端插件与服务端 verifier 对称注册：

**前端**：
```ts
import { defineCaptcha } from '@funnycaptcha/core';
import { mathPlugin } from '@funnycaptcha/math';
defineCaptcha(mathPlugin); // 自动注册
```

**后端**：
```ts
import { registerVerifier } from '@funnycaptcha/server';
import { issueMathChallenge, verifyMathProof } from '@funnycaptcha/math';
registerVerifier('math', { issue: issueMathChallenge, verify: verifyMathProof });
```

## 三种集成方式

### 方式一：npm 包（React）

```tsx
import { CaptchaHost } from '@funnycaptcha/react';
import { mathPlugin } from '@funnycaptcha/math';

<CaptchaHost plugin={mathPlugin} config={{ locale: 'zh', theme: 'light' }} />
```

### 方式二：脚本嵌入（无框架）

```html
<script src="https://cdn.jsdelivr.net/npm/@funnycaptcha/embed/dist/index.iife.js"></script>
<div data-funny-captcha="math" data-locale="zh" data-theme="light"></div>
<script>FunnyCaptcha.autoStart({ endpoint: 'https://your-server.com' });</script>
```

`@funnycaptcha/embed` 内部用 MutationObserver 自动扫描 `[data-funny-captcha]` 属性。

### 方式三：源码复制

直接复制 `packages/captchas/<name>/src/` 到你的项目，依赖 `@funnycaptcha/core`。

## 技术栈

| 层 | 技术 |
|---|---|
| 语言 | TypeScript 5.3+（strict, noUncheckedIndexedAccess） |
| 构建 | tsup（ESM + DTS） |
| Monorepo | pnpm workspace |
| 展示站 | Next.js 14 App Router |
| i18n | next-intl（zh/en） |
| 主题 | next-themes（light/dark） |
| 后端 | Express + 内存存储 |
| 测试 | Vitest |
| 版本管理 | changeset |
