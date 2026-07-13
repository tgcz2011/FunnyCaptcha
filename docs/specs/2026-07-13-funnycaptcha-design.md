# FunnyChapter — 有趣的验证码合集网站 设计文档

- 日期：2026-07-13
- 状态：已批准，进入实施
- 方案：A（pnpm monorepo + Next.js 展示站）

## 1. 目标

构建一个开源的"有趣的验证码合集"网站，收录 10 种验证码（含小游戏类与反人类讽刺类），提供 npm 包、脚本嵌入、源码复制三种集成方式，附带 Node.js 示例后端，让用户能把任意验证码集成到自己的网站里。

### 范围与非范围

- 范围：展示站、核心引擎、10 种验证码子包、React 包装、embed bundle、示例后端、完整文档
- 非范围：不提供 SaaS 托管、不实现真实风控后端、不维护大规模题库

## 2. 技术栈

| 层 | 选型 |
|---|---|
| 语言 | TypeScript（strict） |
| Monorepo | pnpm workspace + changeset（动态版本） |
| 核心引擎 | vanilla TS，仅依赖标准 DOM API |
| React 包装 | React 18 |
| 展示站 | Next.js 14 App Router + MDX + next-intl + next-themes |
| 示例后端 | Express + TS |
| 测试 | Vitest（单元）+ Testing Library（组件）+ Playwright（E2E/iframe）+ supertest（API） |
| 构建 | tsup（子包）、Next.js（展示站）、tsc（后端） |
| CI | GitHub Actions（lint → typecheck → test → build → deploy） |

## 3. 项目结构

```
FunnyChapter/
├── pnpm-workspace.yaml
├── package.json              # root: 脚本、lint、commit 规范
├── tsconfig.base.json
├── .changeset/
├── packages/
│   ├── core/                 # 框架无关验证码引擎
│   ├── captchas/
│   │   ├── slider/           # 滑块拼图
│   │   ├── click-order/      # 按序点选
│   │   ├── rotate/           # 旋转图片
│   │   ├── math/             # 算术题
│   │   ├── text-distort/     # 扭曲文字
│   │   ├── emoji-match/      # Emoji 选含义
│   │   ├── meme-quiz/        # 梗图问答
│   │   ├── spot-diff/        # 找不同
│   │   ├── mini-game/        # 小游戏类（打砖块达到 50 分通关）
│   │   └── anti-bot/         # 反人类讽刺类（JS 注入秒过 + 讽刺文案）
│   ├── react/                # @funnycaptcha/react
│   └── embed/                # iframe bundle（script 嵌入）
├── apps/
│   ├── showcase/             # Next.js 展示站 + MDX 文档
│   └── server/               # Express 示例后端
└── docs/                     # 架构、集成指南、贡献指南
```

## 4. 核心契约

`packages/core/src/types.ts` 定义框架无关接口：

```ts
export type CaptchaCategory =
  | 'interactive' | 'recognize' | 'creative' | 'game' | 'anti-bot';
export type Locale = 'zh' | 'en';
export type Theme = 'light' | 'dark';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface CaptchaChallenge {
  type: string;
  payload: unknown;          // 渲染数据（图片 URL、题面等）
  token: string;             // 一次性挑战 token（服务端签发）
  expiresAt: number;
}

export interface CaptchaResult {
  success: boolean;
  proof: string;             // 行为证明（轨迹、答案哈希等）
  duration: number;          // 完成耗时（风控用）
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

export interface CaptchaPlugin {
  id: string;
  category: CaptchaCategory;
  create(container: HTMLElement, config: CaptchaConfig): CaptchaInstance;
  describe(locale: Locale): { name: string; description: string; tags: string[] };
}
```

### 关键设计

- core 不依赖 React/DOM 框架，只依赖标准 DOM API
- 每个子包 `import { defineCaptcha } from '@funnycaptcha/core'` 注册
- challenge/proof 分离：前端拿 challenge 渲染，用户操作生成 proof，发回后端校验
- anti-bot 的 proof 设计成"看起来正经但 JS 一行就能过"，讽刺文案写在 describe

## 5. 验证码清单（10 种 / 5 类）

