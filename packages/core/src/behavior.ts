// 行为轨迹分析模块：用于判断拖拽/滑动操作是否来自真人

export interface TrackPoint {
  x: number;
  y: number;
  t: number; // 相对开始时刻的毫秒数
}

export interface BehaviorAnalysis {
  /** 人类相似度 0-100，越高越像真人 */
  humanScore: number;
  /** 是否判定为机器人 */
  isBot: boolean;
  /** 判定理由（人类特征不达标项） */
  reasons: string[];
  /** 轨迹点数 */
  samples: number;
  /** 总时长 ms */
  duration: number;
}

/**
 * 轨迹记录器：在 pointerdown 时 start()，pointermove 时 record()，pointerup 时 stop()
 */
export class TrackRecorder {
  private points: TrackPoint[] = [];
  private origin = 0;

  start(): void {
    this.origin = performance.now();
    this.points = [];
  }

  record(x: number, y: number): void {
    this.points.push({ x, y, t: performance.now() - this.origin });
  }

  stop(): TrackPoint[] {
    return this.points.slice();
  }

  clear(): void {
    this.points = [];
    this.origin = 0;
  }

  get count(): number {
    return this.points.length;
  }
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}

/**
 * 分析一条轨迹，输出人类相似度评分与机器人判定
 *
 * 检测维度：
 * 1. 采样点数量（太少 = 可疑）
 * 2. 总时长（太快 = 可疑）
 * 3. 速度变异系数（匀速 = 机器人）
 * 4. Y 轴抖动（完美水平 = 机器人）
 * 5. 末端减速（接近终点不减速 = 机器人）
 * 6. 方向变化/回退校对（完全单向 = 可疑）
 * 7. 加速度平滑度（过于平滑 = 机器人）
 */
export function analyzeTrack(track: TrackPoint[]): BehaviorAnalysis {
  const reasons: string[] = [];
  let score = 100;

  if (track.length < 2) {
    return {
      humanScore: 0,
      isBot: true,
      reasons: ['轨迹点不足'],
      samples: track.length,
      duration: 0,
    };
  }

  const first = track[0]!;
  const last = track[track.length - 1]!;
  const duration = last.t - first.t;

  // 1. 采样点数量
  if (track.length < 8) {
    reasons.push('轨迹点太少');
    score -= 35;
  }

  // 2. 总时长
  if (duration < 280) {
    reasons.push('拖动过快');
    score -= 30;
  }
  if (duration > 30000) {
    reasons.push('拖动异常缓慢');
    score -= 15;
  }

  // 计算逐点速度
  const speeds: number[] = [];
  for (let i = 1; i < track.length; i++) {
    const prev = track[i - 1]!;
    const cur = track[i]!;
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    const dt = Math.max(1, cur.t - prev.t);
    speeds.push(Math.sqrt(dx * dx + dy * dy) / dt);
  }

  // 3. 速度变异系数（CV）
  const meanSpeed = mean(speeds);
  const speedStd = std(speeds);
  const cv = meanSpeed > 0 ? speedStd / meanSpeed : 0;
  if (cv < 0.18 && speeds.length > 5) {
    reasons.push('速度过于均匀');
    score -= 25;
  }

  // 4. Y 轴抖动（人类拖动时 y 会有 1-4px 的自然抖动）
  const ys = track.map(p => p.y);
  const yStd = std(ys);
  if (track.length > 10 && yStd < 1.2) {
    reasons.push('Y轴无自然抖动');
    score -= 22;
  }

  // 5. 末端减速：最后 20% 的平均速度应明显低于峰值
  if (speeds.length > 6) {
    const maxSpeed = Math.max(...speeds);
    const tailLen = Math.max(1, Math.ceil(speeds.length * 0.2));
    const tail = speeds.slice(-tailLen);
    const tailMean = mean(tail);
    if (maxSpeed > 0 && tailMean > maxSpeed * 0.55) {
      reasons.push('末端未减速');
      score -= 18;
    }
  }

  // 6. 方向变化（x 方向反向 = 回退/校对，人类常有）
  let reversals = 0;
  for (let i = 2; i < track.length; i++) {
    const d1 = track[i - 1]!.x - track[i - 2]!.x;
    const d2 = track[i]!.x - track[i - 1]!.x;
    if (d1 * d2 < 0 && Math.abs(d1) > 0.5 && Math.abs(d2) > 0.5) reversals++;
  }
  if (track.length > 12 && reversals === 0) {
    reasons.push('无回退/校对动作');
    score -= 12;
  }

  // 7. 加速度平滑度：相邻速度差的标准差，机器人通常很小
  if (speeds.length > 4) {
    const accels: number[] = [];
    for (let i = 1; i < speeds.length; i++) {
      accels.push(speeds[i]! - speeds[i - 1]!);
    }
    const accelStd = std(accels);
    if (accelStd < 0.05 && meanSpeed > 0.1) {
      reasons.push('加速度过于平滑');
      score -= 15;
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    humanScore: score,
    isBot: score < 50,
    reasons,
    samples: track.length,
    duration: Math.round(duration),
  };
}
