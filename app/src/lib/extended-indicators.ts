/**
 * 확장 지표 목록
 *
 * 백엔드(open-trading-api)의 기본 10개 지표에 추가로
 * 프론트엔드에서 제공하는 지표 목록입니다.
 *
 * 이 지표들은 전략 빌더에서 선택 가능하며,
 * 백테스트/신호 생성 시 백엔드에서 실행됩니다.
 *
 * 새 지표를 추가하려면 이 배열에 항목을 추가하세요.
 * 단, 백엔드에서 해당 지표를 계산할 수 있어야 합니다.
 */

export interface ExtendedIndicator {
  name: string;
  label: string;
  category: string;
  params: string[];
  example: string;
  description: string;
}

export const EXTENDED_INDICATORS: ExtendedIndicator[] = [
  // === 이동평균 계열 ===
  {
    name: "wma",
    label: "가중이동평균",
    category: "이동평균",
    params: ["period"],
    example: "wma(20)",
    description: "최근 가격에 더 높은 가중치를 부여하는 이동평균",
  },
  {
    name: "dema",
    label: "이중지수이동평균",
    category: "이동평균",
    params: ["period"],
    example: "dema(20)",
    description: "EMA를 2번 적용하여 지연을 줄인 이동평균",
  },
  {
    name: "tema",
    label: "삼중지수이동평균",
    category: "이동평균",
    params: ["period"],
    example: "tema(20)",
    description: "EMA를 3번 적용하여 노이즈를 줄인 이동평균",
  },

  // === 오실레이터 ===
  {
    name: "stoch_d",
    label: "스토캐스틱 D",
    category: "오실레이터",
    params: ["period", "smooth"],
    example: "stoch_d(14,3)",
    description: "스토캐스틱 K의 이동평균 (슬로우 스토캐스틱)",
  },
  {
    name: "cci",
    label: "CCI",
    category: "오실레이터",
    params: ["period"],
    example: "cci(20)",
    description: "상품채널지수. +100 이상 과매수, -100 이하 과매도",
  },
  {
    name: "williams_r",
    label: "윌리엄스 %R",
    category: "오실레이터",
    params: ["period"],
    example: "williams_r(14)",
    description: "고가 대비 현재 위치. -20 이상 과매수, -80 이하 과매도",
  },
  {
    name: "mfi",
    label: "MFI",
    category: "거래량",
    params: ["period"],
    example: "mfi(14)",
    description: "거래량 가중 RSI. 자금 흐름 강도 측정",
  },

  // === 추세 ===
  {
    name: "aroon_up",
    label: "아룬 Up",
    category: "추세",
    params: ["period"],
    example: "aroon_up(25)",
    description: "최근 N일 내 최고가까지의 기간. 100에 가까울수록 강한 상승",
  },
  {
    name: "aroon_down",
    label: "아룬 Down",
    category: "추세",
    params: ["period"],
    example: "aroon_down(25)",
    description: "최근 N일 내 최저가까지의 기간. 100에 가까울수록 강한 하락",
  },
  {
    name: "psar",
    label: "파라볼릭 SAR",
    category: "추세",
    params: ["step", "max"],
    example: "psar(0.02,0.2)",
    description: "추세 전환점과 손절 위치를 동시에 제공",
  },

  // === 변동성 ===
  {
    name: "bb_mid",
    label: "볼린저밴드 중심",
    category: "변동성",
    params: ["period"],
    example: "bb_mid(20)",
    description: "볼린저밴드 중심선 (단순이동평균)",
  },
  {
    name: "bb_width",
    label: "볼린저밴드 폭",
    category: "변동성",
    params: ["period"],
    example: "bb_width(20)",
    description: "상단-하단 밴드 폭. 좁으면 변동성 축소, 넓으면 확장",
  },
  {
    name: "keltner_upper",
    label: "켈트너채널 상단",
    category: "변동성",
    params: ["period", "multiplier"],
    example: "keltner_upper(20,2)",
    description: "EMA + ATR 기반 상단 채널",
  },
  {
    name: "keltner_lower",
    label: "켈트너채널 하단",
    category: "변동성",
    params: ["period", "multiplier"],
    example: "keltner_lower(20,2)",
    description: "EMA - ATR 기반 하단 채널",
  },

  // === 거래량 ===
  {
    name: "obv",
    label: "OBV",
    category: "거래량",
    params: [],
    example: "obv()",
    description: "누적 거래량. 가격 상승일 +, 하락일 - 거래량 누적",
  },
  {
    name: "vwap",
    label: "VWAP",
    category: "거래량",
    params: [],
    example: "vwap()",
    description: "거래량 가중 평균가. 기관 매매 기준선",
  },
  {
    name: "cmf",
    label: "CMF",
    category: "거래량",
    params: ["period"],
    example: "cmf(20)",
    description: "차이킨 자금흐름. 양수면 매수세, 음수면 매도세",
  },

  // === 모멘텀 ===
  {
    name: "roc",
    label: "변화율",
    category: "모멘텀",
    params: ["period"],
    example: "roc(12)",
    description: "N일 전 대비 가격 변화율 (%)",
  },
  {
    name: "momentum",
    label: "모멘텀",
    category: "모멘텀",
    params: ["period"],
    example: "momentum(10)",
    description: "N일 전 대비 가격 차이 (절대값)",
  },
  {
    name: "tsi",
    label: "TSI",
    category: "모멘텀",
    params: ["long", "short"],
    example: "tsi(25,13)",
    description: "True Strength Index. 이중 EMA 평활화된 모멘텀",
  },
];

// 카테고리 한글명 매핑
export const INDICATOR_CATEGORY_LABELS: Record<string, string> = {
  "이동평균": "이동평균",
  "오실레이터": "오실레이터",
  "추세": "추세",
  "변동성": "변동성",
  "거래량": "거래량",
  "모멘텀": "모멘텀",
  "기타": "기타",
};