| 类别 | 验证码 | 集成难度 | 反机器人强度 | 备注 |
|---|---|---|---|---|
| interactive | slider 滑块拼图 | 中 | 中 | 拖动到缺口，记录轨迹 |
| interactive | click-order 按序点选 | 中 | 中 | 按文字顺序点击 |
| interactive | rotate 旋转图 | 中 | 中 | 旋转到正向 |
| interactive | spot-diff 找不同 | 中 | 中 | 点击两图差异处 |
| recognize | math 算术题 | 低 | 低 | `3 + 5 = ?` |
| recognize | text-distort 扭曲文字 | 低 | 低 | 经典验证码 |
| creative | emoji-match Emoji 选义 | 中 | 中 | 选出 Emoji 的含义 |
| creative | meme-quiz 梗图问答 | 中 | 中 | 网络梗题库 |
| game | mini-game 小游戏 | 高 | 高 | 打砖块达到 50 分通关 |
| anti-bot | anti-bot 反人类讽刺 | 低 | 0（故意） | JS 注入秒过 + 讽刺文案 |

每种子包独立版本，可单独 `pnpm i @funnycaptcha/slider` 安装。

## 6. 三种集成方式

### A. npm 包（生产推荐）

```ts
import { mountSlider } from '@funnycaptcha/slider';
mountSlider(document.getElementById('box')!, {
  locale: 'zh', theme: 'dark',
  onVerify: r => console.log(r),
});
```

React 用户：
```tsx
import { Slider } from '@funnycaptcha/react';
<Slider locale="zh" theme="dark" onVerify={r => ...} />
```

### B. 脚本嵌入（hCaptcha 风格）

```html
<script src="https://cdn.funnycaptcha.dev/embed.js"></script>
<div data-funny-captcha data-type="slider" data-locale="zh"></div>
```

embed 包自动扫描带 `data-funny-captcha` 属性的元素，按 `data-type` 挂载到 iframe 沙箱，与宿主页面 CSS 隔离。

### C. 源码复制（学习/魔改）

展示站每个验证码详情页提供"复制源码"按钮，下载该子包完整 TS 源码 + 单文件 README。

## 7. 后端示例（apps/server）

Express + TS，提供：

- `POST /api/challenge/:type` — 签发 challenge（token、过期时间）
- `POST /api/verify/:type` — 校验 proof（每种类型注册一个 verifier）
- 内存存储 + 可换 Redis（示例配置）

verifier 注册机制与前端 plugin 对称：

```ts
server.registerVerifier('slider', {
  verify: (challenge, proof) => boolean | Promise<boolean>,
});
```

## 8. 展示站（apps/showcase）

Next.js 14 App Router + MDX：

- `/` 首页：分类卡片网格，悬浮预览，明暗 + 中英切换
- `/captchas/[type]` 详情页：实时 demo + 代码片段 + 源码下载 + 集成说明
- `/docs/[...]` MDX 文档站（架构、集成指南、贡献指南）
- `/playground` 全屏试玩页（mini-game、anti-bot 在此展示）
- 主题：`next-themes`；i18n：`next-intl`

## 9. 测试策略

| 包 | 工具 | 覆盖 |
|---|---|---|
| core | Vitest | 接口、token、proof 工具 |
| captchas/* | Vitest | proof 生成/校验、边界 |
| react | Vitest + Testing Library | 组件挂载、props |
| embed | Playwright | iframe 挂载、跨域 |
| server | supertest | challenge/verify 端到端 |
| showcase | Playwright | 关键页面冒烟 |

CI：GitHub Actions（lint → typecheck → test → build → 部署 showcase 到 Vercel）。

## 10. 开源规范

- README（中英双语）：截图、快速开始、目录说明、集成指南链接
- CONTRIBUTING.md：commitlint + changeset 流程
- LICENSE：MIT
- 动态版本：changeset 自动 bump（不重复 0.1.0）
- CI 强制 lint/typecheck/test 通过才能合并
- issue/PR 模板

## 11. 实施顺序

1. 初始化 monorepo 骨架（pnpm workspace、tsconfig、lint、changeset）
2. 实现 core 包（types、defineCaptcha、token/proof 工具、单元测试）
3. 实现 2 个最简验证码（math、text-distort）跑通端到端
4. 实现 server 示例后端 + verifier 注册机制
5. 实现 react 包装 + embed bundle
6. 搭建 showcase 骨架（Next.js + i18n + theme）
7. 实现剩余 8 个验证码子包
8. 完善 MDX 文档、README、CONTRIBUTING
9. 配置 CI、部署
