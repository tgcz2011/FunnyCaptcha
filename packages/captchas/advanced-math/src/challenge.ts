export type AdvancedMathType = 'derivative' | 'integral' | 'limit' | 'definite';

export interface AdvancedMathChallenge {
  type: AdvancedMathType;
  question: string;
  answer: string;
  accept: string[];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)] as T;
}

const SUP_DIGITS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

const SUP_TO_DIGIT: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
};

/** 将数字转为上标字符串（用于题目展示） */
function sup(n: number): string {
  return String(n).split('').map(d => SUP_DIGITS[d] ?? d).join('');
}

/**
 * 答案归一化：
 * - 去除前后空格与所有空白
 * - 上标字符转 ^N（x² → x^2）
 * - 数字紧贴字母时补 *（3x → 3*x）
 * - 积分题去掉末尾的 +C / +c
 */
export function normalizeAnswer(input: string): string {
  let r = input.trim();
  // 上标数字序列 -> ^N
  r = r.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) =>
    '^' + m.split('').map(c => SUP_TO_DIGIT[c] ?? c).join(''));
  // 去除所有空格
  r = r.replace(/\s+/g, '');
  // 积分题：去掉末尾 +C / +c
  r = r.replace(/\+[Cc]$/, '');
  // 数字紧贴字母 -> 插入 *（3x → 3*x，但 3x^2 中的 3x 也处理）
  r = r.replace(/(\d)([a-zA-Z])/g, '$1*$2');
  return r;
}

/** 校验用户输入是否命中任一可接受答案（双向归一化后比较） */
export function verifyAnswer(challenge: AdvancedMathChallenge, userInput: string): boolean {
  const u = normalizeAnswer(userInput);
  return challenge.accept.some(a => normalizeAnswer(a) === u);
}

/** 求导：f(x) = x^n，答案 n*x^(n-1) */
function genDerivative(): AdvancedMathChallenge {
  const n = pick([2, 3, 4, 5]);
  const question = `求 f(x) = x${sup(n)} 的导数`;
  const exp = n - 1;
  const answer = `${n}x^${exp}`;
  const accept = [
    `${n}x^${exp}`,
    `${n}x${sup(exp)}`,
    `${n}*x^${exp}`,
    `${n}*x${sup(exp)}`,
  ];
  return { type: 'derivative', question, answer, accept };
}

/** 不定积分：∫ x^n dx，答案 x^(n+1)/(n+1) + C */
function genIntegral(): AdvancedMathChallenge {
  const n = pick([1, 2, 3]);
  const up = n + 1;
  const question = `求 ∫ x${sup(n)} dx`;
  const answer = `x^${up}/${up} + C`;
  const accept = [
    `x^${up}/${up} + C`,
    `x^${up}/${up}+C`,
    `x^${up}/${up}`,
    `x${sup(up)}/${up} + C`,
    `x${sup(up)}/${up}`,
    `x^${up}/(${up}) + C`,
    `x^${up}/(${up})`,
    `x${sup(up)}/(${up}) + C`,
    `x${sup(up)}/(${up})`,
  ];
  return { type: 'integral', question, answer, accept };
}

/** 极限：lim(x→a) (x²-a²)/(x-a) = 2a */
function genLimit(): AdvancedMathChallenge {
  const a = pick([1, 2, 3]);
  const question = `求 lim(x→${a}) (x${sup(2)}-${a}${sup(2)})/(x-${a})`;
  const answer = `${2 * a}`;
  const accept = [
    `${2 * a}`,
    `2*${a}`,
  ];
  return { type: 'limit', question, answer, accept };
}

/** 定积分：∫₀¹ x^n dx = 1/(n+1) */
function genDefinite(): AdvancedMathChallenge {
  const n = pick([1, 2, 3]);
  const up = n + 1;
  const question = `计算 ∫₀¹ x${sup(n)} dx`;
  const answer = `1/${up}`;
  const accept = [
    `1/${up}`,
    `1/(${up})`,
  ];
  return { type: 'definite', question, answer, accept };
}

/** 随机生成一道高等数学题 */
export function generateChallenge(): AdvancedMathChallenge {
  const gen = pick([genDerivative, genIntegral, genLimit, genDefinite]);
  return gen();
}
