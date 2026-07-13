# FunnyChapter

> 有趣的验证码合集 — 10 种验证码，3 种集成方式，开箱即用

[![CI](https://github.com/funnycaptcha/funnycaptcha/actions/workflows/ci.yml/badge.svg)](https://github.com/funnycaptcha/funnycaptcha/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

FunnyChapter 是一个开源的验证码合集项目，覆盖五大类别：交互类、识别类、创意类、小游戏类和反人类讽刺类。支持 npm 包、脚本嵌入和源码复制三种集成方式。

## 验证码目录

| 类型 | 包名 | 类别 | 说明 |
|---|---|---|---|
| 算术题 | `@funnycaptcha/math` | recognize | 加减乘除计算 |
| 扭曲文字 | `@funnycaptcha/text-distort` | recognize | Canvas 扭曲字符 |
| 滑动拼图 | `@funnycaptcha/slider` | interactive | 拖动滑块到终点 |
| 点选顺序 | `@funnycaptcha/click-order` | interactive | 按顺序点击目标 |
| 旋转对齐 | `@funnycaptcha/rotate` | interactive | 旋转图形回正 |
| 找不同 | `@funnycaptcha/spot-diff` | creative | 找出两图差异 |
| 表情匹配 | `@funnycaptcha/emoji-match` | creative | 选出匹配的 emoji |
| 梗图问答 | `@funnycaptcha/meme-quiz` | creative | 中文梗图选择题 |
| 迷你游戏 | `@funnycaptcha/mini-game` | game | 30 秒打地鼠 |
| 反人类讽刺 | `@funnycaptcha/anti-bot` | anti-bot | 故意留后门的讽刺验证码 |

## 快速开始

### 安装

```bash
pnpm add @funnycaptcha/core @funnycaptcha/react @funnycaptcha/math
```

### React 使用

```tsx
import { CaptchaHost } from '@funnycaptcha/react';
import { mathPlugin } from '@funnycaptcha/math';

function MyForm() {
  return (
    <CaptchaHost
      plugin={mathPlugin}
      config={{ locale: 'zh', theme: 'light', onVerify: (r) => console.log(r.proof) }}
    />
  );
}
```

### 脚本嵌入

```html
<script src="https://cdn.jsdelivr.net/npm/@funnycaptcha/embed/dist/index.iife.js"></script>
<div data-funny-captcha="math" data-locale="zh"></div>
<script>FunnyCaptcha.autoStart();</script>
```

### 本地开发

```bash
git clone https://github.com/funnycaptcha/funnycaptcha.git
cd funnycaptcha
pnpm install
pnpm --filter @funnycaptcha/core build
pnpm --filter @funnycaptcha/showcase dev
```

打开 http://localhost:3000

## 集成方式

支持三种集成方式，详见 [集成指南](./docs/integration.md)：

1. **npm 包** — 适用于 React 项目，`CaptchaHost` 组件
2. **脚本嵌入** — 适用于任意网站，IIFE 全局 `FunnyCaptcha`
3. **源码复制** — 直接复制 `src/` 目录

## 架构

详见 [架构文档](./docs/architecture.md)。

核心设计：
- **框架无关 core 包** — 只依赖标准 DOM API
- **Challenge/Proof 分离** — 前端渲染，后端校验
- **插件注册表** — 前端 plugin 与服务端 verifier 对称注册

## 技术栈

- TypeScript 5.3+（strict 模式）
- pnpm workspace monorepo
- Next.js 14（展示站）
- Express（示例后端）
- Vitest（测试）
- changeset（版本管理）

## 贡献

欢迎贡献！请阅读 [贡献指南](./CONTRIBUTING.md)。

## 许可证

[MIT](./LICENSE)
