// 随机数猎手题目：给定一个条件，用户在数字满足条件的瞬间点击捕获
export interface RandomHuntChallenge {
  // 条件标识（稳定的 key，用于构造 proof）
  condition: string;
  // 判断函数：给定数字是否满足条件（不可序列化，本验证码不做后端校验）
  check: (n: number) => boolean;
}

export type HuntLocale = 'zh' | 'en';

interface ConditionDef {
  key: string;
  zh: string;
  en: string;
  check: (n: number) => boolean;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

// 条件库：随机选一个
const CONDITIONS: readonly ConditionDef[] = [
  { key: 'gt50', zh: '大于 50', en: 'greater than 50', check: n => n > 50 },
  { key: 'lt20', zh: '小于 20', en: 'less than 20', check: n => n < 20 },
  { key: 'even', zh: '偶数', en: 'even number', check: n => n % 2 === 0 },
  { key: 'odd', zh: '奇数', en: 'odd number', check: n => n % 2 === 1 },
  { key: 'mult3', zh: '3 的倍数', en: 'multiple of 3', check: n => n % 3 === 0 },
  { key: 'gt50-even', zh: '大于 50 的偶数', en: 'even and > 50', check: n => n > 50 && n % 2 === 0 },
  { key: 'lt30-odd', zh: '小于 30 的奇数', en: 'odd and < 30', check: n => n < 30 && n % 2 === 1 },
  { key: 'prime', zh: '质数', en: 'prime number', check: n => isPrime(n) },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

// 生成题目：随机返回一个条件
export function generateChallenge(): RandomHuntChallenge {
  const c = pick(CONDITIONS);
  return { condition: c.key, check: c.check };
}

// 根据条件 key 与 locale 返回人类可读的条件描述
export function conditionLabel(condition: string, locale: HuntLocale): string {
  const def = CONDITIONS.find(c => c.key === condition);
  if (!def) return condition;
  return locale === 'zh' ? def.zh : def.en;
}
