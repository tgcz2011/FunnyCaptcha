import type { CaptchaMeta } from './catalog';

export interface Snippet {
  id: 'npm' | 'script' | 'source';
  label: { zh: string; en: string };
  code: string;
}

export function buildSnippets(meta: CaptchaMeta): Snippet[] {
  const pkg = meta.pkg;
  return [
    {
      id: 'npm',
      label: { zh: 'npm 包', en: 'npm package' },
      code: `// 1. 安装
//   pnpm add ${pkg} @funnycaptcha/react

// 2. 在 React 组件中使用
import { CaptchaHost } from '@funnycaptcha/react';
import { ${meta.type.replace(/-/g, '') + 'Plugin'} } from '${pkg}';

export function MyCaptcha() {
  return (
    <CaptchaHost
      plugin={${meta.type.replace(/-/g, '') + 'Plugin'}}
      config={{ locale: 'zh', theme: 'light', difficulty: 'normal' }}
    />
  );
}

// 3. 后端校验（Node.js）
import { verifyMathProof, issueMathChallenge } from '${pkg}';
import { registerVerifier } from '@funnycaptcha/server';

registerVerifier('${meta.type}', { issue: issueMathChallenge, verify: verifyMathProof });`,
    },
    {
      id: 'script',
      label: { zh: '脚本嵌入', en: 'script embed' },
      code: `<!-- 1. 引入脚本（IIFE 全局 FunnyCaptcha） -->
<script src="https://cdn.jsdelivr.net/npm/@funnycaptcha/embed/dist/index.iife.js"></script>

<!-- 2. 放置容器 -->
<div
  data-funny-captcha="${meta.type}"
  data-locale="zh"
  data-theme="light"
></div>

<!-- 3. 启动扫描（自动挂载所有容器） -->
<script>
  FunnyCaptcha.autoStart({
    endpoint: 'https://your-server.example.com',
  });
</script>`,
    },
    {
      id: 'source',
      label: { zh: '源码复制', en: 'source copy' },
      code: `// 直接复制 packages/captchas/${meta.type}/src/ 目录到你的项目
// 依赖：@funnycaptcha/core（提供 types、token、proof、registry）

// 目录结构：
//   src/
//     challenge.ts   # 题目生成
//     render.ts      # DOM 渲染 + 交互
//     verifier.ts    # 服务端校验
//     index.ts       # plugin 定义 + 导出

// 使用：
//   import { ${meta.type.replace(/-/g, '') + 'Plugin'} } from './src/${meta.type}/index';
//   const inst = ${meta.type.replace(/-/g, '') + 'Plugin'}.create(container, config);
//   inst.mount();`,
    },
  ];
}
