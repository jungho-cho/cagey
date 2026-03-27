# Cagey — 케이지 연산 그리드 퍼즐 게임

> 앱 이름: **Cagey**
> 목표: 구글 광고(AdMob) 수익 월 200유로
> 타겟: 글로벌 (영어, 수학/퍼즐 좋아하는 성인)
> 플랫폼: 모바일 앱 (iOS + Android)

---

## 핵심 개념

"각 케이지(구역)에 적힌 목표값을 덧셈 또는 곱셈으로 만들어내는 그리드 퍼즐"

- KenKen/킬러스도쿠와 비슷하지만 **스도쿠 중복 불가 규칙 없음** → 더 자유롭고 접근하기 쉬움
- 연산은 **+ 와 × 만** (단순하게 유지)
- 케이지 안 숫자들의 합 또는 곱이 힌트와 일치하면 정답
- 레벨마다 그리드 크기 증가 (4×4 → 5×5 → 6×6 → 8×8)

---

## 게임 규칙

1. 그리드의 각 셀에 숫자를 채운다
2. 점선으로 묶인 케이지 안 숫자들을 케이지에 표시된 연산(+ 또는 ×)으로 계산
3. 결과가 케이지 힌트 숫자와 일치하면 정답
4. 스도쿠처럼 행/열 중복 제한 없음 (이 게임의 핵심 차별점)
5. 사용 가능한 숫자 범위는 레벨마다 다름 (예: 1-4, 1-6, 1-9)

### 예시 (4×4 그리드)
```
┌──────┬──────┐
│ 6+   │ 3×   │
│  2   │  1 3 │
├──────┼──────┤
│ 4×   │ 5+   │
│  1 4 │  2 3 │
└──────┴──────┘
```

---

## 핵심 기능 (MVP)

### 1. 게임 플레이
- 그리드 렌더링 (케이지 경계선 + 힌트 표시)
- 숫자 입력 (탭으로 셀 선택 → 숫자 키패드)
- 실시간 정답 체크 (케이지별 색상 피드백: 초록/빨강)
- 실수 취소 (Undo)
- 힌트 기능 (광고 시청 후 힌트 제공 — 리워드 광고 활용)

### 2. 레벨 구성
- Easy: 4×4, 덧셈만
- Medium: 5×5, 덧셈+곱셈
- Hard: 6×6, 덧셈+곱셈
- Expert: 8×8, 덧셈+곱셈

### 3. 광고
- 홈/레벨 선택 화면: 배너 광고 (AdMob)
- 레벨 클리어 후: 인터스티셜 광고 (3판마다 1번)
- 힌트 사용: 리워드 광고 (유저가 자발적으로 시청)

### 4. 데일리 챌린지
- 매일 새 퍼즐 1개 무료 제공
- 스트릭 카운터 (연속 접속 유도 → 리텐션)

---

## 수익 목표 계산

| 지표 | 목표값 |
|------|--------|
| DAU | 800명 |
| 인터스티셜 eCPM | $5 (글로벌 평균) |
| 리워드 광고 eCPM | $15 |
| 배너 eCPM | $0.5 |
| 월 예상 수익 | ~$180-250 (≈ 170-230유로) |

- 리워드 광고(힌트)는 유저가 막혔을 때 자연스럽게 시청 → 높은 eCPM 활용 가능
- 퍼즐 게임 특성상 세션 길이 길고, 레벨 클리어마다 광고 노출 자연스러움

---

## 기술 스택 (/autoplan 피벗 후 확정)

### Phase 1: 웹 먼저 (수요 검증)

