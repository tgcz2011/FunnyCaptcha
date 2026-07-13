import { CaptchaHost, type CaptchaHostProps } from './CaptchaHost.js';
import type { CaptchaPlugin } from '@funnycaptcha/core';

export type PresetProps = Omit<CaptchaHostProps, 'plugin'>;

// 用户传入 plugin，返回便捷组件
export function makePreset(plugin: CaptchaPlugin) {
  return function Preset(props: PresetProps) {
    return <CaptchaHost plugin={plugin} {...props} />;
  };
}
