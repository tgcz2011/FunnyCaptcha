# 集成指南

## 方式一：npm 包（React 项目）

### 安装

```bash
pnpm add @funnycaptcha/core @funnycaptcha/react @funnycaptcha/math
# 或
npm install @funnycaptcha/core @funnycaptcha/react @funnycaptcha/math
```

### 使用

```tsx
import { CaptchaHost } from '@funnycaptcha/react';
import { mathPlugin } from '@funnycaptcha/math';

function MyForm() {
  const handleVerify = (result) => {
    if (result.success) {
      console.log('Proof:', result.proof);
      // 把 result.proof 发送到后端校验
    }
  };

  return (
    <CaptchaHost
      plugin={mathPlugin}
      config={{
        locale: 'zh',        // 'zh' | 'en'
        theme: 'light',      // 'light' | 'dark'
        difficulty: 'normal', // 'easy' | 'normal' | 'hard'
        onVerify: handleVerify,
      }}
    />
  );
}
```

### 可用的验证码包

| 包名 | 类型 | 说明 |
|---|---|---|
| `@funnycaptcha/math` | recognize | 算术题 |
| `@funnycaptcha/text-distort` | recognize | 扭曲文字 |
| `@funnycaptcha/slider` | interactive | 滑动拼图 |
| `@funnycaptcha/click-order` | interactive | 点选顺序 |
| `@funnycaptcha/rotate` | interactive | 旋转对齐 |
| `@funnycaptcha/spot-diff` | creative | 找不同 |
| `@funnycaptcha/emoji-match` | creative | 表情匹配 |
| `@funnycaptcha/meme-quiz` | creative | 梗图问答 |
| `@funnycaptcha/mini-game` | game | 迷你游戏 |
| `@funnycaptcha/anti-bot` | anti-bot | 反人类讽刺 |

## 方式二：脚本嵌入（任意网站）

### 基础用法

```html
<!-- 1. 引入脚本 -->
<script src="https://cdn.jsdelivr.net/npm/@funnycaptcha/embed/dist/index.iife.js"></script>

<!-- 2. 放置容器 -->
<div
  data-funny-captcha="math"
  data-locale="zh"
  data-theme="light"
></div>

<!-- 3. 启动 -->
<script>
  FunnyCaptcha.autoStart({
    endpoint: 'https://your-server.com', // 可选：后端校验地址
  });
</script>
```

### data 属性

| 属性 | 值 | 说明 |
|---|---|---|
| `data-funny-captcha` | 验证码类型 | 如 `math`、`slider`、`emoji-match` |
| `data-locale` | `zh` / `en` | 语言 |
| `data-theme` | `light` / `dark` | 主题 |
| `data-difficulty` | `easy` / `normal` / `hard` | 难度 |

## 方式三：源码复制

1. 复制 `packages/captchas/<name>/src/` 到你的项目
2. 安装 `@funnycaptcha/core` 作为依赖
3. 直接导入使用：

```ts
import { mathPlugin } from './src/math/index';

const container = document.getElementById('captcha');
const instance = mathPlugin.create(container, {
  locale: 'zh',
  theme: 'light',
  onVerify: (result) => {
    console.log(result.proof);
  },
});
instance.mount();
```

## 后端校验

### Node.js（Express）

```ts
import express from 'express';
import { registerVerifier } from '@funnycaptcha/server';
import { issueMathChallenge, verifyMathProof } from '@funnycaptcha/math';

// 注册 verifier
registerVerifier('math', {
  issue: issueMathChallenge,
  verify: verifyMathProof,
});

const app = express();

// 获取 challenge
app.post('/api/captcha/math/challenge', (req, res) => {
  const { challenge } = issueMathChallenge();
  res.json({ challenge });
});

// 校验 proof
app.post('/api/captcha/math/verify', async (req, res) => {
  const { challenge, proof } = req.body;
  const valid = await verifyMathProof(challenge, proof);
  res.json({ success: valid });
});

app.listen(3001);
```

### 完整流程

```
1. 前端请求 challenge → 后端生成并存储（带过期时间）
2. 用户交互 → 前端生成 proof
3. 前端提交 proof → 后端校验并消费 challenge（一次性）
4. 后端返回验证结果
```
