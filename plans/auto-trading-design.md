# K-Gun 자동매매 시스템 설계

## 1. 개요

전략 설계 → 백테스팅 → **자동 매매 실행 → 실시간 모니터링 → 포지션 추적**까지
엔드투엔드 자동화 파이프라인을 구축한다.

### 목표
- 설계한 전략이 조건 충족 시 자동으로 주문 실행
- 실시간 가격 변동에 따른 신호 감시
- 보유 포지션의 손절/익절/트레일링 자동 관리
- 모든 행위는 로그/저널에 기록, AI 챗봇으로 조회 가능

---

## 2. 아키텍처

### 2.1 하이브리드 트리거 구조

```
┌─────────────────────────────────────────────────────────┐
│                   K-Gun Trading Engine                   │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  [크론 스케줄러]  │  [실시간 이벤트 엔진]                    │
│  node-cron     │  KIS WebSocket → EventEmitter          │
│                │                                          │
│  ● 장 시작 전    │  ● 가격 변동 이벤트                     │
│    08:50 신호   │  ● 호가 변동 이벤트                     │
│  ● 장 마감 후    │  ● 체결 통보 이벤트                     │
│    15:40 정산   │                                          │
│  ● 매시 정각    │                                          │
│    포지션 체크   │                                          │
│                │                                          │
├──────────────┴──────────────────────────────────────────┤
│                                                          │
│  [전략 평가 엔진]                                         │
│  활성 전략 × 감시 종목 → 신호 생성                         │
│                                                          │
│  ┌─ 신호 강도 ≥ 임계값? ─┐                               │
│  │  YES                   │  NO                          │
│  ▼                        ▼                              │
│  [주문 실행기]             [로그 기록]                     │
│  모의 or 실전              "HOLD 신호"                    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [포지션 매니저]                                          │
│  보유 종목별 손절/익절/트레일링 실시간 감시                  │
│                                                          │
│  [알림 시스템]                                            │
│  브라우저 Push + Telegram + 웹 UI 알림벨                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 2.2 왜 MQTT가 아닌가

| 기준 | MQTT | WebSocket + EventEmitter |
|------|------|------------------------|
| 사용자 수 | 멀티유저/분산 | 1인 로컬 |
| 인프라 | 브로커 서버 필요 (Mosquitto 등) | 추가 인프라 없음 |
| 데이터 소스 | 외부 피드 구독 | KIS WebSocket (이미 존재) |
| 복잡도 | 높음 | 중간 |
| 확장성 | 높음 | 단일 프로세스 |

KIS API가 이미 WebSocket을 제공하고, 1인 로컬 앱이므로
**Node.js EventEmitter + KIS WebSocket**이 최적. 추후 멀티유저로 확장 시 MQTT 도입 검토.

---

## 3. 완전 자동매매

### 3.1 자동매매 봇 (Trading Bot)

```typescript
// 핵심 데이터 구조
interface TradingBot {
  id: string;
  name: string;
  status: "running" | "paused" | "stopped";
  
  // 전략 설정
  strategy: {
    id: string;           // 프리셋 or 커스텀
    yamlContent?: string; // .kis.yaml
    params: Record<string, number>;
  };
  
  // 감시 종목
  watchStocks: string[];  // ["005930", "000660"]
  
  // 트리거 설정
  trigger: {
    type: "cron" | "realtime" | "hybrid";
    cronSchedule?: string;     // "*/5 9-15 * * 1-5" (장중 5분마다)
    realtimeEvents?: string[]; // ["price_change", "orderbook_change"]
  };
  
  // 주문 설정
  execution: {
    mode: "vps" | "prod";
    signalThreshold: number;      // 0.7 (신호 강도 임계값)
    maxPositionSize: number;      // 최대 포지션 크기 (원)
    maxDailyOrders: number;       // 일일 최대 주문 횟수
    requireConfirmation: boolean; // 실전 시 사용자 확인 필요
  };
  
