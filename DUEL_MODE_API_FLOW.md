# DUEL 모드 프론트엔드 엔드포인트 호출 방식 정리

이 문서는 DUEL 모드에서 프론트엔드가 엔드포인트를 호출하는 전체 플로우를 상세히 정리합니다.

## 목차
1. [PvP (사람 vs 사람) 매칭](#1-pvp-사람-vs-사람-매칭)
2. [봇전 매칭](#2-봇전-매칭)
3. [공통 플로우](#3-공통-플로우)
   - [3.1 문제 불러오기](#31-문제-불러오기)
   - [3.2 답안 제출 및 채점](#32-답안-제출-및-채점)
   - [3.3 게임 종료](#33-게임-종료)

---

## 1. PvP (사람 vs 사람) 매칭

### 1.1 시작 단계

**파일 위치**: `src/components/Battle/OneVsOne/Category/CategoryMatching.tsx`

#### Step 1: certId 조회
```typescript
// REST API 호출
GET /api/account/goal

// 목적: 사용자의 목표 자격증 ID(certId)를 가져옴
// 응답: { certId: number }
```

#### Step 2: 매칭 요청 (REST API)
```typescript
// REST API 호출
POST /api/versus/match/request

// 요청 바디:
{
  mode: "DUEL",
  certId: string,              // Step 1에서 받은 certId
  matchingMode: "CATEGORY",    // "CATEGORY" 또는 "DIFFICULTY"
  topicId?: number,            // CATEGORY 모드일 때 필수
  difficulty?: "EASY" | "NORMAL" | "HARD",  // DIFFICULTY 모드일 때 필수
  examMode: "WRITTEN" | "PRACTICAL"
}

// 응답:
{
  matchId: string,
  status: "WAITING" | "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  opponent?: {
    userId: string,
    nickname: string | null,
    skinId: number,
    avatarUrl?: string,
    level?: number
  },
  roomId?: string,
  createdAt: string
}
```

**코드 위치**: `CategoryMatching.tsx:113-119`

#### Step 3: 매칭 상태 폴링
```typescript
// REST API 호출 (2초마다 폴링)
GET /api/versus/match/status

// 응답:
{
  matching: boolean,        // true: 매칭 중, false: 매칭 완료/취소
  roomId: number | null,    // null이 아니면 매칭 완료
  waitingCount: number,     // 대기 중인 인원 수
  startedAt?: string        // 게임 시작 시간
}
```

**코드 위치**: `CategoryMatching.tsx:129-236`

#### Step 4: 방 상태 조회 (매칭 완료 시)
```typescript
// REST API 호출
GET /api/versus/rooms/{roomId}/state?limit=50

// 응답:
{
  detail: {
    room: {
      roomId: number,
      mode: "DUEL",
      status: "WAIT" | "IN_PROGRESS" | "ONGOING" | "COMPLETED",
      examMode: "WRITTEN" | "PRACTICAL",
      createdAt: string,
      isBotMatch: boolean
    },
    participants: Array<{
      userId: string,
      nickname: string | null,
      skinId: number,
      eliminated: boolean,
      revived: boolean,
      finalScore: number | null,
      rank: number | null
    }>,
    scoreboard: {
      items: Array<{
        userId: string,
        nickname: string | null,
        skinId: number,
        score: number,
        rank: number,
        alive: boolean
      }>
    }
  },
  timeline: Array<TimelineEvent>,
  realtime: RealtimeSnapshot
}
```

**코드 위치**: `CategoryMatching.tsx:146`

#### Step 5: roomId 저장 및 게임 시작 페이지로 이동
```typescript
// localStorage에 roomId 저장
localStorage.setItem("currentRoomId", String(roomId))

// BattleFlow 컴포넌트로 이동
navigate("/battle/onevsone/category/start", {
  state: {
    roomId: number,
    topicName: string,
    topicId: number,
    examType: "written" | "practical",
    opponentId?: string,
    myUserId: string
  }
})
```

**코드 위치**: `CategoryMatching.tsx:142, 184-195`

---

## 2. 봇전 매칭

### 2.1 시작 단계

**파일 위치**: `src/components/Battle/OneVsOne/Category/CategoryBattleSelect.tsx`

#### Step 1: 봇 매칭 요청
```typescript
// REST API 호출
POST /api/versus/match/duel/bot?examMode={examMode}&scopeType={scopeType}&topicId={topicId}

// 쿼리 파라미터:
{
  examMode: "WRITTEN" | "PRACTICAL",
  scopeType: "CATEGORY" | "DIFFICULTY",
  topicId?: number,              // CATEGORY 모드일 때 필수
  difficulty?: "EASY" | "NORMAL" | "HARD"  // DIFFICULTY 모드일 때 필수
}

// 응답:
{
  roomId: number,
  myUserId: string,
  botUserId: string,
  botNickname: string | null,
  botSkinId: number,
  scopeJson: string              // JSON 문자열: {"examMode":"WRITTEN","topicId":123}
}
```

**코드 위치**: `CategoryBattleSelect.tsx:137-146`

#### Step 2: roomId 저장 및 게임 시작 페이지로 이동
```typescript
// localStorage에 roomId 저장
localStorage.setItem("currentRoomId", String(roomId))

// BattleFlow 컴포넌트로 이동
navigate("/battle/onevsone/category/start", {
  state: {
    roomId: number,
    botUserId: string,
    botNickname: string | null,
    topicName: string,
    topicId: number,
    examType: "written" | "practical",
    isBotMatch: true
  }
})
```

**코드 위치**: `CategoryBattleSelect.tsx:148-163`

---

## 3. 공통 플로우

### 3.1 문제 불러오기

**파일 위치**: `src/components/Battle/OneVsOne/Category/BattleFlow.tsx`, `BattleGamePractical.tsx`

#### Step 1: WebSocket 연결 및 방 참가

```typescript
// WebSocket 연결
// URL: ws://{gateway-host}/ws/versus?token={JWT_TOKEN}

// 개인 큐 구독
// - /user/queue/versus/match: 매칭 응답
// - /user/queue/versus/join: 방 참가 응답
// - /user/queue/versus/answer: 답안 제출 응답
// - /user/queue/versus/heartbeat: 하트비트 응답

// 방 토픽 구독
// - /topic/versus/rooms/{roomId}: 방 이벤트 브로드캐스트
```

**코드 위치**: `BattleWebSocketClient.ts:199-267, 277-342`

#### Step 2: JOIN_ROOM 메시지 전송
```typescript
// WebSocket 메시지 전송
Destination: /app/versus/join
Body: { roomId: number }

// 응답 수신: /user/queue/versus/join
{
  type: "JOIN_ROOM_RESPONSE",
  roomId: number,
  snapshot: {
    room: { ... },
    participants: [ ... ],
    currentQuestion: {
      questionId: number,
      roundNo: number,
      phase: "MAIN" | "REVIVAL",
      orderNo: number,
      timeLimitSec: number,
      endTime: string,          // ISO 8601 형식
      remainingSeconds: number
    } | null,
    scoreboard: {
      items: [ ... ]
    }
  }
}
```

**코드 위치**: `BattleWebSocketClient.ts:515-533, 382-395`

#### Step 3: QUESTION_STARTED 이벤트 수신
```typescript
// 방 토픽에서 이벤트 수신: /topic/versus/rooms/{roomId}
{
  eventType: "QUESTION_STARTED",
  questionId: number,
  roundNo: number,
  phase: "MAIN" | "REVIVAL",
  orderNo: number,
  startedAt: string,           // ISO 8601 형식
  timeLimitSec: number,
  endTime: string              // ISO 8601 형식
}

// 프론트엔드에서 endTimeMs 계산
const endTimeMs = new Date(startedAt).getTime() + (timeLimitSec * 1000)
```

**코드 위치**: `BattleFlow.tsx:196-213`, `BattleWebSocketClient.ts:418-440`

#### Step 4: 문제 상세 정보 조회
```typescript
// REST API 호출
GET /api/study/versus/questions/{questionId}

// 응답:
{
  questionId?: number,
  id?: number,                 // API 응답에 따라 id 또는 questionId 사용
  mode: "WRITTEN" | "PRACTICAL",
  type: "OX" | "MULTIPLE" | "MCQ" | "SHORT" | "LONG",
  difficulty: "EASY" | "NORMAL" | "HARD",
  stem: string,                // 문제 내용
  answerKey: string,           // 정답
  solutionText: string,        // 해설
  payloadJson: {
    choices?: Array<{          // WRITTEN 모드일 때
      label: string,
      content: string,
      correct: boolean
    }>,
    [key: string]: unknown
  }
}
```

**코드 위치**: `BattleGamePractical.tsx:235`, `versusApi.ts:429-432`

---

### 3.2 답안 제출 및 채점

**파일 위치**: `src/components/Battle/OneVsOne/Category/BattleGamePractical.tsx`

#### Step 1: 답안 제출

**방법 1: REST API (현재 구현)**
```typescript
// REST API 호출
POST /api/versus/rooms/{roomId}/answers

// 요청 바디:
{
  questionId: number,
  userAnswer: string,           // 실기: 입력한 답안 문자열, 필기: "A", "B", "C", "D" 등
  correct: boolean,              // 백엔드가 채점하므로 프론트에서는 false로 전송
  timeMs: number,                // 소요 시간 (밀리초)
  roundNo: number,
  phase: "MAIN" | "REVIVAL"
}

// 응답:
{
  roomId: number,
  status: string,
  items: Array<{
    userId: string,
    nickname: string | null,
    skinId: number,
    correctCount: number,
    totalCount: number,
    score: number,           // 업데이트된 점수
    totalTimeMs: number,
    rank: number,
    alive: boolean,
    revived: boolean
  }>
}
```

**코드 위치**: `BattleGamePractical.tsx:298-335`, `versusApi.ts:346-349`

**방법 2: WebSocket (대안)**
```typescript
// WebSocket 메시지 전송
Destination: /app/versus/answer
Body: {
  roomId: number,
  questionId: number,
  userAnswer: string           // 실기: 입력한 답안 문자열, 필기: "A", "B", "C", "D" 등
}

// 응답 수신: /user/queue/versus/answer
{
  type: "SUBMIT_ANSWER_RESPONSE",
  success: boolean,
  roomId: number,
  questionId: number,
  message: string | null,
  scoreboard?: {
    items: Array<{
      userId: string,
      nickname: string | null,
      skinId: number,
      correctCount: number,
      totalCount: number,
      score: number,           // 업데이트된 점수
      totalTimeMs: number,
      rank: number,
      alive: boolean,
      revived: boolean
    }>
  }
}
```

**코드 위치**: `BattleWebSocketClient.ts:543-566, 398-406`

**중요**: 
- 채점은 **백엔드에서 자동으로 수행**됩니다
- 프론트엔드는 답안만 전송하고, 채점 결과는 `scoreboard`에서 확인합니다
- 실기 문제의 경우 백엔드가 AI 채점을 수행합니다
- 현재 구현은 REST API 방식을 사용하고 있습니다

#### Step 2: 스코어보드 업데이트 수신

```typescript
// 방 토픽에서 이벤트 수신: /topic/versus/rooms/{roomId}
{
  eventType: "SCOREBOARD_UPDATED",
  scoreboard: {
    items: Array<{
      userId: string,
      nickname: string | null,
      skinId: number,
      correctCount: number,
      totalCount: number,
      score: number,
      totalTimeMs: number,
      rank: number,
      alive: boolean,
      revived: boolean
    }>
  }
}

// 또는 REST API로 폴링 (옵션, 현재는 비활성화됨)
GET /api/versus/rooms/{roomId}/scoreboard

// 응답:
{
  roomId: number,
  status: "WAIT" | "IN_PROGRESS" | "ONGOING" | "COMPLETED" | "DONE",
  items: [ ... ],
  currentQuestion?: CurrentQuestion | null,
  intermission?: Intermission | null,
  xpResults?: Array<{          // 게임 종료 시 (status === "DONE")
    userId: string,
    xpDelta: number,
    reason: string,
    totalXp: number,
    leveledUp: boolean
  }>
}
```

**코드 위치**: `BattleGamePractical.tsx:115-211` (폴링, 현재 비활성화), `BattleWebSocketClient.ts:418-440` (이벤트)

---

### 3.3 게임 종료

#### Step 1: MATCH_FINISHED 이벤트 수신
```typescript
// 방 토픽에서 이벤트 수신: /topic/versus/rooms/{roomId}
{
  eventType: "MATCH_FINISHED",
  scoreboard: {
    items: [ ... ],
    xpResults: Array<{
      userId: string,
      xpDelta: number,
      reason: string,
      totalXp: number,
      leveledUp: boolean
    }>
  }
}
```

**코드 위치**: `BattleFlow.tsx:222-226`, `BattleWebSocketClient.ts:430-434`

#### Step 2: 최종 스코어보드 조회 (옵션)
```typescript
// REST API 호출
GET /api/versus/rooms/{roomId}/scoreboard

// 응답의 status가 "DONE"이고 xpResults가 포함됨
```

**코드 위치**: `BattleFlow.tsx:290-360` (폴링, 현재 비활성화)

#### Step 3: 결과 화면으로 이동
```typescript
// LevelUpScreen 표시 (xpResults가 있고 leveledUp이 true인 경우)
// 또는 바로 BattleResult 화면으로 이동

navigate("/battle/onevsone/category/result", {
  state: {
    myScore: number,
    opponentScore: number,
    myNickname: string | null,
    mySkinId: number,
    opponentNickname: string | null,
    opponentSkinId: number
  }
})
```

**코드 위치**: `BattleFlow.tsx:388-442`

---

## 4. WebSocket 이벤트 타입 정리

### 4.1 개인 큐 응답 (type 필드 사용)

| 큐 경로 | 응답 타입 | 설명 |
|---------|----------|------|
| `/user/queue/versus/match` | `MATCH_RESPONSE` | 매칭 요청 응답 |
| `/user/queue/versus/join` | `JOIN_ROOM_RESPONSE` | 방 참가 응답 (snapshot 포함) |
| `/user/queue/versus/answer` | `SUBMIT_ANSWER_RESPONSE` | 답안 제출 응답 |
| `/user/queue/versus/heartbeat` | `HEARTBEAT_RESPONSE` | 하트비트 응답 |

### 4.2 방 토픽 이벤트 (eventType 필드 사용)

| 이벤트 타입 | 설명 | 주요 데이터 |
|------------|------|------------|
| `PLAYER_JOINED` | 플레이어 참가 | participant 정보 |
| `MATCH_STARTED` | 매치 시작 | - |
| `QUESTION_STARTED` | 문제 시작 | questionId, startedAt, timeLimitSec, endTime |
| `ANSWER_SUBMITTED` | 답안 제출 (다른 플레이어) | userId, questionId |
| `SCOREBOARD_UPDATED` | 스코어보드 업데이트 | scoreboard |
| `ROUND_COMPLETED` | 라운드 완료 | roundNo |
| `INTERMISSION_STARTED` | 인터미션 시작 | intermission 정보 |
| `MATCH_FINISHED` | 매치 종료 | scoreboard (xpResults 포함) |

---

## 5. Heartbeat (연결 상태 유지)

```typescript
// WebSocket 메시지 전송 (10초마다)
Destination: /app/versus/heartbeat
Body: { roomId: number }

// 응답 수신: /user/queue/versus/heartbeat
{
  type: "HEARTBEAT_RESPONSE",
  roomId: number
}
```

**코드 위치**: `BattleWebSocketClient.ts:574-591, 598-617`

**중요**: 
- JOIN_ROOM 성공 후 자동으로 시작됨
- MATCH_FINISHED 이벤트 수신 시 자동으로 중단됨
- 1분 이상 heartbeat가 없으면 백엔드에서 자동 추방

---

## 6. 주요 파일 위치

### 6.1 매칭 관련
- `src/components/Battle/OneVsOne/Category/CategoryMatching.tsx` - PvP 매칭 UI 및 로직
- `src/components/Battle/OneVsOne/Category/CategoryBattleSelect.tsx` - 봇전 매칭 시작
- `src/components/api/versusApi.ts` - REST API 호출 함수들

### 6.2 게임 플로우 관련
- `src/components/Battle/OneVsOne/Category/BattleFlow.tsx` - 게임 플로우 관리
- `src/components/Battle/OneVsOne/Category/BattleGamePractical.tsx` - 실기 게임 UI
- `src/components/Battle/OneVsOne/Category/BattleGameWritten.tsx` - 필기 게임 UI

### 6.3 WebSocket 관련
- `src/ws/BattleWebSocketClient.ts` - WebSocket 클라이언트 구현

---

## 7. 주요 차이점: PvP vs 봇전

| 구분 | PvP | 봇전 |
|------|-----|------|
| 매칭 시작 | REST API: `/versus/match/request` + 폴링 | REST API: `/versus/match/duel/bot` (즉시 완료) |
| 매칭 대기 | 있음 (상대방 찾는 동안 대기) | 없음 (즉시 봇과 매칭) |
| WebSocket 연결 | 필수 (실시간 동기화) | 필수 (동일) |
| 문제 불러오기 | 동일 | 동일 |
| 답안 제출 | 동일 | 동일 |
| 채점 방식 | 동일 (백엔드 자동 채점) | 동일 |

---

## 8. 참고사항

1. **채점은 백엔드에서 수행**: 프론트엔드는 답안만 전송하고, 채점 결과는 `scoreboard`를 통해 확인합니다.

2. **실기 문제 채점**: 실기 문제의 경우 백엔드가 AI 채점을 수행합니다.

3. **문제는 하나씩 가져옴**: 토너먼트 방식으로, 현재 문제만 API로 가져옵니다 (`currentQuestion.questionId` 사용).

4. **WebSocket 우선**: 현재 코드에서는 폴링이 대부분 비활성화되어 있고, WebSocket 이벤트를 통한 실시간 업데이트를 사용합니다.

5. **상태 복구**: JOIN_ROOM 시 `snapshot`을 받아 현재 방 상태를 복구할 수 있습니다.

