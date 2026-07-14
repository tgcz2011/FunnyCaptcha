import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: false,
  // 把 @funnycaptcha/embed 的 IIFE bundle 内联进来
  // 通过 loader 把 .html 和 .js 文件作为字符串导入
  loader: { '.html': 'text' },
  noExternal: [],
});
