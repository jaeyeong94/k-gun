# K-Gun Control Panel - 설계 문서

## 1. 프로젝트 개요

한국투자증권 Open API 기반의 통합 트레이딩 컨트롤패널.
기존 `open-trading-api`의 strategy_builder(port 8000)와 backtester(port 8002) 백엔드를 하나의 UI로 통합한다.

### 목표
- 전략 설계 → 백테스트 → 주문 실행을 단일 UI에서 관리
- 기존 백엔드 API를 그대로 활용 (프록시)
- 모던하고 직관적인 대시보드 스타일 UI

---

## 2. 기술 스택

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Framework | Next.js (App Router) | 16.x | SSR, 라우팅, API 프록시 |
| Language | TypeScript | 5.x | 타입 안전성 |
| UI | Tailwind CSS | 4.x | 스타일링 |
| UI Components | shadcn/ui | latest | 컴포넌트 라이브러리 |
| Charts | Recharts | 3.x | 차트 시각화 |
| Icons | Lucide React | latest | 아이콘 |
| State | Zustand | latest | 전역 상태 관리 |
| HTTP | Native Fetch | - | API 통신 |
| Forms | React Hook Form + Zod | latest | 폼 관리 + 유효성 검증 |
| Date | date-fns | latest | 날짜 처리 |
| YAML | js-yaml | latest | 전략 YAML 파싱 |
| API Mock | MSW (Mock Service Worker) | latest | 테스트용 API mock |
| E2E 테스트 | Playwright | latest | 브라우저 E2E 테스트 |
| Fonts | Pretendard, Geist Mono | - | 한글 + 코드 |

### 기존 프론트엔드와의 차이점

| 항목 | 기존 (strategy_builder/backtester) | 신규 (k-gun) |
|------|-----------------------------------|-------------|
| 상태관리 | React Context + useReducer | Zustand |
| UI 컴포넌트 | 자체 구현 | shadcn/ui 기반 |
| 폼 처리 | HTML5 네이티브 | React Hook Form + Zod |
| 날짜 | 네이티브 Date | date-fns |
| 포트 | 3000 (P1), 3001 (P2) | 3333 (통합) |

---

## 3. 백엔드 연동 구조

```
k-gun Control Panel (port 3333)
  │
  ├── /api/strategy/* → proxy → localhost:8000 (Strategy Builder Backend)
  ├── /api/backtest/* → proxy → localhost:8002 (Backtester Backend)
  └── /api/mcp/*      → proxy → localhost:3846 (MCP Server)
```

### Next.js Rewrites 설정

```typescript
// next.config.ts
rewrites: [
  { source: '/api/strategy/:path*', destination: 'http://localhost:8000/api/:path*' },
  { source: '/api/backtest/:path*', destination: 'http://localhost:8002/api/:path*' },
  { source: '/api/mcp/:path*',     destination: 'http://localhost:3846/:path*' },
]
```

### 주요 API 엔드포인트 맵

#### 인증 (Strategy Builder Backend - 8000)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/strategy/auth/login | 모의/실전 인증 |
| GET | /api/strategy/auth/status | 인증 상태 확인 |
| POST | /api/strategy/auth/switch-mode | 모드 전환 (60초 쿨다운) |
| POST | /api/strategy/auth/logout | 로그아웃 |

#### 전략 (Strategy Builder Backend - 8000)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/strategy/strategies | 프리셋 전략 목록 |
| GET | /api/strategy/strategies/indicators | 기술지표 목록 (80개) |
| POST | /api/strategy/strategies/execute | 전략 신호 실행 |
| POST | /api/strategy/strategies/build | 커스텀 전략 빌드 |
| POST | /api/strategy/strategies/preview-code | Python 코드 프리뷰 |

#### 시세/주문 (Strategy Builder Backend - 8000)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/strategy/market/price/{code} | 현재가 조회 |
| GET | /api/strategy/market/orderbook/{code} | 호가 조회 |
| WS | /api/strategy/ws/{code} | 실시간 호가 WebSocket |
| POST | /api/strategy/orders/execute | 주문 실행 |
| GET | /api/strategy/orders/pending | 미체결 주문 |
| POST | /api/strategy/orders/cancel | 주문 취소 |

#### 계좌 (Strategy Builder Backend - 8000)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/strategy/account/info | 계좌 종합 정보 |
| GET | /api/strategy/account/holdings | 보유종목 |
| GET | /api/strategy/account/balance | 예수금 잔고 |
| GET | /api/strategy/account/buyable/{code} | 매수 가능 수량 |

#### 백테스트 (Backtester Backend - 8002)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/backtest/backtest/run | 백테스트 실행 |
| POST | /api/backtest/backtest/run-custom | 커스텀 YAML 백테스트 |
| GET | /api/backtest/strategies | 전략 목록 (카테고리 포함) |
| GET | /api/backtest/strategies/categories | 전략 카테고리 |

#### 종목 검색 (Strategy Builder Backend - 8000)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/strategy/symbols/search | 종목 검색 |
| GET | /api/strategy/symbols/status | 마스터 파일 상태 |
| POST | /api/strategy/symbols/collect | 마스터 파일 수집 |

---

## 4. 기능 목록

### 4.1 대시보드 (Dashboard)
- 계좌 잔고 요약 (예수금, 총평가, 평가손익, 수익률)
- 보유종목 요약 카드 (상위 종목, 전체 수익률)
- 코스피/코스닥 지수 현황
- 최근 거래 이력
- 활성 전략 모니터링 (실행 중인 신호)
- 오늘의 신호 알림

### 4.2 전략 빌더 (Strategy Builder)
- 10개 프리셋 전략 브라우저 (카테고리별 분류)
- 5단계 커스텀 전략 위저드
  - Step 1: 기술지표 선택 (80개 지표, 7개 카테고리)
  - Step 2: 진입 조건 설정 (AND/OR 논리 게이트)
  - Step 3: 청산 조건 설정
  - Step 4: 리스크 관리 (손절/익절/트레일링)
  - Step 5: 메타데이터 (이름, 설명, 태그)
- YAML 실시간 프리뷰 + Python 코드 생성
- 전략 가져오기/내보내기 (드래그앤드롭)
- 로컬 전략 저장/관리
- 조건 템플릿 (골든크로스, RSI 과매수 등)

