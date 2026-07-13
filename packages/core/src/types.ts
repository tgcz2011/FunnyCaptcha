export type CaptchaCategory =
  | 'interactive' | 'recognize' | 'creative' | 'game' | 'anti-bot';
export type Locale = 'zh' | 'en';
export type Theme = 'light' | 'dark';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface CaptchaChallenge {
  type: string;
  payload: unknown;
  token: string;
  expiresAt: number;
}

export interface CaptchaResult {
  success: boolean;
  proof: string;
  duration: number;
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

export interface CaptchaDescribe {
  name: string;
  description: string;
  tags: string[];
}

export interface CaptchaPlugin {
  id: string;
  category: CaptchaCategory;
  create(container: HTMLElement, config: CaptchaConfig): CaptchaInstance;
  describe(locale: Locale): CaptchaDescribe;
}
