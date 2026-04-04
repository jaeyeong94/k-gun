import { http, HttpResponse } from "msw";

export const handlers = [
  // 인증 상태
  http.get("/api/strategy/auth/status", () => {
    return HttpResponse.json({
      authenticated: true,
      mode: "vps",
      mode_display: "모의투자",
      can_switch_mode: true,
      cooldown_remaining: 0,
    });
  }),

  // 계좌 잔고
  http.get("/api/strategy/account/balance", () => {
    return HttpResponse.json({
      status: "success",
      data: {
        deposit: 10000000,
        total_eval: 10000000,
        purchase_amount: 0,
        eval_amount: 0,
        profit_loss: 0,
      },
    });
  }),

  // 보유 종목
  http.get("/api/strategy/account/holdings", () => {
    return HttpResponse.json({
      status: "success",
      data: [],
    });
  }),

  // 전략 목록
  http.get("/api/strategy/strategies", () => {
    return HttpResponse.json({
      strategies: [
        {
          id: "golden_cross",
          name: "골든크로스",
          description: "단기 MA가 장기 MA를 상향 돌파 시 매수",
          category: "추세추종",
          params: [],
        },
      ],
    });
  }),

  // 종목 시세 (삼성전자)
  http.get("/api/strategy/market/price/:code", ({ params }) => {
    const { code } = params;
    return HttpResponse.json({
      status: "success",
      data: {
        code,
        price: 70000,
        change: 1000,
        change_rate: 1.45,
        volume: 10000000,
        high: 71000,
        low: 69000,
        w52_high: 85000,
        w52_low: 50000,
      },
    });
  }),
];