### 4.3 백테스트 (Backtester)
- 프리셋/커스텀 전략 백테스트 실행
- 파라미터 슬라이더 (최적값 탐색)
- 종목 선택 (검색 + 인기종목 퀵선택)
- 날짜 범위 설정
- 초기 자본금, 수수료, 세금, 슬리피지 설정
- 성과 분석 대시보드
  - 수익 곡선 차트 (전략 vs 코스피 벤치마크)
  - 낙폭 시각화
  - 매매 포인트 마커 (매수/매도)
  - 성과 지표 6개 카테고리
    - 기본: 총수익률, 연수익률, 최대낙폭
    - 리스크: 샤프비율, 소르티노비율
    - 변동성: 연간 표준편차
    - 벤치마크: 정보비율, 추적오차, 트레이너비율
    - 거래: 승률, 평균손익, 기대수익
    - 포트폴리오: 총수수료, 회전율
- 파라미터 최적화 (Grid/Random Search)
- 배치 백테스트 (여러 전략 비교)
- HTML 리포트 다운로드

### 4.4 실시간 트레이딩 (Live Trading)
- 종목별 실시간 호가창 (WebSocket)
- 전략 기반 신호 생성 (BUY/SELL/HOLD + 강도 0~1)
- 주문 실행 모달 (수량 조절, 현재가 확인)
- 주문 결과 확인
- 미체결 주문 관리 (조회/취소)
- 실행 로그 (타임스탬프별)
- 모의/실전 모드 전환 (배지 표시)

### 4.5 포트폴리오 (Portfolio)
- 보유종목 상세 테이블 (종목, 수량, 평균가, 현재가, 수익률, 평가금액)
- 포트폴리오 구성 비율 (도넛 차트)
- 종목별 수익률 바 차트
- 일별 자산 변동 추이

### 4.6 종목 탐색 (Stock Explorer)
- 종목 검색 (코드/이름)
- 종목 상세 정보
- 현재가/등락률
- 호가 테이블
- 빠른 신호 확인 (선택한 전략으로)

### 4.7 AI 챗봇 (Claude Code)
- 자연어로 전략 설계/백테스트/주문 실행 가능
- Claude Code CLI를 통해 KIS 스킬/MCP 도구 자동 활용
- 스트리밍 응답 (실시간 타이핑)
- 마크다운/코드블록/테이블 렌더링
- 도구 실행 상태 표시 (백테스트 진행률 등)
- 빠른 명령 버튼 ("잔고 확인", "전략 목록", "백테스트")
- 대화 이력 유지
- 결과를 대시보드 위젯과 연동

### 4.8 설정 (Settings)
- 인증 관리 (모의/실전 전환)
- 마스터 파일 관리 (수집/상태)
- 기본 수수료/세금 설정
- 테마 설정 (다크/라이트)

---

## 5. 페이지 구조 & 라우팅

```
/                           → 대시보드 (리다이렉트)
/dashboard                  → 대시보드
/strategy                   → 전략 빌더
  /strategy/presets          → 프리셋 목록
  /strategy/builder          → 커스텀 빌더
/backtest                   → 백테스트
  /backtest/run              → 실행
  /backtest/results          → 결과 목록
  /backtest/optimize         → 파라미터 최적화
/trading                    → 실시간 트레이딩
  /trading/signals           → 신호 확인
  /trading/orders            → 주문 관리
/portfolio                  → 포트폴리오
/chat                       → AI 챗봇
/explorer                   → 종목 탐색
/settings                   → 설정
```

---

## 6. 레이아웃 설계

### 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│  Top Bar (로고, 모드 배지, 알림, 설정)                      │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  Sidebar │            Main Content                      │
│          │                                              │
│  - 대시보드│                                              │
│  - 전략   │                                              │
│  - 백테스트│                                              │
│  - 트레이딩│                                              │
│  - 포트폴리오│                                            │
│  - 종목탐색│                                              │
│  - 설정   │                                              │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│  Status Bar (인증상태, 서버연결, 마지막 동기화)               │
└─────────────────────────────────────────────────────────┘
```

### 반응형 전략
- Desktop (1280px+): 사이드바 + 메인 콘텐츠
- Tablet (768-1279px): 접이식 사이드바
- Mobile (< 768px): 하단 탭 네비게이션

---

## 7. 디렉토리 구조

```
k-gun/
├── app/                              # k-gun Control Panel (Next.js)
│   ├── src/
│   │   ├── app/                      # App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # → /dashboard redirect
│   │   │   ├── globals.css
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── strategy/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── presets/page.tsx
│   │   │   │   └── builder/page.tsx
│   │   │   ├── backtest/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── run/page.tsx
│   │   │   │   ├── results/page.tsx
│   │   │   │   └── optimize/page.tsx
│   │   │   ├── trading/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── signals/page.tsx
│   │   │   │   └── orders/page.tsx
│   │   │   ├── portfolio/
│   │   │   │   └── page.tsx
│   │   │   ├── chat/
│   │   │   │   └── page.tsx
│   │   │   ├── explorer/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui 컴포넌트
│   │   │   ├── layout/               # Sidebar, TopBar, StatusBar
│   │   │   ├── dashboard/            # 대시보드 위젯
│   │   │   ├── strategy/             # 전략 빌더 컴포넌트
│   │   │   ├── backtest/             # 백테스트 차트/지표
│   │   │   ├── trading/              # 호가창, 주문모달
│   │   │   ├── portfolio/            # 포트폴리오 차트/테이블
│   │   │   ├── chat/                  # AI 챗봇 (메시지, 스트리밍)
│   │   │   └── explorer/             # 종목 검색/상세
│   │   ├── hooks/                    # 커스텀 훅
│   │   ├── stores/                   # Zustand 스토어
│   │   │   ├── auth.ts
│   │   │   ├── strategy.ts
│   │   │   ├── backtest.ts
│   │   │   ├── trading.ts
│   │   │   ├── portfolio.ts
│   │   │   └── chat.ts
│   │   ├── lib/
│   │   │   ├── api/                  # API 클라이언트
│   │   │   ├── utils.ts              # 유틸리티
│   │   │   └── constants.ts          # 상수 (지표, 프리셋 등)
│   │   └── types/                    # TypeScript 타입
│   ├── public/
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── external/                         # 서브모듈
│   ├── open-trading-api/
│   └── kis-ai-extensions/
├── plans/                            # 설계 문서
└── ...
```

---

## 8. 컬러 & 디자인 시스템

### 컬러 팔레트

```
Primary:      #245bee (KIS Blue)
Primary Dark: #1a47b8
Primary Light:#4a7aff

