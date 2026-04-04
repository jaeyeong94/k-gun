import { create } from "zustand";
import type {
  BuilderState,
  Condition,
  RiskManagement,
} from "@/types/strategy";

interface StrategyStore extends BuilderState {
  currentStep: number;

  setStep: (step: number) => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  toggleIndicator: (indicator: string) => void;
  addEntryCondition: () => void;
  updateEntryCondition: (index: number, condition: Condition) => void;
  removeEntryCondition: (index: number) => void;
  addExitCondition: () => void;
  updateExitCondition: (index: number, condition: Condition) => void;
  removeExitCondition: (index: number) => void;
  setRiskManagement: (risk: Partial<RiskManagement>) => void;
  reset: () => void;
}

const INITIAL_CONDITION: Condition = {
  indicator: "",
  field: "value",
  operator: ">",
  value: "",
};

const INITIAL_RISK: RiskManagement = {
  stop_loss_pct: 3,
  take_profit_pct: 5,
  trailing_stop_pct: undefined,
  max_position_size: undefined,
};

const initialState: BuilderState & { currentStep: number } = {
  currentStep: 0,
  name: "",
  description: "",
  selectedIndicators: [],
  entryConditions: [{ ...INITIAL_CONDITION }],
  exitConditions: [{ ...INITIAL_CONDITION }],
  riskManagement: { ...INITIAL_RISK },
};

export const useStrategyStore = create<StrategyStore>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setName: (name) => set({ name }),

  setDescription: (description) => set({ description }),

  toggleIndicator: (indicator) =>
    set((state) => {
      const exists = state.selectedIndicators.includes(indicator);
      return {
        selectedIndicators: exists
          ? state.selectedIndicators.filter((i) => i !== indicator)
          : [...state.selectedIndicators, indicator],
      };
    }),

  addEntryCondition: () =>
    set((state) => ({
      entryConditions: [...state.entryConditions, { ...INITIAL_CONDITION }],
    })),

  updateEntryCondition: (index, condition) =>
    set((state) => ({
      entryConditions: state.entryConditions.map((c, i) =>
        i === index ? condition : c,
      ),
    })),

  removeEntryCondition: (index) =>
    set((state) => ({
      entryConditions: state.entryConditions.filter((_, i) => i !== index),
    })),

  addExitCondition: () =>
    set((state) => ({
      exitConditions: [...state.exitConditions, { ...INITIAL_CONDITION }],
    })),

  updateExitCondition: (index, condition) =>
    set((state) => ({
      exitConditions: state.exitConditions.map((c, i) =>
        i === index ? condition : c,
      ),
    })),

  removeExitCondition: (index) =>
    set((state) => ({
      exitConditions: state.exitConditions.filter((_, i) => i !== index),
    })),

  setRiskManagement: (risk) =>
    set((state) => ({
      riskManagement: { ...state.riskManagement, ...risk },
    })),

  reset: () => set({ ...initialState }),
}));
