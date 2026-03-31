import type { CostEstimate } from '../types';
import { VAT_RATE } from '../types';

export function calcLaborTotal(estimate: CostEstimate): number {
  return estimate.labor.reduce((sum, l) => sum + l.rateNet * l.hours, 0);
}

export function calcTotalHours(estimate: CostEstimate): number {
  return estimate.labor.reduce((sum, l) => sum + l.hours, 0);
}

export function calcExternalTotal(estimate: CostEstimate): number {
  return estimate.externalCosts.reduce(
    (sum, e) => sum + e.costNet * (1 + e.marginPercent / 100),
    0
  );
}

export function calcExternalMarginTotal(estimate: CostEstimate): number {
  return estimate.externalCosts.reduce(
    (sum, e) => sum + e.costNet * (e.marginPercent / 100),
    0
  );
}

export function calcNetTotal(estimate: CostEstimate, discountPercent: number): number {
  const base = calcLaborTotal(estimate) + calcExternalTotal(estimate);
  return base * (1 - discountPercent / 100);
}

export function calcVat(netTotal: number): number {
  return netTotal * VAT_RATE;
}

export function calcGross(netTotal: number): number {
  return netTotal * (1 + VAT_RATE);
}

export function fmt(value: number): string {
  return value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