  // 포지션 관리
  positionManagement: {
    stopLoss: { enabled: boolean; percent: number };
    takeProfit: { enabled: boolean; percent: number };
    trailingStop: { enabled: boolean; percent: number; activationPercent: number };
  };
}
```

### 3.2 크론 스케줄러

```
장 시작 전 (08:50)
  → 모든 활성 봇의 감시 종목에 대해 신호 체크
  → BUY/SELL 신호 발생 시 알림 (자동주문 or 수동 확인)

장중 (09:00~15:20, 5분/10분/30분 간격 선택 가능)
  → 실시간 신호 체크 (크론 기반)
  → 포지션 관리 (손절/익절 체크)

장 마감 후 (15:40)
  → 당일 매매 요약 → 저널 자동 기록
  → 포지션 현황 스냅샷
  → 일간 리포트 생성
```

### 3.3 실시간 이벤트 엔진

```typescript
// KIS WebSocket → 내부 이벤트 변환
class TradingEventEngine extends EventEmitter {
  // 이벤트 타입
  // "price:005930" — 삼성전자 가격 변동
  // "signal:golden_cross:005930" — 신호 발생
  // "position:stop_loss:005930" — 손절 트리거
  // "order:filled:ORDER_ID" — 주문 체결
  
  // KIS WebSocket 구독
  subscribePriceStream(stockCode: string): void;
  
  // 가격 변동 → 전략 평가 → 신호 이벤트 발행
  evaluateStrategy(bot: TradingBot, price: PriceData): Signal;
}
```

---

## 4. 실시간 모니터링

### 4.1 모니터링 대시보드 (새 페이지: `/monitor`)

```
┌──────────────────────────────────────────────────────┐
│ 자동매매 모니터                              [일시정지]│
├──────────────┬───────────────────────────────────────┤
│ 활성 봇      │ 실시간 상태                            │
│              │                                       │
│ ● 골든크로스  │ 005930 삼성전자  68,500원 ▲ +1.2%    │
│   5종목 감시  │  → HOLD (강도 0.3)                    │
│   마지막 체크 │                                       │
│   09:35:12   │ 000660 SK하이닉스 195,000원 ▼ -0.5%  │
│              │  → BUY (강도 0.82) ⚡ 자동주문 대기    │
│ ● RSI 역추세 │                                       │
│   3종목 감시  │ 035420 NAVER   210,000원 ▲ +0.8%    │
│   일시정지    │  → HOLD (강도 0.1)                    │
│              │                                       │
├──────────────┴───────────────────────────────────────┤
│ 실행 로그                                             │
│ 09:35:12 [골든크로스] 005930 HOLD (0.3)               │
│ 09:35:12 [골든크로스] 000660 BUY (0.82) → 자동주문    │
│ 09:35:13 [주문] 000660 10주 매수 @ 195,000원 체결     │
│ 09:30:00 [크론] 5종목 신호 체크 시작                   │
└──────────────────────────────────────────────────────┘
```

### 4.2 상태 표시

| 상태 | 아이콘 | 설명 |
|------|--------|------|
| HOLD | ⚪ | 관망, 조건 미충족 |
| BUY 대기 | 🔴⚡ | 강도 임계값 초과, 주문 대기/실행 중 |
| SELL 대기 | 🔵⚡ | 매도 신호 발생 |
| 체결 완료 | ✅ | 주문 체결 확인 |
| 손절 트리거 | 🛑 | 손절가 도달 |

---

## 5. 주문 후 추적 (포지션 매니저)

### 5.1 포지션 라이프사이클

```
[매수 체결]
    │
    ▼
[포지션 생성]
    │
    ├─ 실시간 가격 감시 시작
    │
    ├─ 손절선 도달? ──YES──→ [자동 매도] → [포지션 종료]
    │
    ├─ 익절선 도달? ──YES──→ [자동 매도] → [포지션 종료]
    │
    ├─ 트레일링 스탑?
    │   ├─ 최고가 갱신 → 손절선 상향 조정
    │   └─ 최고가 대비 N% 하락 → [자동 매도]
    │
    └─ 청산 신호 발생? ──YES──→ [자동 매도] → [포지션 종료]
    
[포지션 종료]
    │
    ├─ 매매 저널 자동 기록
    ├─ 전략 성과 업데이트
    └─ 알림 발송
