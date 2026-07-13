import { defineConfig } from 'tsup';
export default defineConfig({
  entry: { embed: 'src/index.ts' },
  format: ['esm', 'iife'],
  globalName: 'FunnyCaptcha',
  dts: true,
  clean: true,
  sourcemap: true,
});