수익 (상승):   #ef4444 (Red - 한국 주식 관례)
손실 (하락):   #3b82f6 (Blue - 한국 주식 관례)

Success:      #22c55e
Warning:      #f59e0b
Error:        #ef4444

Background:   #0f1117 (Dark), #ffffff (Light)
Surface:      #1a1d27 (Dark), #f8fafc (Light)
Border:       #2a2d3a (Dark), #e2e8f0 (Light)
```

### 다크 모드 우선
- 트레이딩 UI 특성상 다크 모드를 기본으로 설정
- 라이트 모드도 지원

---

## 9. 기존 코드 재사용 계획

### 그대로 가져올 것 (복사 후 수정)
| 항목 | 원본 경로 | 설명 |
|------|----------|------|
| TypeScript 타입 | strategy_builder/frontend/src/types/ | 모든 인터페이스 |
| API 클라이언트 | strategy_builder/frontend/src/lib/api/ | Fetch 래퍼 (경로만 수정) |
| 지표 상수 | strategy_builder/frontend/src/lib/builder/constants.ts | 80개 지표 정의 |
| 프리셋 전략 | strategy_builder/frontend/src/lib/builder/presets.ts | 10개 프리셋 |
| YAML 임포터 | strategy_builder/frontend/src/lib/builder/yamlImporter.ts | YAML 파싱 |
| 백테스트 타입 | backtester/frontend/src/types/ | 백테스트 관련 타입 |

### 재구현할 것 (로직 참고, UI 새로 작성)
| 항목 | 참고 원본 | 변경 사항 |
|------|----------|----------|
| 전략 빌더 위저드 | strategy_builder/builder/page.tsx | shadcn/ui 컴포넌트로 재작성 |
| 수익 곡선 차트 | backtester/backtest/EquityChart.tsx | Recharts 유지, 스타일 변경 |
| 호가창 | strategy_builder/execute/page.tsx | 대시보드 스타일로 재설계 |
| 주문 모달 | strategy_builder/execute/ | shadcn Dialog 기반 |
| 인증 플로우 | AuthContext.tsx | Zustand 스토어로 변환 |

---

## 10. AI 챗봇 (Claude Code 연동)

### 개요

Anthropic API를 별도로 사용하는 대신, 로컬에 설치된 **Claude Code CLI**를 Next.js API Route에서 직접 실행한다.
이미 설정된 KIS 스킬, MCP 서버, 보안 훅을 그대로 활용할 수 있어 별도 도구 구현이 불필요하다.

### 왜 Claude Code CLI인가

| 비교 | Anthropic API 직접 사용 | Claude Code CLI 활용 |
|------|----------------------|---------------------|
| KIS 스킬 | 직접 구현 필요 | ✅ 자동 트리거 |
| MCP 도구 | Tool Use로 직접 연결 | ✅ 이미 연결됨 |
| 보안 훅 | 직접 구현 필요 | ✅ kis-prod-guard 등 작동 |
| 슬래시 커맨드 | 불가 | ✅ /auth, /my-status 등 |
| 파일시스템 | 불가 | ✅ .kis.yaml 생성/읽기 |
| 인증 비용 | API 키 + 토큰 비용 | Claude Code 구독만으로 가능 |

### 구현 방식

#### 방법 A: CLI spawn (단순)

```typescript
// app/src/app/api/chat/route.ts
import { spawn } from 'child_process';

