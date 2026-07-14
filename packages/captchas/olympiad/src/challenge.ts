export type OlympiadType =
  | 'chicken-rabbit'
  | 'tree-planting'
  | 'age'
  | 'apple'
  | 'travel';

export interface OlympiadChallenge {
  type: OlympiadType;
  question: string;
  answer: number;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)] as T;
}

/** 鸡兔同笼：问鸡的数量 */
function genChickenRabbit(): OlympiadChallenge {
  const c = randInt(2, 15); // 鸡
  const r = randInt(2, 10); // 兔
  const heads = c + r;
  const legs = 2 * c + 4 * r;
  return {
    type: 'chicken-rabbit',
    question: `鸡兔同笼，共${heads}个头，${legs}只脚，鸡有几只？`,
    answer: c,
  };
}

/** 植树问题：两端都种，棵数 = len/gap + 1 */
function genTreePlanting(): OlympiadChallenge {
  const gap = randInt(2, 10);
  const minK = Math.ceil(20 / gap);
  const maxK = Math.floor(100 / gap);
  const k = randInt(minK, maxK);
  const len = gap * k;
  return {
    type: 'tree-planting',
    question: `一条路长${len}米，每隔${gap}米种一棵树，两端都种，共几棵？`,
    answer: len / gap + 1,
  };
}

/** 年龄问题：几年前爸爸年龄是儿子的5倍。x = (5s - f) / 4 */
function genAge(): OlympiadChallenge {
  for (let attempt = 0; attempt < 200; attempt++) {
    const f = randInt(35, 50);
    const s = randInt(8, 15);
    if (f <= s) continue;
    const num = 5 * s - f;
    if (num <= 0 || num % 4 !== 0) continue;
    const x = num / 4;
    if (x <= 0 || x >= s) continue;
    return {
      type: 'age',
      question: `爸爸${f}岁，儿子${s}岁，几年前爸爸年龄是儿子的5倍？`,
      answer: x,
    };
  }
  // 兜底：已知有效解 f=42, s=10, x=2
  return {
    type: 'age',
    question: '爸爸42岁，儿子10岁，几年前爸爸年龄是儿子的5倍？',
    answer: 2,
  };
}

/** 盈亏问题：人数 p，每人 a 个多 m，每人 a+1 个少 n。p = (m+n)/(b-a) = m+n */
function genApple(): OlympiadChallenge {
  const p = randInt(3, 12);
  const a = randInt(3, 6);
  const b = a + 1;
  const m = randInt(1, p - 1);
  const n = p - m;
  return {
    type: 'apple',
    question: `分苹果，每人${a}个多${m}个，每人${b}个少${n}个，几人？`,
    answer: p,
  };
}

/** 行程问题：相向而行，相遇时间 = d / (v1+v2)，保证整除 */
function genTravel(): OlympiadChallenge {
  const v1 = randInt(3, 12);
  const v2 = randInt(3, 12);
  const t = randInt(2, 8);
  const d = (v1 + v2) * t;
  return {
    type: 'travel',
    question: `甲乙相向而行，甲速${v1}km/h，乙速${v2}km/h，相距${d}km，几小时后相遇？`,
    answer: t,
  };
}

/** 随机生成一道小学奥数题 */
export function generateChallenge(): OlympiadChallenge {
  const gen = pick([
    genChickenRabbit,
    genTreePlanting,
    genAge,
    genApple,
    genTravel,
  ]);
  return gen();
}

/** 校验答案（整数比较） */
export function verifyAnswer(c: OlympiadChallenge, userAnswer: number): boolean {
  return c.answer === userAnswer;
}
