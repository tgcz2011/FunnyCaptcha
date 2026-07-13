// 点选顺序题目：4 个带数字的目标打乱位置，用户按 1→2→3→4 顺序点击
export interface ClickOrderChallenge {
  // 显示在 4 个槽位上的数字（[1,2,3,4] 的随机排列）
  targets: number[];
  // 正确的点击顺序
  order: number[];
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

// 生成题目：order 固定为 [1,2,3,4]，targets 为打乱后的展示顺序
export function generateChallenge(): ClickOrderChallenge {
  const targets = shuffle([1, 2, 3, 4]);
  return { targets, order: [1, 2, 3, 4] };
}

// 校验用户点击顺序是否正确
export function verifyOrder(c: ClickOrderChallenge, userOrder: number[]): boolean {
  if (userOrder.length !== c.order.length) return false;
  return userOrder.every((v, i) => v === c.order[i]);
}

// 构造 proof 输入串：order 以逗号连接
export function proofInput(c: ClickOrderChallenge): string {
  return c.order.join(',');
}