export async function POST(req: Request) {
  const { message, sessionId } = await req.json();

  const claude = spawn('claude', [
    '-p', message,
    '--output-format', 'stream-json',
  ], {
    cwd: '/Users/ted/WebstormProjects/k-gun',
  });

  // ReadableStream으로 스트리밍 응답
  const stream = new ReadableStream({
    start(controller) {
      claude.stdout.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      claude.stdout.on('end', () => controller.close());
      claude.stderr.on('data', (err) => {
        console.error('claude error:', err.toString());
      });
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

#### 방법 B: Claude Code SDK (권장)

```typescript
// app/src/app/api/chat/route.ts
import { query } from '@anthropic-ai/claude-code';

export async function POST(req: Request) {
  const { message } = await req.json();

  const response = await query({
    prompt: message,
    options: {
      cwd: '/Users/ted/WebstormProjects/k-gun',
    },
  });

  return Response.json({ result: response });
}
```

### 아키텍처

```
┌──────────────────────────────────────────────────────┐
│  웹 브라우저 (채팅 UI)                                  │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 사용자: "삼성전자 골든크로스 전략 백테스트 해줘"        │ │
│  │ AI: 골든크로스 전략을 생성하고 백테스트를 실행합니다... │ │
│  │     📊 총수익률: +12.3%, 샤프비율: 1.45              │ │
│  └──────────────────────────────────────────────────┘ │
└───────────────┬──────────────────────────────────────┘
                │ POST /api/chat (스트리밍)
                ▼
┌──────────────────────────────────────────────────────┐
│  Next.js API Route (/api/chat)                        │
│  claude -p "삼성전자 골든크로스 전략 백테스트 해줘"       │
│  --output-format stream-json                          │
│  cwd: /Users/ted/WebstormProjects/k-gun               │
└───────────────┬──────────────────────────────────────┘
                │ Claude Code 프로세스 실행
                ▼
┌──────────────────────────────────────────────────────┐
│  Claude Code (로컬)                                    │
│                                                       │
│  ✅ .claude/skills/ → kis-strategy-builder 트리거      │
│  ✅ .claude/skills/ → kis-backtester 트리거            │
│  ✅ .claude/hooks/  → kis-secret-guard 작동            │
│  ✅ .mcp.json       → MCP 서버 연결                    │
│                                                       │
│  ┌─────────┐  ┌───────────┐  ┌───────────┐           │
│  │ Strategy│  │ Backtester│  │ MCP Server│           │
│  │  :8000  │  │   :8002   │  │   :3846   │           │
│  └─────────┘  └───────────┘  └───────────┘           │
└──────────────────────────────────────────────────────┘
```

### 채팅 UI 기능

- 마크다운 렌더링 (코드블록, 테이블, 차트 데이터)
- 스트리밍 응답 (실시간 타이핑 효과)
- 도구 실행 상태 표시 (백테스트 실행 중... 등)
- 대화 이력 유지 (세션 기반)
- 빠른 명령 버튼 ("잔고 확인", "전략 목록", "백테스트")
- 결과를 대시보드 위젯과 연동 (차트 데이터 → 차트 컴포넌트 렌더링)

### 사용 시나리오

```
사용자: "삼성전자 RSI 전략 만들어서 6개월 백테스트 해줘"

Claude Code 내부 동작:
  1. kis-strategy-builder 스킬 트리거
  2. RSI 전략 .kis.yaml 생성
  3. kis-backtester 스킬 트리거
  4. MCP 서버로 백테스트 실행
  5. 결과 요약 응답

응답: "RSI(14) 전략으로 삼성전자 6개월 백테스트 결과입니다:
       총수익률 +8.7%, 샤프비율 1.2, 최대낙폭 -5.3%
       승률 62%, 총 15회 거래..."
```

### 제약사항 & 고려사항

| 항목 | 설명 |
|------|------|
| 동시 요청 | claude 프로세스는 무거우므로 동시 요청 수 제한 필요 (큐잉) |
| 응답 시간 | CLI 콜드스타트 + 도구 실행으로 수초~수분 소요 가능 |
| 세션 관리 | `-p` 모드는 stateless, 대화 이력은 프론트에서 관리 |
| 비용 | Claude Code 구독 플랜의 사용량 제한 확인 필요 |
| 보안 | API Route에 인증 미들웨어 필수 (외부 접근 차단) |

### 기술 스택 추가

| 구분 | 기술 | 용도 |
|------|------|------|
| AI 연동 | @anthropic-ai/claude-code (SDK) 또는 CLI spawn | Claude Code 실행 |
| 스트리밍 | Server-Sent Events (SSE) | 실시간 응답 전달 |
| 마크다운 | react-markdown + remark-gfm | 응답 렌더링 |
| 코드 하이라이트 | shiki 또는 prism-react-renderer | 코드블록 표시 |

---

## 11. 구현 순서

### Phase 1: 기반 구축
1. Next.js 프로젝트 초기화 (app/ 디렉토리)
2. Tailwind + shadcn/ui 설정
3. 레이아웃 (Sidebar + TopBar + StatusBar)
4. API 프록시 설정 (next.config.ts rewrites)
5. Zustand 스토어 (auth)
6. 인증 연동 (모의/실전 로그인)
7. Claude Code SDK 검증 (API Route에서 동작 확인, 실패 시 CLI spawn fallback)

### Phase 2: 대시보드 + 포트폴리오
7. 대시보드 페이지 (잔고, 보유종목, 지수)
8. 포트폴리오 페이지 (상세 테이블, 차트)

### Phase 3: 전략 빌더
9. 프리셋 전략 브라우저
10. 커스텀 전략 빌더 (5단계 위저드)
11. YAML 프리뷰 + 코드 생성
12. 전략 가져오기/내보내기

### Phase 4: 백테스트
13. 백테스트 실행 페이지
14. 성과 차트 + 지표 대시보드
15. 파라미터 최적화
16. 배치 백테스트 비교

### Phase 5: 트레이딩
17. 실시간 호가창 (WebSocket)
18. 신호 생성 + 모니터링
19. 주문 실행/관리
20. 거래 로그

### Phase 6: AI 챗봇
21. Claude Code SDK 연동 (API Route)
22. 채팅 UI (스트리밍, 마크다운 렌더링)
23. 도구 실행 상태 표시
24. 빠른 명령 버튼 + 대시보드 위젯 연동

### Phase 7: 부가 기능
25. 종목 탐색기
26. 설정 페이지
27. 테마 전환 (다크/라이트)
28. 반응형 모바일 대응

---

## 12. 어드밴스드 피쳐

> 모든 데이터는 텍스트/JSON/CSV/마크다운 형태로 로컬에 저장되어
> Claude Code(AI 챗봇)에서 읽고 분석할 수 있어야 한다.

### 저장소 구조

```
k-gun/
├── data/
│   ├── watchlists/              # 워치리스트 (JSON)
│   │   └── {name}.json
│   ├── alerts/                  # 알림 규칙 + 이력 (JSON)
│   │   ├── rules.json
│   │   └── history/
│   │       └── {YYYYMMDD}.json
│   ├── journal/                 # 트레이딩 저널 (Markdown + JSON)
│   │   └── {YYYYMMDD}.md
│   ├── reports/                 # 리포트 (PDF, CSV, JSON)
│   │   ├── backtest/
│   │   ├── portfolio/
│   │   └── tax/
│   ├── strategies/              # 저장된 전략 파일
│   │   └── {name}.kis.yaml
│   ├── performance/             # 전략 성과 추적 (JSON)
│   │   └── {strategy_id}/
│   │       ├── live.json
│   │       └── backtest.json
│   ├── schedules/               # 자동 실행 스케줄 (JSON)
│   │   └── rules.json
│   └── market/                  # 시장 캘린더/뉴스 캐시 (JSON)
│       ├── calendar.json
│       └── news/
```

### 12.1 워치리스트 & 알림 시스템

#### 워치리스트
- 다중 워치리스트 생성/관리 ("반도체", "배당주", "단타" 등)
- 종목별 메모, 태그, 목표가 설정
- 실시간 가격 갱신 (폴링 or WebSocket)
- 워치리스트 간 종목 이동/복사

#### 조건부 알림
- 가격 알림: 목표가 도달, 등락률 임계값
- 지표 알림: RSI 과매수/과매도, MACD 크로스, 볼린저밴드 돌파
- 전략 알림: 신호 변경 (HOLD→BUY, HOLD→SELL)
- 포트폴리오 알림: 손실률 한도, 비중 초과

#### 알림 채널
- 웹 UI 토스트/뱃지
- Telegram Bot 연동
- Slack Webhook 연동
- 브라우저 Push Notification

#### 데이터 포맷
```json
// data/watchlists/반도체.json
{
  "name": "반도체",
  "created": "2026-04-04",
  "stocks": [
    {
      "code": "005930",
      "name": "삼성전자",
      "memo": "AI 반도체 수혜주",
      "target_buy": 55000,
      "target_sell": 75000,
      "tags": ["대형주", "반도체"]
    }
  ]
}

// data/alerts/rules.json
{
  "rules": [
    {
      "id": "alert_001",
      "type": "price",
      "stock": "005930",
      "condition": "price >= 75000",
      "channels": ["web", "telegram"],
      "active": true
    },
    {
      "id": "alert_002",
      "type": "indicator",
      "stock": "005930",
      "condition": "rsi_14 <= 30",
      "channels": ["web"],
      "active": true
    }
  ]
}
```

### 12.2 차트 뷰어

#### 캔들스틱 차트
- 일봉/주봉/월봉 전환
- 확대/축소, 드래그 스크롤
- 거래량 바 차트 (하단)

#### 기술지표 오버레이
- 이동평균선 (SMA, EMA, 사용자 설정 기간)
- 볼린저밴드
- MACD (별도 패널)
- RSI (별도 패널)
- 스토캐스틱, ATR, OBV 등 선택 추가
- 지표별 on/off 토글

#### 매매 마커
- 백테스트 매수/매도 포인트 오버레이
- 실전 주문 이력 표시

#### 기술 스택
| 라이브러리 | 용도 |
|-----------|------|
| lightweight-charts (TradingView) | 고성능 캔들스틱 차트 |
| 또는 Recharts 확장 | 기존 스택 활용 |

### 12.3 트레이딩 저널

#### 자동 기록
- 주문 체결 시 자동으로 일지 항목 생성
- 체결가, 수량, 전략명, 신호 강도 자동 기입
- 당일 손익 요약

#### 수동 기록
- 매매 이유, 심리 상태, 시장 상황 메모
- 태그 (실수, 좋은매매, 감정매매, 원칙준수 등)
- 스크린샷/차트 캡처 첨부

#### 복기 기능
- 주간/월간 리뷰 자동 생성
- 태그별 통계 (감정매매 비율, 원칙준수율)
- 승률/손익비 추이

#### 데이터 포맷 (마크다운 — AI 분석 최적)
```markdown
<!-- data/journal/20260404.md -->
# 2026-04-04 트레이딩 저널

## 시장 상황
- 코스피 5,377.30 (+2.74%)
- 미국 시장 영향: 나스닥 강세

## 매매 기록

### 1. 삼성전자 매수
- **시간**: 09:15:32
- **전략**: 골든크로스 (SMA 5/20)
- **신호 강도**: 0.82
- **체결가**: 68,500원 × 10주
- **판단**: 단기 이평선 골든크로스 확인, 거래량 증가
- **태그**: #원칙준수 #추세추종

### 2. SK하이닉스 매도
- **시간**: 14:22:10
- **전략**: RSI 과매수
- **신호 강도**: 0.71
- **체결가**: 195,000원 × 5주
- **수익**: +12,500원 (+1.3%)
- **판단**: RSI 75 돌파 후 하락 반전 시작
- **태그**: #좋은매매 #역추세

## 오늘의 반성
- 오전 급등장에서 추격매수 충동을 잘 억제함
- SK하이닉스 매도 타이밍이 적절했음

## 당일 요약
| 항목 | 값 |
|------|-----|
| 총 매매 | 2건 |
| 실현 손익 | +12,500원 |
| 승률 | 1/1 (100%) |
```

### 12.4 리스크 대시보드

#### 포트폴리오 리스크 지표
- VaR (Value at Risk) — 95%, 99% 신뢰구간
- 최대 손실 시나리오 (히스토리컬 시뮬레이션)
- 포트폴리오 베타 (vs 코스피)
- 변동성 (일간, 연환산)

#### 종목별 분석
- 종목별 비중 (도넛 차트)
- 섹터별 노출도 (바 차트)
- 단일 종목 집중도 경고 (비중 30% 초과 시)

#### 상관관계 매트릭스
- 보유종목 간 상관계수 히트맵
- 분산 효과 점수
- 과도한 상관 경고 (0.8 이상)

#### 데이터 포맷
```json
// 리스크 분석 결과 — AI 챗봇에서 "내 포트폴리오 리스크 분석해줘"로 조회 가능
{
  "date": "2026-04-04",
  "portfolio_var_95": -350000,
  "portfolio_var_99": -520000,
  "portfolio_beta": 1.12,
  "volatility_annual": 0.23,
  "concentration": {
    "max_stock": { "code": "005930", "weight": 0.35, "warning": true },
    "sector_exposure": { "반도체": 0.55, "바이오": 0.20, "금융": 0.25 }
  },
  "correlation_warnings": [
    { "pair": ["005930", "000660"], "correlation": 0.87, "warning": "높은 상관" }
  ]
}
```

### 12.5 전략 성과 추적

#### 실전 vs 백테스트 비교
- 동일 전략의 백테스트 수익률 vs 실전 수익률
- 괴리율 추적 (슬리피지, 체결 지연 영향)
- 전략별 일간 수익률 시계열

#### 전략 리더보드
- 활성 전략 목록 + 실시간 성과
- 순위 (샤프비율, 총수익률, 낙폭 기준)
- 전략 활성화/비활성화

#### 데이터 포맷
```json
// data/performance/golden_cross/live.json
{
  "strategy_id": "golden_cross",
  "start_date": "2026-03-01",
  "trades": [
    {
      "date": "2026-03-15",
      "stock": "005930",
      "action": "BUY",
      "price": 65000,
      "quantity": 10,
      "signal_strength": 0.85
    }
  ],
  "daily_returns": [
    { "date": "2026-03-15", "return": 0.012 },
    { "date": "2026-03-16", "return": -0.003 }
  ],
  "metrics": {
    "total_return": 0.087,
    "sharpe": 1.2,
    "max_drawdown": -0.053,
    "vs_backtest_gap": 0.015
  }
}
```

### 12.6 자동 실행 스케줄러

#### 스케줄 타입
- **신호 체크**: 매일 08:50 (장 시작 전) 전략 신호 확인 → 알림
- **자동 주문**: 신호 강도 0.7 이상이면 자동 모의투자 주문
- **리포트**: 매주 금요일 16:00 주간 성과 리포트 생성
- **데이터 수집**: 매일 18:00 마스터 파일 갱신

#### 실행 방식
- Next.js Cron (Vercel) 또는 로컬 node-cron
- Claude Code CLI를 호출하여 자연어 명령 실행도 가능
  - 예: `claude -p "오늘 모든 워치리스트 종목 신호 확인해줘"`

#### 안전장치
- 실전 자동주문은 반드시 사용자 확인 (kis-prod-guard)
- 일일 최대 주문 횟수 제한
- 실행 로그 전량 기록

#### 데이터 포맷
```json
// data/schedules/rules.json
{
  "schedules": [
    {
      "id": "morning_signal",
      "name": "장 시작 전 신호 체크",
      "cron": "50 8 * * 1-5",
      "action": "check_signals",
      "params": {
        "watchlist": "반도체",
        "strategy": "golden_cross"
      },
      "notify": ["web", "telegram"],
      "active": true
    },
    {
      "id": "weekly_report",
      "name": "주간 성과 리포트",
      "cron": "0 16 * * 5",
      "action": "generate_report",
      "params": { "type": "weekly", "format": "markdown" },
      "active": true
    }
  ]
}
```

### 12.7 포지션 사이징 계산기

#### 사이징 방법
- **고정 금액**: 매매당 고정 금액 (예: 100만원)
- **고정 비율**: 총 자산의 N% (예: 5%)
- **변동성 기반**: ATR 기반 포지션 크기 조절
- **켈리 기준**: 승률과 손익비로 최적 비율 산출

#### 입력값
- 계좌 잔고 (자동 연동)
- 전략 승률, 평균 손익비 (백테스트 결과 연동)
- 손절 가격 / 비율
- 최대 포트폴리오 비중

#### 출력
- 권장 수량
- 예상 최대 손실
- 리스크/리워드 비율

### 12.8 전략 비교 대시보드

- 2~5개 전략 성과를 나란히 비교
- 수익 곡선 오버레이 차트
- 지표 비교 테이블 (샤프, MDD, 승률, 수익률)
- 구간별 성과 비교 (상승장/하락장/횡보장)
- 비교 결과 저장 (JSON/CSV)

### 12.9 PDF 리포트 내보내기

#### 리포트 유형
- **백테스트 리포트**: 전략 설명, 파라미터, 성과 차트, 매매 목록
- **포트폴리오 리포트**: 보유종목, 수익률, 리스크 지표, 섹터 분석
- **주간/월간 리뷰**: 매매 요약, 손익, 전략별 기여도
- **세금 리포트**: 양도소득 계산 보조 (매매 이력 기반)

#### 기술
- react-pdf 또는 @react-pdf/renderer 사용
- 차트는 서버사이드 렌더링 후 이미지로 삽입

### 12.10 시장 캘린더

- 배당락일, 권리락일
- 실적 발표일 (분기별)
- 경제지표 발표 일정 (금리 결정, CPI, 고용지표)
- IPO/공모주 일정
- 휴장일

#### 데이터 포맷
```json
// data/market/calendar.json
{
  "events": [
    {
      "date": "2026-04-10",
      "type": "earnings",
      "stock": "005930",
      "name": "삼성전자 1분기 실적발표",
      "importance": "high"
    },
    {
      "date": "2026-04-15",
      "type": "economic",
      "name": "한국은행 기준금리 결정",
      "importance": "high"
    }
  ]
}
```

### 12.11 섹터/업종 분석

- 업종별 등락률 히트맵
- 섹터 로테이션 차트 (모멘텀 vs 상대강도)
- 업종 내 종목 비교
- 보유종목의 섹터 편중 분석

### 12.12 뉴스 피드

- 보유종목/워치리스트 종목 관련 뉴스
- 주요 시장 뉴스
- 뉴스 감성 분석 (AI 챗봇 연동)
  - "오늘 삼성전자 뉴스 분석해줘" → Claude가 뉴스 요약 + 영향 분석
- 뉴스 캐시 저장 (JSON)

### 12.13 멀티 계좌

- 모의투자 / 실전투자 계좌 동시 관리
- 계좌별 독립 포트폴리오 뷰
- 계좌 간 전략 성과 비교
- 빠른 계좌 전환 (드롭다운)

---

### 구현 우선순위

| Phase | 피쳐 | 근거 |
|-------|------|------|
| **Phase 8** | 워치리스트 & 알림, 차트 뷰어 | 트레이딩 기본 도구 |
| **Phase 9** | 트레이딩 저널, 리스크 대시보드 | 전문가 필수 |
| **Phase 10** | 전략 성과 추적, 자동 스케줄러 | 자동화 완성 |
| **Phase 11** | 포지션 사이징, 전략 비교, PDF 리포트 | 분석 도구 |
| **Phase 12** | 시장 캘린더, 섹터 분석, 뉴스, 멀티계좌 | 부가 정보 |

---

### AI 챗봇 연동 시나리오

모든 데이터가 텍스트/JSON/마크다운으로 저장되므로 Claude Code에서 직접 활용 가능:

```
사용자: "이번 주 트레이딩 저널 분석해줘"
→ Claude가 data/journal/20260401~04.md 읽고 패턴 분석

사용자: "내 포트폴리오 리스크 분석해줘"
→ 보유종목 조회 → 상관관계 계산 → data/에 결과 저장 → 요약 응답

사용자: "지난 달 골든크로스 전략 실전 성과 보여줘"
→ data/performance/golden_cross/live.json 읽고 시각화

사용자: "다음 주 실적발표 일정 알려줘"
→ data/market/calendar.json 조회 → 필터링 → 응답

사용자: "감정매매 비율이 얼마나 돼?"
→ data/journal/*.md에서 태그 통계 → 분석 리포트 생성
```

---

## 13. 성능 & 캐싱 & 데이터베이스

### 기술 스택 추가

| 구분 | 기술 | 용도 |
|------|------|------|
| DB | SQLite (better-sqlite3) | 로컬 영구 저장, 단일 파일 |
| ORM | Drizzle ORM | 타입세이프 쿼리, 경량, SQL 친화적 |
| API 캐시 (프론트) | TanStack Query | API 캐싱 + 자동 갱신 + 쿼리 무효화 |
| 서버 캐시 | lru-cache (LRU Map) | API Route 레벨 응답 캐시 |

### 캐싱 레이어 구조

```
┌─ 브라우저 ──────────────────────────────────────┐
│                                                  │
│  TanStack Query Cache                            │
│  ├── 시세 데이터: staleTime 5s, refetch 5s       │
│  ├── 잔고/보유종목: staleTime 30s, refetch 30s   │
│  ├── 전략 목록: staleTime 5min                   │
│  ├── 지수: staleTime 10s, refetch 10s            │
│  └── 주문 후: invalidateQueries(['holdings'])    │
│                                                  │
│  Zustand (UI 상태만, 캐시 아님)                    │
│                                                  │
└────────────────┬─────────────────────────────────┘
                 │ fetch
┌────────────────▼─────────────────────────────────┐
│  Next.js API Route                                │
│                                                   │
│  LRU Cache (서버 메모리)                           │
│  ├── 시세: TTL 3s (KIS API 부하 감소)             │
│  ├── 종목 마스터: TTL 24h                         │
│  ├── 전략 목록: TTL 10min                         │
│  └── 백테스트 결과: TTL 1h                        │
│                                                   │
│  SQLite (영구 저장)                                │
│  ├── 백테스트 결과 캐시 (동일 파라미터 재실행 방지) │
│  ├── 일별 시세 스냅샷 (차트용 히스토리)             │
│  └── 아래 DB 스키마 참조                           │
│                                                   │
└────────────────┬─────────────────────────────────┘
                 │ proxy
┌────────────────▼─────────────────────────────────┐
│  Python 백엔드 (기존 캐시 유지)                    │
│  ├── 계좌 정보: 30초 TTL                          │
│  ├── 미체결 주문: 5초 TTL                         │
│  └── 체결 후 15초 유예 (낙관적 업데이트)            │
└──────────────────────────────────────────────────┘
```

### TanStack Query 캐시 전략

```typescript
// 시세 — 5초마다 자동 갱신
useQuery({
  queryKey: ['price', stockCode],
  queryFn: () => fetchPrice(stockCode),
  staleTime: 5_000,
  refetchInterval: 5_000,
});

// 잔고 — 30초 캐시, 주문 후 즉시 갱신
useQuery({
  queryKey: ['holdings'],
  queryFn: fetchHoldings,
  staleTime: 30_000,
});

// 주문 실행 후 관련 쿼리 무효화
useMutation({
  mutationFn: executeOrder,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['holdings'] });
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
  },
});

// 백테스트 결과 — 오래 캐시 (동일 파라미터면 재사용)
useQuery({
  queryKey: ['backtest', strategyId, symbols, startDate, endDate, params],
  queryFn: () => runBacktest({ strategyId, symbols, startDate, endDate, params }),
  staleTime: Infinity,  // 수동 무효화 전까지 유지
  gcTime: 60 * 60_000,  // 1시간 후 GC
});
```

### SQLite 데이터베이스

#### DB 파일 위치

```
k-gun/
├── data/
│   └── k-gun.db          # SQLite 단일 파일
```

#### 왜 SQLite인가

| 비교 | JSON 파일 | SQLite |
|------|----------|--------|
| 검색 | 전체 파일 읽기 | 인덱스 쿼리 |
| 동시 접근 | 충돌 위험 | WAL 모드로 안전 |
| 관계 쿼리 | 불가 | JOIN, GROUP BY |
| 백업 | 파일 복사 | 단일 파일 복사 |
| Claude Code 접근 | 파일 읽기 | `sqlite3 k-gun.db "SELECT ..."` |
| 용량 | 파일당 오버헤드 | 압축 효율적 |

#### 스키마 설계

```sql
-- 워치리스트
CREATE TABLE watchlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE watchlist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  watchlist_id INTEGER REFERENCES watchlists(id) ON DELETE CASCADE,
  stock_code TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  memo TEXT,
  target_buy REAL,
  target_sell REAL,
  tags TEXT,  -- JSON array
  added_at TEXT DEFAULT (datetime('now'))
);

-- 알림
CREATE TABLE alert_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,  -- 'price', 'indicator', 'strategy', 'portfolio'
  stock_code TEXT,
  condition TEXT NOT NULL,  -- JSON: {"field": "price", "op": ">=", "value": 75000}
  channels TEXT NOT NULL,   -- JSON array: ["web", "telegram"]
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE alert_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER REFERENCES alert_rules(id),
  triggered_at TEXT DEFAULT (datetime('now')),
  message TEXT,
  acknowledged INTEGER DEFAULT 0
);

-- 트레이딩 저널
CREATE TABLE journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  stock_code TEXT,
  stock_name TEXT,
  action TEXT,  -- 'BUY', 'SELL'
  strategy TEXT,
  signal_strength REAL,
  price REAL,
  quantity INTEGER,
  profit_loss REAL,
  profit_rate REAL,
  reason TEXT,
  emotion TEXT,
  tags TEXT,  -- JSON array: ["원칙준수", "추세추종"]
  memo TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE journal_daily_summary (
  date TEXT PRIMARY KEY,
  total_trades INTEGER,
  realized_pnl REAL,
  win_count INTEGER,
  loss_count INTEGER,
  market_note TEXT,
  reflection TEXT
);

-- 매매 이력
CREATE TABLE trade_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  date TEXT NOT NULL,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  action TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  amount REAL NOT NULL,
  fee REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  strategy_id TEXT,
  signal_strength REAL,
  mode TEXT NOT NULL,  -- 'vps', 'prod'
  created_at TEXT DEFAULT (datetime('now'))
);

-- 전략 성과 추적
CREATE TABLE strategy_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy_id TEXT NOT NULL,
  date TEXT NOT NULL,
  daily_return REAL,
  cumulative_return REAL,
  trade_count INTEGER DEFAULT 0,
  mode TEXT NOT NULL,  -- 'live', 'backtest'
  UNIQUE(strategy_id, date, mode)
);

CREATE TABLE strategy_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy_id TEXT NOT NULL,
  date TEXT NOT NULL,
  stock_code TEXT NOT NULL,
  action TEXT NOT NULL,
  price REAL,
  quantity INTEGER,
  signal_strength REAL,
  mode TEXT NOT NULL
);

-- 백테스트 결과 캐시
CREATE TABLE backtest_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT NOT NULL UNIQUE,  -- hash(strategy_id + symbols + dates + params)
  strategy_id TEXT NOT NULL,
  symbols TEXT NOT NULL,  -- JSON array
  start_date TEXT,
  end_date TEXT,
  params TEXT,  -- JSON
  result TEXT NOT NULL,  -- JSON (전체 결과)
  created_at TEXT DEFAULT (datetime('now'))
);

-- 스케줄
CREATE TABLE schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cron TEXT NOT NULL,
  action TEXT NOT NULL,
  params TEXT,  -- JSON
  notify_channels TEXT,  -- JSON array
  active INTEGER DEFAULT 1,
  last_run TEXT,
  next_run TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE schedule_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER REFERENCES schedules(id),
  executed_at TEXT DEFAULT (datetime('now')),
  status TEXT NOT NULL,  -- 'success', 'error'
  result TEXT,
  error TEXT
);

-- 시장 캘린더
CREATE TABLE market_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'earnings', 'dividend', 'economic', 'ipo', 'holiday'
  stock_code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  importance TEXT DEFAULT 'medium'  -- 'low', 'medium', 'high'
);

-- 뉴스 캐시
CREATE TABLE news_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_code TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  url TEXT,
  sentiment TEXT,  -- 'positive', 'negative', 'neutral'
  published_at TEXT,
  cached_at TEXT DEFAULT (datetime('now'))
);

-- 인덱스
CREATE INDEX idx_journal_date ON journal_entries(date);
CREATE INDEX idx_journal_tags ON journal_entries(tags);
CREATE INDEX idx_trade_history_date ON trade_history(date);
CREATE INDEX idx_trade_history_stock ON trade_history(stock_code);
CREATE INDEX idx_strategy_perf ON strategy_performance(strategy_id, date);
CREATE INDEX idx_backtest_cache_key ON backtest_cache(cache_key);
CREATE INDEX idx_alert_history_date ON alert_history(triggered_at);
CREATE INDEX idx_news_stock ON news_cache(stock_code);
CREATE INDEX idx_market_events_date ON market_events(date);
```

#### Drizzle ORM 설정

```typescript
// app/src/lib/db/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const watchlists = sqliteTable('watchlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const journalEntries = sqliteTable('journal_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  stockCode: text('stock_code'),
  action: text('action'),
  strategy: text('strategy'),
  signalStrength: real('signal_strength'),
  price: real('price'),
  quantity: integer('quantity'),
  profitLoss: real('profit_loss'),
  tags: text('tags'),  // JSON
  memo: text('memo'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ... 나머지 테이블
```

#### Claude Code에서 DB 접근

```bash
# AI 챗봇에서 직접 쿼리 가능
sqlite3 data/k-gun.db "SELECT date, SUM(profit_loss) FROM journal_entries GROUP BY date ORDER BY date DESC LIMIT 7"

# 태그별 통계
sqlite3 data/k-gun.db "SELECT tags, COUNT(*), AVG(profit_rate) FROM journal_entries GROUP BY tags"

# 전략 성과 비교
sqlite3 data/k-gun.db "SELECT strategy_id, SUM(daily_return) FROM strategy_performance WHERE mode='live' GROUP BY strategy_id"
```

### 성능 최적화 정리

| 계층 | 기술 | TTL | 대상 |
|------|------|-----|------|
| 브라우저 | TanStack Query | 5s~무한 | 모든 API 응답 |
| Next.js 서버 | LRU Map | 3s~24h | 빈번한 시세/마스터 |
| Next.js 서버 | SQLite | 영구 | 백테스트, 이력, 저널 |
| Python 백엔드 | 내장 캐시 | 5~30s | 계좌/미체결 (기존) |
| Docker | Lean 데이터 | 영구 | 과거 시세 CSV |

---

## 14. 환경 변수

```env
# .env.local
NEXT_PUBLIC_STRATEGY_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKTEST_API_URL=http://localhost:8002
NEXT_PUBLIC_MCP_URL=http://localhost:3846
NEXT_PUBLIC_APP_PORT=3333
```

---

## 15. 개발 의사결정 사항

| 항목 | 결정 | 근거 |
|------|------|------|
| 배포 환경 | 로컬 전용 + Docker Compose | 백엔드 3개 + 프론트 한 줄 실행, 환경 격리 |
| 웹앱 인증 | 없음 (localhost 전용) | 1인 사용, KIS API 인증만으로 충분 |
| Rate Limit | 중앙 요청 큐 | 모든 API 호출이 큐를 통과, rate limit 초과 방지 |
| 서버 기동 | npm 스크립트 + concurrently | 개발 시 `pnpm dev` 하나로 전체 실행 |

### Rate Limit 중앙 큐

```typescript
// app/src/lib/api/queue.ts
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private interval = 200; // 모의: 200ms, 실전: 50ms

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve) => {
      this.queue.push(async () => {
        const result = await fn();
        resolve(result);
      });
      this.process();
    });
  }
}

export const kisQueue = new RequestQueue();
```

### 개발 모드 실행 (concurrently)

```json
// package.json (루트)
{
  "scripts": {
    "dev": "concurrently -n app,p1,p2,mcp -c blue,green,yellow,magenta \"pnpm --filter app dev\" \"cd external/open-trading-api/strategy_builder && ./start.sh\" \"cd external/open-trading-api/backtester && ./start.sh\" \"cd external/open-trading-api/backtester && bash scripts/start_mcp.sh\"",
    "dev:app": "pnpm --filter app dev",
    "dev:backend": "concurrently -n p1,p2,mcp \"cd external/open-trading-api/strategy_builder && ./start.sh\" \"cd external/open-trading-api/backtester && ./start.sh\" \"cd external/open-trading-api/backtester && bash scripts/start_mcp.sh\""
  }
}
```

### Docker Compose (프로덕션 실행)

```yaml
# docker-compose.yml
services:
  strategy-builder:
    build: ./external/open-trading-api/strategy_builder
    ports: ["8000:8000"]
    volumes:
      - ~/KIS/config:/root/KIS/config
    restart: unless-stopped

  backtester:
    build: ./external/open-trading-api/backtester
    ports: ["8002:8002"]
    volumes:
      - ~/KIS/config:/root/KIS/config
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped

  mcp-server:
    build: ./external/open-trading-api/backtester
    command: uv run python -m kis_mcp.server
    ports: ["3846:3846"]
    volumes:
      - ~/KIS/config:/root/KIS/config
    restart: unless-stopped

  app:
    build: ./app
    ports: ["3333:3333"]
    depends_on:
      - strategy-builder
      - backtester
      - mcp-server
    restart: unless-stopped
```

### 추가 검토 필요 사항

| 항목 | 상태 | 메모 |
|------|------|------|
| Claude Code SDK 검증 | 미검증 | `@anthropic-ai/claude-code`의 API Route 내 동작 확인 필요, 실패 시 CLI spawn fallback |
| 테스트 전략 | 결정 | MSW (API mock) + Playwright (E2E) 병행 |
| 에러 핸들링 | 소스 확보 | `.claude/commands/kis-help.md`에 EGW/OPSQ/OPSP 70개+ 코드 정리됨 → 매핑 테이블 생성 |
| DB 마이그레이션 | Drizzle Kit | `drizzle-kit generate` + `drizzle-kit migrate` |
| 타입 동기화 | 수동 복사 | 기존 프론트엔드 types/ 복사 후 API 프록시 경로에 맞게 수정 |
