# 贡献指南

感谢你对 FunnyChapter 的兴趣！本文档描述如何参与开发。

## 开发环境

- Node.js >= 20
- pnpm >= 9
- Git

## 本地启动

```bash
git clone https://github.com/funnycaptcha/funnycaptcha.git
cd funnycaptcha
pnpm install
```

### 构建

验证码包有依赖顺序：core → captchas → react/embed → server/showcase。

```bash
# 构建所有包
pnpm -r build

# 或按顺序构建
pnpm --filter @funnycaptcha/core build
pnpm --filter "./packages/captchas/*" build
pnpm --filter @funnycaptcha/react build
pnpm --filter @funnycaptcha/embed build
```

### 开发

```bash
# 启动展示站（含热更新）
pnpm --filter @funnycaptcha/showcase dev

# 启动后端
pnpm --filter @funnycaptcha/server dev
```

### 测试

```bash
# 运行所有测试
pnpm -r test

# 运行单个包的测试
pnpm --filter @funnycaptcha/math test

# 类型检查
pnpm -r typecheck
```

## 添加新验证码

1. 在 `packages/captchas/` 下创建新目录
2. 创建以下文件：
   - `src/challenge.ts` — 题目生成（纯逻辑）
   - `src/render.ts` — DOM 渲染（返回 `CaptchaInstance`）
   - `src/verifier.ts` — 服务端校验（`issueXxxChallenge` + `verifyXxxProof`）
   - `src/index.ts` — plugin 定义 + `defineCaptcha`
   - `tests/challenge.test.ts` — 至少 3 个测试
   - `package.json`、`tsconfig.json`、`tsup.config.ts`
3. 在 `apps/showcase/lib/catalog.ts` 添加条目
4. 在 `apps/showcase/components/CaptchaDemo.tsx` 注册 plugin
5. 在 `apps/showcase/package.json` 和 `next.config.mjs` 添加依赖
6. 运行测试和类型检查确保通过

### 代码规范

- TypeScript strict 模式（含 `noUncheckedIndexedAccess`）
- 代码注释用中文
- DOM 操作用 `innerHTML + querySelector`，CSS 类名用 `fc-<name>-` 前缀
- 样式内联（`<style>` 标签），不依赖外部 CSS
- 支持 `zh`/`en` 双语

## 提交规范

使用 Conventional Commits：

```
feat(captchas): add new captcha type
fix(showcase): fix demo rendering bug
docs: update integration guide
```

## 版本管理

使用 changeset 管理版本：

```bash
pnpm changeset        # 创建 changeset
pnpm changeset version # 更新版本号
pnpm changeset publish # 发布
```

## 目录结构

详见 [架构文档](./docs/architecture.md)。
