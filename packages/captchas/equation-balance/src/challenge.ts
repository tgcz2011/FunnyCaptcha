// 化学方程式配平题目：用户需填入正确的化学计量数
export interface EquationBalanceChallenge {
  // 反应物化学式列表
  reactants: string[];
  // 生成物化学式列表
  products: string[];
  // 正确系数，顺序为 reactants 拼上 products
  coefficients: number[];
}

interface EquationDef {
  reactants: string[];
  products: string[];
  coefficients: number[];
}

// 题库：reactants + products 拼起来对应 coefficients 顺序
const EQUATIONS: readonly EquationDef[] = [
  { reactants: ['H₂', 'O₂'], products: ['H₂O'], coefficients: [2, 1, 2] },
  { reactants: ['Fe', 'O₂'], products: ['Fe₂O₃'], coefficients: [4, 3, 2] },
  { reactants: ['CH₄', 'O₂'], products: ['CO₂', 'H₂O'], coefficients: [1, 2, 1, 2] },
  { reactants: ['C₂H₆', 'O₂'], products: ['CO₂', 'H₂O'], coefficients: [2, 7, 4, 6] },
  { reactants: ['Al', 'HCl'], products: ['AlCl₃', 'H₂'], coefficients: [2, 6, 2, 3] },
  { reactants: ['N₂', 'H₂'], products: ['NH₃'], coefficients: [1, 3, 2] },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

// 生成题目：随机返回一个方程式（深拷贝避免污染题库）
export function generateChallenge(): EquationBalanceChallenge {
  const eq = pick(EQUATIONS);
  return {
    reactants: [...eq.reactants],
    products: [...eq.products],
    coefficients: [...eq.coefficients],
  };
}

// 校验用户填入的系数是否完全正确（系数为 1 也必须填 1）
export function verifyAnswer(
  c: EquationBalanceChallenge,
  userCoefficients: number[],
): boolean {
  if (userCoefficients.length !== c.coefficients.length) return false;
  return c.coefficients.every((coef, i) => coef === userCoefficients[i]);
}
