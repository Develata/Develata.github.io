/** Robust descriptive statistics used by the result views. */
export function median(values: ArrayLike<number>): number | null {
  if (values.length === 0) return null;
  const sorted = Array.from(values).sort((a, b) => a - b);
  const middle = sorted.length >>> 1;
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function inverseNormal(probability: number): number {
  const p = Math.min(1 - 1e-12, Math.max(1e-12, probability));
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const low = 0.02425;
  const high = 1 - low;

  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > high) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Log-linear correction keeps d' finite for perfect hit/false-alarm rates. */
export function dPrime(hits: number, targets: number, falseAlarms: number, nonTargets: number): number {
  if (targets <= 0 || nonTargets <= 0) return 0;
  const hitRate = (hits + 0.5) / (targets + 1);
  const falseAlarmRate = (falseAlarms + 0.5) / (nonTargets + 1);
  return inverseNormal(hitRate) - inverseNormal(falseAlarmRate);
}