| 영역 | 선택 | 이유 |
|------|------|------|
| 웹 프레임워크 | Vanilla JS 또는 Next.js | 빠른 프로토타입, SEO 가능 |
| 호스팅 | Vercel / Netlify | 무료 배포 |
| 공유 | URL 공유 (#42 결과 → 링크) | 앱보다 더 강력한 바이럴 |
| 광고 (웹) | Google AdSense (검증 후) | 최소 트래픽 필요 |

**검증 기준 (2주):** 공유 URL 클릭 100회 이상, 일방문자 50명 이상

### Phase 2: 앱 (검증 성공 후)

| 영역 | 선택 | 이유 |
|------|------|------|
| 앱 프레임워크 | **Flutter** | iOS 앱스토어 AI앱 거절 리스크 낮음, Dart 성능 우수 |
| 게임 렌더링 | Flutter CustomPainter or Widget Grid | 케이지 테두리 렌더링에 유리 |
| 광고 | AdMob (`google_mobile_ads`) | Flutter 공식 패키지 |
| 로컬 저장 | `shared_preferences` | AsyncStorage 대체 |
| 공유 | `share_plus` | 네이티브 공유 시트 |
| 퍼즐 생성 | 알고리즘 자동 생성 (Dart 포트) | 무한 레벨 |
| 배포 | Flutter 자체 빌드 | Expo 불필요 |
| 백엔드 | 없음 | 완전 오프라인 |

**서버 비용 0원** — 퍼즐 데이터 로컬 번들, 광고만 외부 연결

---

## 퍼즐 자동 생성 알고리즘

1. 그리드에 정답 숫자를 먼저 무작위 배치
2. 인접 셀들을 묶어 케이지 생성 (2-4셀)
3. 각 케이지에 연산(+ or ×) 랜덤 할당
4. 케이지 힌트값 = 정답 숫자들의 연산 결과
5. 난이도 조절: 케이지 크기, 그리드 크기, 연산 종류

→ 이론상 무한 레벨 자동 생성 가능, 콘텐츠 관리 부담 없음

---

## 디자인 방향

디자이너 없이 가능한 수준으로:

- 배경: 흰색 or 다크모드 진한 회색
- 케이지 경계: 굵은 선 vs 얇은 선으로 구분
- 셀 선택: 파란색 하이라이트
- 정답 케이지: 초록색 / 오답: 빨간색 테두리
- 숫자 폰트: 모노스페이스, 크고 명확하게
- 애니메이션: 클리어 시 간단한 파티클 효과만

**참고 레퍼런스:** Nonogram.com, Sudoku.com의 미니멀 UI

---

## 웹 UI 반응형 디자인 스펙 (2026-03-26 /plan-design-review 확정)

### 레이아웃 원칙: 플랫폼별 분리
- **웹**: 데스크탑 브라우저에 최적화된 2단 레이아웃 + 반응형
- **앱 (Flutter)**: 모바일 네이티브 레이아웃 (별도 구현)

### 브레이크포인트 3단계

| 구간 | 범위 | 레이아웃 |
|------|------|--------|
| 모바일 | < 768px | 현재 단일 컬럼 (변경 없음) |
| 태블릿 | 768px–1023px | 단일 컬럼, max-width 600px, 그리드 최대 500px |
| 데스크탑 | ≥ 1024px | **2단 분할** (아래 참고) |

### 데스크탑 레이아웃 (≥ 1024px)

```
┌─────────────────────────────────────────────┐
│  CAGEY          0:00          🔥2  ↩        │
│  ─────────────────────────────────────────  │
│  🔥Daily  Easy  Medium  Hard  Expert        │
├──────────────────────┬──────────────────────┤
│                      │                      │
│   퍼즐 그리드         │  [ 1 ][ 2 ][ 3 ]    │
│   (max 560px,        │  [ 4 ][ 5 ][ 6 ]    │
│    세로 뷰포트에       │  [ 7 ][ 8 ][ ⌫ ]    │
│    맞게 auto)         │                      │
│                      │  💡 Hint (3 left)    │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

- 전체 max-width: 1100px (중앙 정렬)
- 왼쪽 패널: 그리드 (flex: 1, 최소 400px)
- 오른쪽 패널: 넘패드 + 힌트 (고정 300px)
- 넘패드: 3×3 그리드 레이아웃 ([1][2][3] / [4][5][6] / [7][8][⌫]) — 전 난이도 동일
- 그리드 크기: `Math.min(panelHeight - padding, 560)` (데스크탑), 380px (모바일)

### 넘패드 처리
- **전 브레이크포인트에서 넘패드 표시** (마우스+키보드 모두 지원)
- 데스크탑에서는 넘패드를 3×N 그리드로 (현재 1행 → 3열 정렬)
- 키보드 입력 시 해당 버튼 하이라이트 (0.15s 애니메이션)

### 그리드 크기 계산
- 모바일 (<768px): `Math.min(window.innerWidth - 32, 380)` (기존 유지)
- 태블릿 (768–1023px): `Math.min(window.innerWidth - 64, 500)`
- 데스크탑 (≥1024px): `Math.min(leftPanelWidth - 48, 560)` (세로도 고려)

---

## 마일스톤 (/autoplan 피벗 후 확정)

### Phase 1: 웹 검증 (2주)

| 단계 | 내용 | 기간 |
|------|------|------|
| 1. 솔버 스파이크 | JS 백트래킹 솔버 + 8×8 벤치마크 | 2일 |
| 2. 웹 프로토타입 | 4×4 그리드 + 숫자 입력 + 정답 체크 | 3일 |
| 3. 공유 기능 | 결과 URL / 텍스트 공유 (Wordle 스타일) | 1일 |
| 4. 배포 + 론치 | Vercel 배포 → r/puzzles + HackerNews | 1일 |
| **검증 게이트** | **2주 후: DAU 50+, 공유 클릭 100+ → 앱 진행** | |

### Phase 2: Flutter 앱 (검증 성공 시, 5주)

| 단계 | 내용 | 기간 |
|------|------|------|
| 5. Flutter 코어 | 그리드 + Undo + 정답 체크 | 1주 |
| 6. 퍼즐 생성 | 자동생성 Dart 포트 + 솔버 | 1주 |
| 7. 광고 | AdMob 3종 (`google_mobile_ads`) | 3일 |
| 8. 데일리 챌린지 | mulberry32 시드 + 스트릭 | 3일 |
| 9. 출시 | App Store + Play Store + ASO | 1주 |

---

## 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| KenKen과 너무 비슷해 보임 | "스도쿠 규칙 없음" 을 마케팅 포인트로 강조 ("No row rules — just math") |
| 퍼즐 자동 생성 품질 낮음 | 초기 레벨 50-100개는 수동으로 검수 |
| 리텐션 낮음 | 데일리 챌린지 + 스트릭으로 매일 재방문 유도 |
| 앱스토어 경쟁 | "Cage puzzle + / ×" 키워드로 틈새 ASO 공략 |

---

## ASO 키워드 (앱스토어 최적화)

- cage puzzle game
- math puzzle no sudoku
- logic grid puzzle
- multiplication puzzle game
- addition puzzle brain

---

## 다음 할 일 (/autoplan 피벗 후 확정)

### 즉시 시작 (웹 먼저)

1. **[Spike]** 백트래킹 솔버 JS 구현 → `node benchmark.js` 로 8×8 < 2초 검증
2. HTML/CSS/JS 4×4 그리드 + 케이지 데이터 구조 설계
3. 케이지 테두리 렌더링 (CSS border per side)
4. 숫자 입력 + 실시간 정답 체크 (케이지 색상 피드백)
5. Wordle식 결과 공유 텍스트 생성
6. Vercel 배포 → r/puzzles, HackerNews Show HN 론치

### 검증 후 (Flutter 앱)

7. `flutter create cagey_app`
8. 솔버 Dart 포트
9. Flutter Widget 그리드 + CustomPaint 케이지 테두리
10. `google_mobile_ads` AdMob 연동
11. App Store / Play Store 제출

---

<!-- /autoplan restore point: /Users/junghocho/.gstack/projects/jungho-cho-cagey/master-autoplan-restore-20260327-093926.md -->

## /autoplan Review — 2026-03-27

**Mode:** SELECTIVE EXPANSION | **Voices:** Claude subagent [subagent-only, Codex unavailable]
**Design doc:** `junghocho-master-design-20260327-092155.md` (APPROVED)
**Premises confirmed:** P1 accepted (cage-only verification required), P2/P3 taste decisions deferred

---

### Phase 1: CEO Review (2026-03-27)

#### 0A. Premise Status

| # | Premise | Verdict | Risk |
|---|---------|---------|------|
| P1 | No row/col rules + hidden Latin square | **Code fix required** — cage-only uniqueness verification | CRITICAL |
| P2 | AdMob/AdSense → €200/month at DAU 800 | Reasonable for free-play; breaks if daily-only | MED |
| P3 | Wordle-style share works for math | Unvalidated — share artifact needs more story | HIGH |
| P4 | Web + Flutter parallel manageable | Code duplication already showing (index.html vs src/) | MED |
| P5 | Web validates demand before Flutter | Sound but design doc says "immediately" = parallel risk | MED |

#### 0B. Existing Code Leverage

Web prototype is **complete** with all MVP features:
- `src/solver.js` — Backtracking solver with Latin square pruning
- `src/generator.js` — Puzzle generator, mulberry32 PRNG seeded
- `src/gameState.js` — Game state + undo stack (UNDO_LIMIT=50)
- `src/expertBundle.json` — 53KB pre-generated expert puzzles
- `index.html` — Full game UI with responsive 3-breakpoint layout

#### 0C. Dream State

```
NOW (web MVP done)    →  2주 (웹 론칭)              →  12개월
──────────────────      ─────────────────────────      ──────────────────────
· Solver + generator    · Vercel deployed               · DAU 3,000-5,000
· 4 difficulty tiers    · GA4 + AdSense live            · €500+/month
· Daily + streak        · r/puzzles + HN launch         · Flutter/PWA on stores
· Responsive 3bp        · Share tracking active          · Remove Ads IAP
· Expert bundle         · 2-week validation data
```

#### 0D. Error & Rescue Registry

| Error | Trigger | User sees | Mitigation |
|-------|---------|-----------|------------|
| Hidden Latin-square rejection | Cage-valid but Latin-invalid answer | "Wrong" on correct-looking answer | **CRITICAL: cage-only uniqueness verification** |
| AdSense not approved at launch | Google review 2-4 weeks | No ads | Launch without ads |
| Share not tracked | No UTM on share URL | Can't measure virality | GA4 event + UTM |
| Daily puzzle collision | sha256 mod 500 | Repeat puzzle | 1.4 years before repeat |

#### 0E. Temporal Interrogation

```
Day 1-2:  Vercel deploy + GA4 + cage-only verification fix
Day 3-5:  r/puzzles, HN Show HN
Week 2:   GO/NO-GO: DAU ≥ 20 → proceed. < 20 → investigate
Week 3-8: Flutter OR PWA (taste decision)
Week 10+: Revenue starts
```

#### Failure Modes Registry

| Mode | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Player answer rejected by hidden constraint | Medium | **Game-breaking** | Cage-only verification |
| Zero viral traction | High | DAU <20 | Iterate share format |
| NYT copies format | Low | Existential | Ship fast, build community |
| Flutter = sunk cost before validation | Medium | Weeks wasted | Sequential gate (taste decision) |

#### CEO Dual Voice Consensus

```
CEO DUAL VOICES [subagent-only]:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Premises valid?                   ⚠️      N/A    PARTIAL
  2. Right problem to solve?           ✓       N/A    CONFIRMED
  3. Scope calibration correct?        ⚠️      N/A    DISAGREE*
  4. Alternatives sufficiently explored?⚠️     N/A    DISAGREE*
  5. Competitive/market risks covered? ⚠️      N/A    PARTIAL
  6. 6-month trajectory sound?         ⚠️      N/A    PARTIAL
═══════════════════════════════════════════════════════════════
*Daily-only launch + PWA as alternative flagged
```

#### NOT in Scope (CEO)
- 뺄셈/나눗셈 연산자 (v2)
- 소셜 기능, 리더보드 (v2)
- 구독 모델 (v2)
- 유저 퍼즐 생성 (v2+)

#### CEO Completion Summary
- **Critical fix:** Hidden Latin-square constraint — cage-only uniqueness verification
- **Subagent concerns:** Daily-only launch, sequential gate, PWA underexplored
- **Auto-approved:** Ship web this week, GA4 tracking, UTM on shares
- **Taste decisions:** (1) Sequential vs parallel Flutter, (2) PWA vs Flutter for mobile

**Phase 1 complete.** Claude subagent: 9 findings (2 critical, 5 high, 2 medium). Consensus: 1/6 confirmed, 5 partial/disagree.

---

### Phase 2: Design Review (2026-03-27)

#### Design Scope Assessment: 8/10 (실제 코드 구현됨)

index.html에 전체 UI 구현 완료. 3 브레이크포인트 반응형. No DESIGN.md exists.

#### Design Litmus Scorecard

```
DESIGN LITMUS [subagent-only]:
═══════════════════════════════════════════════════════════════
  Dimension                    Score  Issues
  ──────────────────────────── ─────── ──────────────────────
  1. Information hierarchy      6/10   No onboarding; streak badge noise
  2. Interaction states         4/10   alert()/confirm() for errors;
                                       no empty-selection state
  3. User journey / emotion     5/10   Flat mid-puzzle; no progression nudge
  4. Specificity of decisions   7/10   Plan/code disagree on typography
  5. AI slop risk               6/10   Default Tailwind palette
  6. Responsive / viewport      8/10   user-scalable=no is a11y violation
  7. Accessibility              3/10   No ARIA, color-only, no focus styles
═══════════════════════════════════════════════════════════════
OVERALL: 39/70
```

**Pass 1 — Information Hierarchy (6/10):**
- 첫 방문자에게 게임 설명 없음 — 빈 그리드만 보임
- 스트릭 뱃지가 0일 때도 표시 (의미 없는 노이즈)
- 케이지 힌트 라벨 8×8에서 ~9px — 읽기 어려움
- **Auto-fix:** 첫 방문 온보딩 오버레이 추가, 스트릭 0일 때 뱃지 숨김, 힌트 최소 크기 보장

**Pass 2 — Interaction States (4/10):**
- `alert()`/`confirm()` 사용 (에러, 데일리 이미 풀림) — 네이티브 다이얼로그 2연속
- 셀 미선택 시 넘패드 활성화되어 있지만 아무 동작 안 함
- 페이지 새로고침 시 진행상황 소실
- **Auto-fix:** 인앱 UI로 교체, 미선택 시 넘패드 비활성화, localStorage 저장

**Pass 3 — User Journey (5/10):**
- 첫 5초가 죽은 시간 — 환영/설명 없음
- 퍼즐 중간에 긍정 피드백 없음 (케이지 완성 시 애니메이션 없음)
- 클리어 후 다음 난이도 제안 없음
- **Auto-fix:** 케이지 완성 시 미세 펄스 애니메이션, 클리어 모달에 난이도 업 제안

**Pass 4 — Specificity (7/10):**
- 플랜은 "모노스페이스" 지정, 코드는 시스템 sans-serif 사용 — 불일치
- 클리어 애니메이션 "파티클 효과" 계획 but 미구현
- **Auto-fix:** tabular-nums 사용, 클리어 시 간단한 축하 애니메이션

**Pass 5 — AI Slop Risk (6/10):**
- Tailwind 기본 색상 (#2563eb, #16a34a, #dc2626) — 브랜드 정체성 없음
- 클리어 모달이 Wordle 클론과 동일한 레이아웃
- **TASTE DECISION:** 브랜드 색상 커스터마이즈 여부

**Pass 6 — Responsive (8/10):**
- `user-scalable=no` — WCAG 1.4.4 위반
- 데스크탑 넘패드 고정 260px — 8×8에서 비례 맞지 않음
- **Auto-fix:** user-scalable=no 제거, touch-action: manipulation 사용

**Pass 7 — Accessibility (3/10):**
- **CRITICAL:** ARIA role/label 전무 — 스크린리더 사용 불가
- **CRITICAL:** 초록/빨강 색상만으로 피드백 — 색맹 사용자 구분 불가
- **CRITICAL:** focus 스타일 없음 — 키보드 사용자 현재 위치 파악 불가
- **CRITICAL:** 그리드 셀 tabindex 없음 — 키보드만으로 게임 시작 불가
- **Auto-fix:** ARIA 추가, ✓/✗ 아이콘으로 이중 피드백, :focus-visible 스타일, tabindex 추가

**Design Completion Summary:**
- 반응형: 잘 구현됨 (8/10), user-scalable 수정만 필요
- 접근성: 심각 (3/10) — ARIA, 색상, 포커스, 키보드 전반 수정 필요
- UX: 온보딩 없음, alert() 제거, 진행상황 저장 필요
- 브랜드: Tailwind 기본 색상 → taste decision

**Phase 2 complete.** 7 dimensions reviewed. 12 auto-fixes, 1 taste decision. Score: 39/70.

---

### Phase 3: Engineering Review (2026-03-27)

#### Step 0: Scope Challenge

Sub-problems mapped to existing code:

| Sub-problem | Existing code | Status |
|-------------|--------------|--------|
| Backtracking solver | `src/solver.js` + `index.html` inline | ✅ Built — **DUPLICATED** |
| Puzzle generator | `src/generator.js` + `index.html` inline | ✅ Built — **DUPLICATED** |
| Game state + undo | `src/gameState.js` + `index.html` inline | ✅ Built — **DUPLICATED** |
| Expert bundle | `src/expertBundle.json` (53KB) | ✅ Pre-generated |
| Grid rendering | `index.html` inline | ✅ Built, responsive |
| Daily challenge | `index.html` inline (mulberry32+UTC) | ✅ Built |
| Streak system | `index.html` inline (localStorage) | ✅ Built |
| Share text | `index.html` inline | ✅ Built |
| Benchmark | `scripts/benchmark.js` | ✅ Passes (avg 1162ms, 2/10 fallbacks) |
| Cage-only uniqueness | **DOES NOT EXIST** | ❌ CRITICAL GAP |

**Complexity check:** Code duplication (src/ vs index.html) is the primary architectural debt. The solver's hidden Latin-square constraint is the primary correctness risk.

#### Architecture ASCII Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Cagey Web App                             │
├────────────────┬──────────────────────┬─────────────────────┤
│  src/ (Node)   │  index.html (inline) │   External          │
│                │                      │                     │
│  solver.js ────┤── DUPLICATED ──────► │   localStorage      │
│  generator.js ─┤── DUPLICATED ──────► │     ├── streak      │
│  gameState.js ─┤── DUPLICATED ──────► │     └── dailyDate   │
│  expertBundle  │── INLINED ─────────► │                     │
│  .json (53KB)  │                      │   Clipboard API     │
│                │  UI Layer:           │     └── share text  │
│  benchmark.js  │  ├── Header+Timer    │                     │
│  (Node only)   │  ├── DifficultyChips │                     │
│                │  ├── Grid+CageBorder │                     │
│                │  ├── NumPad          │                     │
│                │  ├── HintButton      │                     │
│                │  ├── ClearModal      │                     │
│                │  └── AdPlaceholder   │                     │
└────────────────┴──────────────────────┴─────────────────────┘

⚠ CRITICAL: solver uses row/col Latin-square pruning (lines 87-89)
            but player has NO row/col constraints
            → cage-only uniqueness verification MISSING
```

#### Section 1: Architecture

- **Code duplication:** `src/` files and `index.html` inline copies diverge. Bug fixes must be applied in two places. The `src/` files serve only `benchmark.js` and the `package.json test` command.
- **Auto-decide (P5/explicit):** Add esbuild or similar bundler to eliminate duplication. Or remove `src/` and inline benchmark into HTML test mode.
- **Single-file architecture:** All UI in one 1100+ line HTML file. Acceptable for a side project MVP but will become unmaintainable if features grow.

#### Section 2: Code Quality

- **Solver correctness gap (CRITICAL):** `_solve()` at line 85-89 uses `rowUsed[row] & bit` and `colUsed[col] & bit` to prune. This means the solver finds solutions that are Latin squares. When verifying uniqueness (`stopAt=2`), it only counts Latin-square solutions. A puzzle could have:
  - 1 Latin-square solution (solver says "unique") ✓
  - 3 cage-arithmetic-only solutions (player perspective: ambiguous) ✗
  - **Player could fill in a cage-valid but Latin-invalid answer → game says "wrong"**
- **Naming:** Consistent use of "cage" throughout — no "group" vs "cage" confusion.
- **DRY violation:** `checkCage()` and game state logic exist in both `src/solver.js` and `index.html`. They could drift.

#### Section 3: Test Plan

**New UX flows and codepaths — full diagram:**

| # | Flow | Type | Exists? | Gap? | Auto-decision |
|---|------|------|---------|------|---------------|
| 1 | Solver: 4×4 unique solution | Unit | ❌ | YES | AUTO-APPROVE (P1) |
| 2 | Solver: 8×8 performance | Benchmark | ✅ | — | — |
| 3 | **Cage-only uniqueness verification** | Unit | ❌ | **CRITICAL** | AUTO-APPROVE (P1) |
| 4 | Generator: valid puzzle per difficulty | Unit | ❌ | YES | AUTO-APPROVE (P1) |
| 5 | Generator: seed determinism | Unit | ❌ | YES | AUTO-APPROVE (P1) |
| 6 | GameState: set + undo + status | Unit | ❌ | YES | AUTO-APPROVE (P1) |
| 7 | Daily: UTC date consistency | Unit | ❌ | YES | AUTO-APPROVE (P1) |
| 8 | Streak: increment/reset logic | Unit | ❌ | YES | AUTO-APPROVE (P1) |
| 9 | Share text format | Snapshot | ❌ | YES | AUTO-APPROVE (P1) |
| 10 | Expert bundle validation | Validation | ❌ | YES | AUTO-APPROVE (P1) |

Test plan artifact: `~/.gstack/projects/jungho-cho-cagey/junghocho-master-test-plan-20260327-094500.md`

**Benchmark results (actual run):**
```
8×8 Expert: avg 1162ms (budget <2000ms), 2/10 fallbacks needed
PASS with WARNINGS — expert bundle is essential
```

#### Section 4: Performance

- **Solver:** 8×8 avg 1162ms, max 2542ms. Expert bundle fallback covers worst cases.
- **Memory:** Undo stack capped at 50 (code verified: `UNDO_LIMIT = 50` in gameState.js line 7).
- **Re-render:** index.html re-renders entire grid on each cell change via `renderGrid()`. No virtual DOM. For 8×8 (64 cells), this means 64 DOM updates per keystroke. Acceptable for now, but noticeable lag possible on low-end devices.
- **Expert bundle:** 53KB JSON inlined in HTML. Adds to initial page load. Could be lazy-loaded.
- **No N+1:** No database, no network for puzzle data. Only localStorage for streak.

#### Eng Dual Voice Consensus

```
ENG DUAL VOICES [subagent-only]:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Architecture sound?               ⚠️      N/A    PARTIAL
     Code duplication src/ vs index.html
  2. Test coverage sufficient?         ⚠️      N/A    PARTIAL
     0 tests exist (only import check + benchmark)
  3. Performance risks addressed?      ✓       N/A    CONFIRMED
     Benchmark passes, expert bundle covers worst case
  4. Security threats covered?         ✓       N/A    CONFIRMED
     No server, no user data, localStorage only
  5. Error paths handled?              ⚠️      N/A    PARTIAL
     alert()/confirm() for errors (flagged in Design)
  6. Deployment risk manageable?       ✓       N/A    CONFIRMED
     Static HTML on Vercel = zero risk
═══════════════════════════════════════════════════════════════
```

#### Section 5: Additional Eng Subagent Findings (2026-03-27)

| # | Finding | Severity | Auto-decision |
|---|---------|----------|---------------|
| 21 | Main thread blocking (generate() up to 2.5s) | HIGH | AUTO-FIX: Web Worker (P1) |
| 22 | Multiplication pruning gap (no upper bound) | HIGH | AUTO-FIX: add bound check (P3) |
| 23 | Solution exposed on `currentPuzzle.solution` | HIGH | DEFER: accept for MVP (P6) |
| 24 | Latin square generator limited randomness | MEDIUM | DEFER: document limitation (P3) |
| 25 | innerHTML XSS pattern in share-preview | MEDIUM | AUTO-FIX: use textContent (P5) |
| 26 | `gameState.js` is dead code | MEDIUM | AUTO-FIX: delete or integrate (P5) |
| 27 | Daily seed predictable (no salt) | MEDIUM | DEFER: accept for offline game (P3) |
| 28 | No input validation on cell/value | MEDIUM | AUTO-FIX: add bounds check (P5) |

**Key insight from subagent:** `isPuzzleComplete()` only checks cage arithmetic — a non-Latin-square answer that satisfies all cages would be marked "SOLVED". But `solution[]` (used by hints) could differ. This creates an inconsistency where hints contradict the player's valid partial work.

#### NOT in Scope (Eng)

- Bundler setup (deferred — complexity not justified for 1 file)
- Dark mode (v1.1)
- Server-side puzzle generation
- WebSocket/real-time features

#### What Already Exists

Everything needed for web launch is built:
- Solver, generator, game state — all working
- 4 difficulty tiers with auto-generation
- Daily challenge with seeded PRNG
- Streak system with localStorage
- Share text generation (Wordle-style)
- Responsive 3-breakpoint layout
- Expert puzzle bundle (fallback for slow generation)

**Phase 3 complete.** Architecture diagram produced. Test plan written (10 gaps, 1 critical). Benchmark run: PASS with warnings.

---

### Decision Audit Trail (2026-03-27)

| # | Phase | Decision | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|
| 1 | CEO | Mode: SELECTIVE EXPANSION | P6 (action) | Side project with clear scope | SCOPE EXPANSION |
| 2 | CEO | Cage-only uniqueness verification: MUST FIX | P1 (completeness) | Player could find valid-looking answer rejected by hidden rules | Ship without fix |
| 3 | CEO | Ship web this week: AUTO-APPROVE | P6 (action) | Web is complete, delaying gains nothing | Wait for Flutter |
| 4 | CEO | GA4 + UTM tracking: AUTO-APPROVE | P1 (completeness) | Can't validate without measurement | Launch blind |
| 5 | CEO | Sequential vs parallel Flutter: TASTE DECISION | — | Subagent says sequential; user chose parallel | Surfaced at gate |
| 6 | CEO | PWA vs Flutter: TASTE DECISION | — | PWA = 2hr, Flutter = 5wk; iOS push works now | Surfaced at gate |
| 7 | Design | First-time onboarding: AUTO-FIX | P1 (completeness) | First-time bounce risk without explanation | No onboarding |
| 8 | Design | Replace alert()/confirm(): AUTO-FIX | P5 (explicit) | Native dialogs are jarring, no recovery | Keep alert() |
| 9 | Design | Numpad disabled when no cell selected: AUTO-FIX | P5 (explicit) | Pressing keys does nothing = confusing | Active numpad |
| 10 | Design | localStorage game state save: AUTO-FIX | P1 (completeness) | Losing progress on refresh = frustrating | No state save |
| 11 | Design | Cage completion micro-animation: AUTO-FIX | P1 (completeness) | Flat emotion curve mid-puzzle | No animation |
| 12 | Design | Difficulty progression nudge: AUTO-FIX | P2 (boil lakes) | No prompt to try harder levels | Static selection |
| 13 | Design | Remove user-scalable=no: AUTO-FIX | P1 (completeness) | WCAG violation | Keep viewport lock |
| 14 | Design | Add ARIA roles + labels: AUTO-FIX | P1 (completeness) | Screen readers can't navigate game | No ARIA |
| 15 | Design | Color-blind safe feedback (✓/✗ icons): AUTO-FIX | P1 (completeness) | 8% of male users affected | Color-only |
| 16 | Design | Focus styles + tabindex: AUTO-FIX | P1 (completeness) | Keyboard-only users blocked | No focus |
| 17 | Design | Hide streak badge when 0: AUTO-FIX | P5 (explicit) | Meaningless noise for first-timers | Always visible |
| 18 | Design | Brand color palette: TASTE DECISION | — | Default Tailwind vs custom palette | Surfaced at gate |
| 19 | Eng | All unit tests: AUTO-APPROVE | P1 (completeness) | 0 tests exist, 10 gaps identified | Defer tests |
| 20 | Eng | Code duplication: DEFER | P3 (pragmatic) | Bundler adds complexity for 1-file app | Add esbuild |

### Cross-Phase Themes

**Theme 1: Hidden Latin-Square Constraint** — CEO(CRITICAL, P1) + Eng(CRITICAL, Section 2). **Highest-confidence signal.**
The solver enforces row/col uniqueness that the player doesn't know about. Every generated puzzle must be verified to have a unique solution using ONLY cage arithmetic constraints. This is a game-breaking bug if not fixed.
→ **Must fix before web launch.** Write a cage-only solver (no row/col pruning) and run it during puzzle generation.

**Theme 2: Ship Speed** — CEO(P5 partial, subagent) + Eng(confirmed, deployment risk = 0). **High-confidence signal.**
The web prototype is complete. Every day of delay is a day someone else could launch a Wordle-for-math. Static HTML on Vercel = zero deployment risk. The cage-only verification fix is the only blocker.
→ **Ship immediately after cage-only fix.**

**Theme 3: Accessibility Debt** — Design(3/10, 4 critical findings) + Eng(error path handling). **Medium-confidence signal.**
No ARIA, no focus styles, color-only feedback, non-focusable cells. This blocks a segment of users and creates legal exposure. Not a launch blocker for a side project, but should be addressed in the first post-launch sprint.
→ **Fix in week 1-2 post-launch.**

## /autoplan Review — 2026-03-26

**Mode:** SELECTIVE EXPANSION | **Voices:** Claude subagent [subagent-only, Codex unavailable]
**Design doc:** `junghocho-unknown-design-20260326-112332.md` (APPROVED)
**Premises confirmed:** P1-P5 all accepted by user

---

### Phase 1: CEO Review

#### 0A. Premise Status

| # | Premise | Verdict | Risk |
|---|---------|---------|------|
| P1 | No row/col rules = more accessible | Accepted (unvalidated by users) | Med |
| P2 | RN View sufficient for cage borders | Accepted (4-side state logic needed) | Med |
| P3 | Backtracking solver fast enough | **Spike required** | High |
| P4 | AdMob-only MVP monetization | Accepted | Med |
| P5 | ASO + viral sharing = DAU 1,200+ | Optimistic but accepted | High |

#### 0B. Existing Code Leverage

New project — no existing codebase. Key ecosystem libraries:
- `react-native-google-mobile-ads` — AdMob
- `expo-sharing` — Native share sheet (built into Expo, zero cost)
- `@react-native-async-storage/async-storage` — Streak/state
- `expo-haptics` — Tactile feedback (zero cost, high polish)

#### 0C. Dream State

```
NOW                →  5주 (v1.0)                  →  12개월
────────────────      ─────────────────────────      ──────────────────────
Empty directory       · 4 difficulty tiers           · DAU 3,000-5,000
                      · Auto-gen + solver             · €500+/month
                      · AdMob 3 ad types              · Remove Ads IAP
                      · Daily challenge+streak        · Web/PWA version
                      · Viral share (Wordle-style)    · Press/Product Hunt
                      · DAU goal: 0 → 100-500
```

#### 0C-bis. Alternatives

Design doc explored 3 approaches (A/B/C), chose C (Viral-First). CEO analysis confirms correct. No better alternative at strategy level.

*Expansion opportunity flagged:* Web-first prototype before app — CEO subagent recommended this as acquisition validation. **TASTE DECISION #1** (see gate).

#### 0D. Error & Rescue Registry

| Error | Trigger | User sees | Mitigation |
|-------|---------|-----------|------------|
| Solver timeout | Complex 8×8 layout | App hangs | Pre-gen 500 Expert puzzles at build time |
| AdMob load failure | No internet | Hint disabled | Graceful "연결 필요" message |
| AsyncStorage corrupt | App crash/restore | Streak reset to 0 | Default to 0, no crash |
| Puzzle gen loop | Bad seed, no unique solution found | Infinite wait | Max 100 retry attempts then fallback bundle |

#### 0E. Temporal Interrogation

```
Hour 1:  create-expo-app → grid renders
Hour 6:  Cage border rendering — RISK (4-side state per cell)
Day 2:   Backtracking solver — CRITICAL PATH
Day 5:   8×8 spike benchmark (go/no-go for auto-gen)
Week 2:  AdMob account setup (3-7 days external approval)
Week 3:  Viral share + daily challenge
Week 5:  App Store submission (1-3 days review)
Week 6+: First organic downloads
```

#### Failure Modes Registry

| Mode | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Solver too slow for 8×8 | Medium | Expert unplayable | Pre-gen bundle fallback |
| Zero organic downloads 60 days | High | Revenue = 0 | Launch: Product Hunt + r/puzzles + HackerNews |
| Viral sharing doesn't convert | Medium | DAU stays <100 | Track share tap rate, iterate text format |
| App Store rejection | Low | Launch delay | AdMob policy compliance check pre-submission |

#### CEO Dual Voice Consensus

```
CEO DUAL VOICES [subagent-only]:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Premises valid?                   ⚠️      N/A    PARTIAL
  2. Right problem to solve?           ✓       N/A    CONFIRMED
  3. Scope calibration correct?        ✓       N/A    CONFIRMED
  4. Alternatives sufficiently explored?⚠️     N/A    DISAGREE*
  5. Competitive/market risks covered? ✓       N/A    CONFIRMED
  6. 6-month trajectory sound?         ⚠️      N/A    PARTIAL
═══════════════════════════════════════════════════════════════
*Subagent flags web-first as under-analyzed → TASTE DECISION #1
```

#### NOT in Scope (CEO phase)

- 뺄셈/나눗셈 연산자
- 소셜 기능 (리더보드, 친구 챌린지)
- 구독 모델
- Web/PWA 버전 (TASTE DECISION으로 사용자 결정)
- Remove Ads IAP (TASTE DECISION으로 사용자 결정)

#### CEO Completion Summary

- **Strategic direction:** Valid for side project. Core mechanic differentiated.
- **Critical risk:** DAU acquisition — no validated channel beyond ASO+viral
- **Subagent concern:** Web-first dismissed without analysis (valid point)
- **Auto-approved scope additions:** Tutorial/onboarding puzzle, App Store screenshot strategy
- **Taste decisions deferred to gate:** Web-first vs app-first, Remove Ads IAP in MVP

---

**Phase 1 complete.** Claude subagent: 4 issues (2 critical, 2 high). Consensus: 3/6 confirmed, 3 partial/disagree. Passing to Phase 2.

---

### Phase 2: Design Review

#### Design Scope Assessment: 7/10

PLAN.md mentions: 렌더링, 그리드, 셀, 화면, 키패드, 경계선, 색상. Design scope confirmed deep.
Design doc wireframe: 3 screens (Game, Clear+Share, Daily).
No DESIGN.md exists — no design system to constrain against.

#### Design Litmus Scorecard

```
DESIGN LITMUS [subagent-only]:
═══════════════════════════════════════════════════════════════
  Dimension                    Score  Issues
  ──────────────────────────── ─────── ──────────────────────
  1. Information hierarchy      7/10   Cage hint label (9px) may
                                       be unreadable on small phones
  2. Interaction states         5/10   Loading, empty, error states
                                       unspecified across all screens
  3. User journey / emotion arc 7/10   Share flow good; tutorial missing
  4. Specificity of decisions   6/10   "모노스페이스" font unspecified
  5. AI slop risk               8/10   Minimal UI avoids slop
  6. Responsive / viewport      6/10   Only mobile specified; no iPad
  7. Accessibility              3/10   Color-only feedback (green/red)
                                       not accessible; no touch targets
═══════════════════════════════════════════════════════════════
```

**Pass 1 — Information Hierarchy (7/10):**
- Game screen: grid → keypad order is correct (primary action at bottom)
- Cage hint label (9px font in wireframe) will be illegible on 320px screens
- **Auto-fix:** Minimum hint label 11px, cage size at least 60×60pt on 4×4

**Pass 2 — Interaction States (5/10):**
- Missing states identified: grid loading skeleton, empty puzzle (no cages defined), solver error, AdMob not loaded, daily puzzle already completed today
- **Auto-fix:** Add to plan: each screen needs loading/empty/error state specification

**Pass 3 — User Journey (7/10):**
- First-time user has NO onboarding — sees a blank 4×4 grid and doesn't know the rules
- Share flow (Wordle-style) is well-designed
- **Auto-fix:** First-launch tutorial puzzle required (3 pre-solved steps showing cage mechanic)

**Pass 4 — Design Specificity (6/10):**
- "모노스페이스 폰트" — which one? System monospace (Courier?) looks dated. JetBrains Mono or SF Mono (iOS system) is better.
- "파티클 효과" — what library? `react-native-confetti-cannon` is the standard
- **Auto-fix:** Specify: iOS → SF Mono, Android → Roboto Mono. Confetti via `react-native-confetti-cannon`

**Pass 5 — AI Slop Risk (8/10):**
- Minimal design direction is actually anti-slop. Grid + numbers is inherently clean.
- No issue.

**Pass 6 — Responsive / Viewport (6/10):**
- iPad not addressed. A 4×4 grid on iPad will look tiny/wrong.
- **Auto-decide (P3/pragmatic):** Constrain max grid width to 400pt, center on larger screens. No iPad-specific layout needed for MVP.

**Pass 7 — Accessibility (3/10):**
- **CRITICAL:** Green/red color-only feedback fails WCAG 2.1 for color-blind users (~8% of male users)
- No touch target specification (Apple HIG: 44×44pt minimum)
- No VoiceOver support specified
- **Auto-fix:** Add shape feedback: correct cage gets ✓ icon + green; incorrect gets border pulse animation, not just red color. Touch targets: cell size ≥ 44×44pt.

**Design Completion Summary:**
- Hierarchy: mostly right, hint label too small
- States: unspecified → add to plan
- Tutorial: missing → auto-approved addition
- Font: specify SF Mono / Roboto Mono
- Accessibility: color-blind fix required (shape + color, not color only)

**Phase 2 complete.** 7 dimensions reviewed. 5 auto-fixes applied to plan. 0 taste decisions. Passing to Phase 3.

---

### Phase 3: Engineering Review

#### Step 0: Scope Challenge

Sub-problems mapped to implementation:

| Sub-problem | Existing code | Status |
|-------------|--------------|--------|
| Grid rendering | None | New |
| Cage border logic | None | New — complex |
| Backtracking solver | None | New — highest risk |
| Auto-generation | None | New |
| Unique solution verification | None | New (solver dependency) |
| AdMob integration | `react-native-google-mobile-ads` | Library exists |
| Daily challenge seeding | None | New (mulberry32 PRNG) |
| AsyncStorage persistence | Library exists | Simple |
| Viral share text | `expo-sharing` | Simple |
| Undo stack | None | New |

**Complexity check:** High on solver + cage border rendering. Low on everything else.

#### Architecture ASCII Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Cagey App                            │
├─────────────┬───────────────────────────┬───────────────────┤
│  Screens    │      Core Services        │   External        │
│             │                           │                   │
│ HomeScreen  │  PuzzleGenerator          │  AdMob SDK        │
│   │         │    ├── SolutionPlacer     │    ├── Banner     │
│   ├─ Level  │    ├── CageGrouper        │    ├── Interstitial│
│   │  Select │    ├── OperationAssigner  │    └── Rewarded   │
│   │         │    └── UniqueSolver ◄─── │                   │
│ GameScreen  │         (backtracking)    │  expo-sharing     │
│   ├─ Grid   │                           │                   │
│   │  View   │  DailyChallenge           │  AsyncStorage     │
│   ├─ Cage   │    ├── mulberry32(date)   │                   │
│   │  Overlay│    └── SeedToPuzzle       │                   │
│   ├─ NumPad │                           │                   │
│   └─ Hint   │  GameState               │                   │
│             │    ├── UndoStack          │                   │
│ ClearScreen │    ├── CellValues         │                   │
│   ├─ Stats  │    └── CageStatus         │                   │
│   └─ Share  │                           │                   │
│             │  StreakManager            │                   │
│ DailyScreen │    └── AsyncStorage       │                   │
└─────────────┴───────────────────────────┴───────────────────┘

Data flow: PuzzleGenerator → GameState ← UserInput
           GameState → CageStatus → ClearScreen → ShareText
           DailyChallenge.seed(UTC_DATE) → PuzzleGenerator
```

#### Section 2: Code Quality

- **DRY:** `UniqueSolver` is used by both PuzzleGenerator (validation) and Hint system (finding answer cell) — correctly shared
- **Naming risk:** "cage" vs "group" — pick one, use consistently throughout
- **Complexity:** `CageGrouper` (flood-fill) and `UniqueSolver` (backtracking) are the two complex algorithms. Both should have pure-JS test harnesses before React Native integration.

#### Section 3: Test Plan

**New UX flows and codepaths:**

| Flow | Type | Test exists? | Gap? |
|------|------|-------------|------|
| Puzzle generation 4×4 | Unit (solver) | ❌ | YES |
| Puzzle generation 8×8 | Perf benchmark | ❌ | YES — critical |
| Unique solution verification | Unit | ❌ | YES |
| Cell tap + number entry | Integration | ❌ | YES |
| Undo stack (10 deep) | Unit | ❌ | YES |
| Cage status: correct/incorrect | Unit | ❌ | YES |
| Puzzle complete detection | Unit | ❌ | YES |
| Daily challenge same seed = same puzzle | Unit | ❌ | YES |
| Streak increment / reset | Unit | ❌ | YES |
| Share text format | Snapshot | ❌ | YES |
| AdMob load failure → hint disabled | Integration | ❌ | YES |
| AsyncStorage restore after kill | Integration | ❌ | YES |

**Auto-decide:** All unit tests → boil the lake (P1). Integration tests for AdMob → mock AdMob SDK, test state transitions. Perf benchmark → standalone Node.js script, not Jest.

#### Section 4: Performance

- **N+1 risk:** None (no database, no network for puzzle data)
- **Memory:** Undo stack capped at 50 entries max to prevent unbounded growth
- **Solver performance:** 8×8 with no row/col pruning is the only real risk — addressed by spike + fallback
- **Re-render:** GameState updates on every cell change — use `React.memo` on grid cells to prevent full re-render of all 64 cells on each keystroke

**Eng Dual Voice Consensus:**

```
ENG DUAL VOICES [subagent-only]:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ──────────────────────────────────── ─────── ─────── ─────────
  1. Architecture sound?               ✓       N/A    CONFIRMED
  2. Test coverage sufficient?         ⚠️      N/A    PARTIAL
  3. Performance risks addressed?      ✓       N/A    CONFIRMED
  4. Security threats covered?         ✓       N/A    CONFIRMED
  5. Error paths handled?              ✓       N/A    CONFIRMED
  6. Deployment risk manageable?       ✓       N/A    CONFIRMED
═══════════════════════════════════════════════════════════════
*Test coverage: no tests exist yet (new project) → test plan written
```

**NOT in scope (Eng):** Row/col uniqueness pruning (scope decision, not tech), iPad layout (deferred), dark mode (deferred v1.1)

**What already exists:** `expo-sharing`, `@react-native-async-storage`, AdMob SDK, `expo-haptics` — all installable, no custom code needed.

**Phase 3 complete.** Architecture diagram produced. Test plan written. 12 test gaps identified. All auto-decided (boil lake). 0 taste decisions from Eng phase.

---

### Decision Audit Trail

| # | Phase | Decision | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|
| 1 | CEO | Tutorial/onboarding puzzle: AUTO-APPROVE | P2 (boil lakes) | In blast radius, <1hr CC | Skip (bounce risk) |
| 2 | CEO | App Store screenshot strategy: AUTO-APPROVE | P2 | No-code, conversion lever | Defer |
| 3 | CEO | Web-first alternative: TASTE DECISION | — | Subagent disagrees with mobile-first | Surfaced at gate |
| 4 | CEO | Remove Ads IAP: TASTE DECISION | — | Builder mode, valid both ways | Surfaced at gate |
| 5 | Design | Hint label min 11px: AUTO-FIX | P5 (explicit) | Legibility is not a taste issue | 9px (illegible) |
| 6 | Design | Color-blind accessibility (shape+color): AUTO-FIX | P1 (completeness) | 8% of male users affected | Color-only |
| 7 | Design | SF Mono / Roboto Mono fonts: AUTO-FIX | P5 (explicit) | System fonts, zero cost | Generic monospace |
| 8 | Design | iPad: max 400pt centered, AUTO-DECIDE | P3 (pragmatic) | No separate layout needed | Full iPad layout |
| 9 | Eng | All unit tests: AUTO-APPROVE (boil lake) | P1 (completeness) | New project, no tests exist | Defer tests |
| 10 | Eng | Undo stack cap 50 entries: AUTO-FIX | P5 (explicit) | Prevent unbounded memory | Unlimited |
| 11 | Eng | React.memo on grid cells: AUTO-FIX | P3 (pragmatic) | Prevent 64-cell re-render | No memo |

### Cross-Phase Themes

**Theme: DAU 확보 경로 미검증** — CEO(P5 partial) + CEO subagent(critical). High-confidence signal.
바이럴 공유가 작동한다는 가정이 전체 수익 모델의 핵심인데, 이를 검증하는 실험이 없음.
→ 출시 후 2주 안에 공유 버튼 탭률 측정 필수. 5% 미만이면 전략 재검토.

**Theme: 솔버 성능** — CEO(P3 unverified) + Eng(test gap, critical). High-confidence signal.
8×8 백트래킹 솔버는 행/열 제약 없이 탐색 공간이 매우 큼. 구현 전 스파이크 필수.
→ Next Step #0으로 격상: 솔버 먼저, 앱 나중.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 2 | ⚠️ 1 critical + 2 taste decisions | Cage-only uniqueness (CRITICAL); Sequential/PWA (taste) |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | Codex unavailable [subagent-only] |
| Design Review | `/plan-design-review` | UI/UX gaps | 3 | ⚠️ 12 auto-fixes + 1 taste | Score: 39/70; a11y=3/10 (4 critical); brand palette (taste) |
| Eng Review | `/plan-eng-review` | Architecture & tests | 2 | ⚠️ 1 critical | Cage-only uniqueness; 10 test gaps; code duplication |

**VERDICT:** CONDITIONAL APPROVAL — cage-only uniqueness verification must be implemented before web launch. All other fixes are post-launch sprint items.
Key blocker: Hidden Latin-square constraint could reject valid player answers.

### TODOS.md Updates (auto-deferred)

- [ ] Web/PWA version (CEO TASTE DECISION — deferred)
- [ ] Remove Ads IAP (CEO TASTE DECISION — deferred unless user selects at gate)
- [ ] 뺄셈/나눗셈 연산자 (v2)
- [ ] 소셜 기능, 리더보드 (v2)
- [ ] 구독 모델 (v2)
- [ ] iPad 전용 레이아웃 (auto-decided: max 400pt centered, v1.1)
- [ ] 다크 모드 (v1.1)
- [ ] Firebase Analytics 연동 (Reviewer Concern — v1.1)
- [ ] 데이터 지속성 전체 스키마 (Reviewer Concern — pre-implementation)
