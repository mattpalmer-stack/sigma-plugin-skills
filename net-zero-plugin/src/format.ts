import { round2 } from './model.ts';

export const MINUS = '−';

export const fmt2 = (x: number | null): string => (x === null ? '—' : x.toFixed(2));

/** Signed to 2dp: "+0.33" / "−0.17"; a gap that rounds to zero is plain "0.00". */
export function fmtGap(x: number | null): string {
  if (x === null) return '—';
  const r = round2(x);
  if (r > 0) return `+${r.toFixed(2)}`;
  if (r < 0) return `${MINUS}${Math.abs(r).toFixed(2)}`;
  return '0.00';
}

export const fmtKt = (x: number | null): string =>
  x === null ? '—' : `${Math.round(x).toLocaleString('en-US')} kt`;

export function fmtDeltaKt(delta: number): string {
  const r = Math.round(delta);
  if (r === 0) return '0 kt';
  return `${r < 0 ? MINUS : '+'}${Math.abs(r).toLocaleString('en-US')} kt`;
}

export const fmtPct = (p: number | null): string => (p === null ? '—' : `${Math.round(p * 100)}%`);

export function fmtDeltaPct(delta: number, base: number): string {
  const pct = (delta / base) * 100;
  const r = Math.round(Math.abs(pct) * 10) / 10;
  if (r === 0) return '0.0%';
  return `${pct < 0 ? MINUS : '+'}${r.toFixed(1)}%`;
}
