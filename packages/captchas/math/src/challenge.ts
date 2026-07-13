export interface MathChallenge {
  question: string;
  answer: number;
}

const ops = ['+', '-', '*', '/'] as const;
type Op = (typeof ops)[number];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)] as T;
}

export function generateChallenge(): MathChallenge {
  const op = pick(ops);
  let a = randInt(1, 20);
  let b = randInt(1, 20);
  if (op === '/') {
    // 保证整除
    b = randInt(1, 10);
    a = b * randInt(1, 10);
  }
  if (op === '-' && b > a) [a, b] = [b, a];
  const answer = op === '+' ? a + b
    : op === '-' ? a - b
    : op === '*' ? a * b
    : a / b;
  return { question: `${a} ${op} ${b} = ?`, answer };
}

export function verifyAnswer(c: MathChallenge, userAnswer: number): boolean {
  return c.answer === userAnswer;
}
