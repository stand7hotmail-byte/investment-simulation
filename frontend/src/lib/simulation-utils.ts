import { FrontierPoint } from "@/types/simulation";

/**
 * 2つのフロンティアポイントが実質的に同一かどうかを判定します。
 */
export const isPointMatch = (p1: FrontierPoint | null, p2: FrontierPoint | null): boolean => {
  if (!p1 || !p2) return false;
  return Math.abs(p1.volatility - p2.volatility) < 1e-6 && 
         Math.abs(p1.expected_return - p2.expected_return) < 1e-6;
};

/**
 * ポートフォリオの特性に基づいて戦略名を決定するキーを返します。
 */
export const getStrategyNameKey = (
  current: FrontierPoint,
  riskParity: FrontierPoint | null,
  maxSharpe: FrontierPoint | null
): string => {
  if (isPointMatch(riskParity, current)) {
    return "simulation.riskParityStrategy";
  }
  if (isPointMatch(maxSharpe, current)) {
    return "simulation.maxSharpeStrategy";
  }
  if (current.expected_return > 0) {
    return "simulation.optimizedPoint";
  }
  return "simulation.customSelection";
};