```

### 5.2 포지션 데이터 구조

```typescript
interface Position {
  id: string;
  botId: string;
  stockCode: string;
  stockName: string;
  
  // 진입
  entryPrice: number;
  entryQuantity: number;
  entryTime: string;
  entryReason: string;  // "골든크로스 BUY 신호 (강도 0.82)"
  
  // 현재 상태
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlRate: number;
  highestPrice: number;  // 트레일링용 최고가
  
  // 자동 관리 설정
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  trailingStopPrice: number | null;
  
  // 상태
  status: "open" | "closing" | "closed";
  closeReason?: "stop_loss" | "take_profit" | "trailing_stop" | "signal" | "manual";
}
```

### 5.3 SQLite 테이블

```sql
CREATE TABLE IF NOT EXISTS trading_bots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'stopped',
  strategy_id TEXT NOT NULL,
  strategy_yaml TEXT,
  strategy_params TEXT,  -- JSON
  watch_stocks TEXT NOT NULL,  -- JSON array
  trigger_type TEXT NOT NULL DEFAULT 'cron',
  trigger_config TEXT,  -- JSON
  execution_config TEXT NOT NULL,  -- JSON
  position_config TEXT NOT NULL,  -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  bot_id TEXT REFERENCES trading_bots(id),
  stock_code TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  entry_price REAL NOT NULL,
  entry_quantity INTEGER NOT NULL,
  entry_time TEXT NOT NULL,
  entry_reason TEXT,
  highest_price REAL,
  stop_loss_price REAL,
  take_profit_price REAL,
  trailing_stop_price REAL,
  status TEXT NOT NULL DEFAULT 'open',
  close_price REAL,
  close_time TEXT,
  close_reason TEXT,
  realized_pnl REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bot_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot_id TEXT REFERENCES trading_bots(id),
  type TEXT NOT NULL,  -- 'signal', 'order', 'position', 'error', 'system'
  message TEXT NOT NULL,
  data TEXT,  -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## 6. 복합 전략 (Composite Strategy)

### 6.1 현재 한계

현재 전략 빌더는 **단일 전략** 내에서 지표 조합만 가능:
```
전략 A: RSI < 30 AND MACD 골든크로스 → 매수 (가능)
```

### 6.2 복합 전략 구조

여러 전략을 조합하여 더 정확한 신호를 생성:

```
복합 전략: "안전한 추세 진입"
  ├─ 전략 1: 골든크로스 (추세 확인)     가중치 40%
  ├─ 전략 2: RSI 과매도 (타이밍)        가중치 30%
  └─ 전략 3: 변동성 확장 (모멘텀 확인)   가중치 30%
  
  복합 신호 = Σ(전략i.신호강도 × 가중치i)
  
  복합 강도 ≥ 0.7 → 매수
```

### 6.3 복합 전략 타입

```typescript
type CompositeMode = 
  | "all"        // 모든 전략이 동일 방향일 때만 (AND)
  | "majority"   // 과반수가 동일 방향일 때 (투표)
  | "weighted"   // 가중 평균 강도가 임계값 초과 시
  | "sequential" // 전략 A → B → C 순서대로 조건 충족 시

interface CompositeStrategy {
  id: string;
  name: string;
  mode: CompositeMode;
  strategies: Array<{
    strategyId: string;
    weight: number;       // 가중치 (0~1)
    role: "entry" | "exit" | "filter" | "both";
  }>;
  signalThreshold: number;
}
```

### 6.4 복합 전략 예시

```yaml
# 안전한 추세 진입 (3중 필터)
composite:
  name: "안전한 추세 진입"
  mode: all  # 모든 전략이 BUY일 때만

  strategies:
    - id: trend_filter      # 장기 추세 확인
      role: filter           # 필터: 추세가 상승일 때만 진입 허용
      weight: 1.0

    - id: golden_cross       # 매수 타이밍
      role: entry            # 실제 진입 신호
      weight: 0.5

    - id: strong_close       # 모멘텀 확인
      role: entry
      weight: 0.5

  execution:
    signal_threshold: 0.6
    # 추세 상승(filter) + 골든크로스(entry) + 강한 종가(entry)
    # = 3중 확인 후 매수
```

