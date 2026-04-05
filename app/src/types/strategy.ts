export interface Strategy {
  id: string;
  name: string;
  description: string;
  category: StrategyCategory;
  tags: string[];
  indicators: string[];
  entry_conditions: Condition[];
  exit_conditions: Condition[];
  risk_management?: RiskManagement;
}

export type StrategyCategory =
  | "trend"
  | "momentum"
  | "mean_reversion"
  | "volatility"
  | "volume"
  | "composite";

export const CATEGORY_LABELS: Record<StrategyCategory, string> = {
  trend: "추세 추종",
  momentum: "모멘텀",
  mean_reversion: "평균 회귀",
  volatility: "변동성",
  volume: "거래량",
  composite: "복합",
};

export interface Indicator {
  name: string;
  label?: string;
  display_name?: string;
  category?: string;
  params?: string[];
  parameters?: IndicatorParam[];
  example?: string;
  description?: string;
}

export interface IndicatorParam {
  name: string;
  type: "int" | "float" | "string";
  default: number | string;
  description: string;
}

export interface Condition {
  indicator: string;
  field: string;
  operator: ">" | "<" | ">=" | "<=" | "==" | "crosses_above" | "crosses_below";
  value: string;
}

export interface RiskManagement {
  stop_loss_pct?: number;
  take_profit_pct?: number;
  trailing_stop_pct?: number;
  max_position_size?: number;
}

export interface BuilderState {
  name: string;
  description: string;
  selectedIndicators: string[];
  entryConditions: Condition[];
  exitConditions: Condition[];
  riskManagement: RiskManagement;
}

export const EMPTY_CONDITION: Condition = {
  indicator: "",
  field: "value",
  operator: ">",
  value: "",
};

export const DEFAULT_RISK: RiskManagement = {
  stop_loss_pct: 3,
  take_profit_pct: 5,
  trailing_stop_pct: undefined,
  max_position_size: undefined,
};
