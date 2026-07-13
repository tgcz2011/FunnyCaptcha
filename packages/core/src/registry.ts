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