```yaml
# 진입/청산 분리 전략
composite:
  name: "모멘텀 진입 + 이격도 청산"
  mode: sequential

  strategies:
    - id: momentum
      role: entry             # 진입만 담당
      weight: 1.0

    - id: disparity
      role: exit              # 청산만 담당 (이격도 과매수 시 매도)
      weight: 1.0
```

---

## 7. 안전장치

### 7.1 주문 실행 전 체크리스트

```
1. [모드 확인] 모의투자인지 실전투자인지
2. [잔고 확인] 매수 가능 금액 충분한지
3. [일일 한도] 오늘 주문 횟수 초과하지 않았는지
4. [포지션 한도] 단일 종목 비중 30% 초과하지 않는지
5. [시간 확인] 장 운영 시간 내인지 (09:00~15:20)
6. [실전 가드] 실전투자 시 사용자 확인 팝업 (kis-prod-guard)
7. [중복 주문] 동일 종목 동일 방향 미체결 주문 존재하는지
```

### 7.2 비상 정지

```
- 웹 UI: "전체 중지" 버튼 → 모든 봇 일시정지
- 일일 손실 한도: 총 손실이 N% 초과 시 자동 정지
- 연속 손실: 연속 3회 손절 시 해당 봇 일시정지 + 알림
- 시스템 오류: API 에러 3회 연속 시 자동 정지
```

---

## 8. 기술 스택

| 구성 요소 | 기술 | 이유 |
|-----------|------|------|
| 크론 스케줄러 | node-cron | Next.js API Route에서 실행 가능, 경량 |
| 실시간 이벤트 | EventEmitter + KIS WebSocket | 이미 WS 연결 있음, 추가 인프라 불필요 |
| 상태 관리 | SQLite (trading_bots, positions) | 기존 DB 활용, 서버 재시작에도 유지 |
| 알림 | 기존 notification store + Telegram | 이미 구현된 알림 시스템 활용 |
| UI | `/monitor` 새 페이지 | 전용 모니터링 대시보드 |

### MQTT 도입 기준 (현재 불필요)

다음 중 하나라도 해당되면 MQTT 도입 검토:
- 멀티유저 지원 필요
- 외부 서버에 배포
- 여러 봇 프로세스를 분산 실행
- 외부 데이터 소스 (뉴스 피드 등) 구독

---

## 9. 구현 순서

### Phase A: 자동매매 봇 기반 (핵심)
1. SQLite 스키마 추가 (trading_bots, positions, bot_logs)
2. 봇 CRUD API (/api/bots)
3. 봇 관리 UI (/bots — 생성, 시작, 정지, 삭제)
4. 크론 스케줄러 (node-cron, 장중 주기적 신호 체크)
5. 자동 주문 실행 (신호 강도 임계값 초과 시)

### Phase B: 포지션 관리
6. 포지션 생성 (주문 체결 후 자동)
7. 손절/익절/트레일링 실시간 감시
8. 포지션 종료 → 저널 자동 기록

### Phase C: 실시간 모니터링
9. `/monitor` 페이지 (활성 봇 + 실시간 상태 + 로그)
10. WebSocket 가격 피드 → 이벤트 엔진
11. 실시간 신호 표시 (SSE로 프론트 푸시)

### Phase D: 복합 전략
12. 복합 전략 데이터 구조 + API
13. 복합 전략 빌더 UI (전략 조합 + 가중치)
14. 복합 신호 계산 엔진

### Phase E: 고도화
15. Telegram 봇 연동 (원격 모니터링)
16. 일간/주간 자동 리포트
17. 비상 정지 시스템
18. 백테스트 결과 기반 자동 파라미터 튜닝

---

## 10. 모의투자 우선 테스트 전략

```
Step 1: 모의투자로 봇 1개 생성 (골든크로스, 삼성전자)
Step 2: 크론 10분 간격으로 신호 체크 → 로그 확인
Step 3: BUY 신호 발생 시 자동 주문 (모의)
Step 4: 포지션 관리 (손절 5% 설정) → 자동 청산 확인
Step 5: 일주일 운영 → 성과 분석
Step 6: 실전 전환 (requireConfirmation: true)
```
