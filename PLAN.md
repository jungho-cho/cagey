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

<!-- /autoplan restore point: /home/junghocho/.gstack/projects/cagey/-autoplan-restore-20260326-113303.md -->

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
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | ⚠️ 2 unresolved taste decisions | Web-first pivot accepted; Remove Ads deferred |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | Codex unavailable [subagent-only] |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | ✅ clean | 5 auto-fixes: hint label, accessibility, font spec |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | ✅ clean | 12 test gaps identified, all auto-decided |

**VERDICT:** APPROVED (with taste decisions resolved by user) — major pivot: web-first + Flutter confirmed.
Key risk: DAU acquisition unvalidated — web launch in 2 weeks is the test.

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
