export interface ParamDefinition {
  default: number;
  min: number;
  max: number;
  step?: number;
  type?: "int" | "float";
  label?: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  params?: Record<string, ParamDefinition>;
}

export interface StrategyDetail extends Strategy {
  indicators: IndicatorConfig[];
  entry: ConditionGroup;
  exit: ConditionGroup;
  param_values?: Record<string, number>;
  risk_management: RiskConfig;
}

export interface IndicatorConfig {
  id: string;
  alias?: string;
  params: Record<string, number>;
}

export interface Condition {
  indicator: string;
  operator: string;
  compare_to: string | number;
}

export interface ConditionGroup {
  logic: "AND" | "OR";
  conditions: Condition[];
}

export interface RiskConfig {
  stop_loss?: { enabled: boolean; percent: number };
  take_profit?: { enabled: boolean; percent: number };
  trailing_stop?: { enabled: boolean; percent: number };
}

export interface Category {
  id: string;
  name: string;
}
