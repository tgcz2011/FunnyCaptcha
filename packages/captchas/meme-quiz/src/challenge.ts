// 梗图问答题目：根据 emoji 梗描述从 4 个选项中选出正确的梗名
export interface MemeQuizChallenge {
  // 问题（emoji 梗描述）
  question: string;
  // 正确答案
  correct: string;
  // 4 个备选项（含正确答案）
  options: string[];
}

// 预设题库（中文梗，每题 4 选项）
interface MemeItem {
  question: string;
  correct: string;
  options: string[];
}

const BANK: MemeItem[] = [
  { question: '🐱+🍞 = ?', correct: '猫面包', options: ['猫面包', '狗饼干', '鸟蛋糕', '鱼馒头'] },
  { question: '🐊+🦛 = ?', correct: '鳄马', options: ['鳄马', '鲸象', '蛇鹿', '鲨牛'] },
  { question: '🐶+🌭 = ?', correct: '狗热狗', options: ['狗热狗', '猫汉堡', '鸟披萨', '鱼寿司'] },
  { question: '🦆+🧅 = ?', correct: '鸭葱', options: ['鸭葱', '鸡蒜', '鹅姜', '鹅韭'] },
  { question: '🐍+📱 = ?', correct: '蛇机', options: ['蛇机', '龙脑', '虎屏', '猫鼠'] },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fisher-Yates 洗牌
function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

// 生成题目：从题库随机选一题，选项打乱顺序
export function generateChallenge(): MemeQuizChallenge {
  const item = BANK[randInt(0, BANK.length - 1)]!;
  return {
    question: item.question,
    correct: item.correct,
    options: shuffle(item.options),
  };
}

// 校验用户选择是否正确
export function verifyAnswer(c: MemeQuizChallenge, userPick: string): boolean {
  return c.correct === userPick;
}
