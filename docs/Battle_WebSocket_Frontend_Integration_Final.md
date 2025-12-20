# CertPilot Battle WebSocket Frontend Integration (Final)

> **프론트엔드 팀원이 이 문서만 보고 바로 구현 가능한 완전한 연동 가이드**

## 목차

1. [개요](#개요)
2. [WebSocket 연결](#websocket-연결)
3. [STOMP Destination](#stomp-destination)
4. [이벤트 타입 및 구조](#이벤트-타입-및-구조)
5. [하트비트 규칙](#하트비트-규칙)
6. [타이머 규칙](#타이머-규칙)
7. [전체 플로우](#전체-플로우)
8. [구현 예시](#구현-예시)

---

## 개요

CertPilot Battle 시스템은 **STOMP + SockJS** 기반의 WebSocket 통신을 사용합니다.

- **WebSocket 엔드포인트**: `/ws/versus`
- **Gateway 라우팅**: `/ws/versus/**`
- **인증**: JWT 토큰을 쿼리 파라미터로 전달
- **프로토콜**: SockJS + STOMP

### 중요 사항

- **SockJS 사용**: `/ws/versus/info`, `/ws/versus/{server-id}/{session-id}/websocket` 등의 요청이 자동으로 발생합니다.
- **REST API 엔드포인트**: `/api/versus/**` (WebSocket과 별개)
- **이벤트 기반**: 서버에서 이벤트를 보내면 프론트엔드가 이를 수신하여 상태를 업데이트합니다.
- **서버가 주도**: 타이머 만료, 문제 전환, 게임 종료 등은 모두 서버 이벤트에 의존합니다.

---

## WebSocket 연결

### 연결 URL 구성

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const token = getAccessToken(); // JWT 토큰 가져오기
const wsUrl = `${API_BASE_URL}/ws/versus?token=${token}`;
```

### SockJS + STOMP 클라이언트 초기화

```typescript
import SockJS from 'sockjs-client/dist/sockjs';
import { Client } from '@stomp/stompjs';

const client = new Client({
  webSocketFactory: () => new SockJS(wsUrl) as any,
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
  onConnect: () => {
    console.log('WebSocket 연결 성공');
    // 구독 및 초기 작업 수행
  },
  onDisconnect: () => {
    console.log('WebSocket 연결 해제');
  },
  onStompError: (frame) => {
    console.error('STOMP 에러:', frame);
  },
  onWebSocketError: (event) => {
    console.error('WebSocket 에러:', event);
  },
});

client.activate();
```

### 주의사항

- SockJS는 내부적으로 `/ws/versus/info`를 먼저 호출하여 서버 정보를 가져옵니다.
- 이후 `/ws/versus/{server-id}/{session-id}/websocket` 형식의 실제 WebSocket 연결이 생성됩니다.
- Gateway는 `/ws/versus/**` 패턴으로 모든 요청을 라우팅해야 합니다.

---

## STOMP Destination

### Publish (프론트엔드 → 서버)

프론트엔드가 서버로 메시지를 보낼 때 사용하는 destination입니다.

#### 1. 매칭 요청
```
/app/versus/match/request
```

**요청 본문 (JSON)**:
```json
{
  "mode": "DUEL",
  "certId": "string",
  "matchingMode": "CATEGORY" | "DIFFICULTY",
  "topicId": 123,  // CATEGORY 모드일 때 필수
  "difficulty": "EASY" | "NORMAL" | "HARD",  // DIFFICULTY 모드일 때 필수
  "examMode": "WRITTEN" | "PRACTICAL"
}
```

**응답**: `/user/queue/versus/match` 큐에서 수신

---

#### 2. 방 참가
```
/app/versus/join
```

**요청 본문 (JSON)**:
```json
{
  "roomId": 123
}
```

**응답**: `/user/queue/versus/join` 큐에서 `JOIN_ROOM_RESPONSE` 이벤트 수신 (snapshot 포함)

**중요**: WebSocket 연결 후 방 참가를 위해 반드시 호출해야 합니다. 재연결 시에도 자동으로 호출해야 합니다.

---

#### 3. 답안 제출
```
/app/versus/answer
```

**요청 본문 (JSON)**:
```json
{
  "roomId": 123,
  "questionId": 456,
  "userAnswer": "A",  // 또는 실기 문제의 경우 입력한 텍스트
  "correct": false,  // 프론트에서는 알 수 없으므로 false로 전송 (서버가 채점)
  "timeMs": 5000,
  "roundNo": 1,
  "phase": "MAIN" | "REVIVAL"
}
```

**응답**: `/user/queue/versus/answer` 큐에서 수신 (선택사항)

---

#### 4. 하트비트
```
/app/versus/heartbeat
```

**요청 본문 (JSON)**:
```json
{
  "command": "HEARTBEAT",
  "roomId": 123
}
```

**중요**: 
- `JOIN_ROOM_RESPONSE` 수신 이후에만 시작합니다.
- `MATCH_FINISHED` 이벤트 수신 즉시 중단합니다.
- **10초마다 전송**합니다.
- REST API 기반 heartbeat는 사용하지 않습니다.

---

### Subscribe (서버 → 프론트엔드)

프론트엔드가 구독하여 서버로부터 메시지를 받는 destination입니다.

#### 개인 큐 (User-specific Queue)

각 사용자에게 개인적으로 전달되는 메시지를 받습니다.

##### 1. 매칭 응답 큐
```
/user/queue/versus/match
```

**용도**: 매칭 요청에 대한 응답을 받습니다.

---

##### 2. 방 참가 응답 큐
```
/user/queue/versus/join
```

**용도**: `JOIN_ROOM_RESPONSE` 이벤트를 받습니다. snapshot이 포함되어 있습니다.

**메시지 구조**:
```json
{
  "snapshot": {
    "room": {
      "roomId": 123,
      "status": "IN_PROGRESS" | "WAIT" | "COMPLETED" | "CANCELLED",
      ...
    },
    "scoreboard": {
      "status": "IN_PROGRESS" | "DONE",
      "currentQuestion": {
        "questionId": 456,
        "startedAt": "2024-01-01T12:00:00Z",  // ISO 8601 형식
        "timeLimitSec": 30,
        ...
      },
      ...
    },
    ...
  }
}
```

---

##### 3. 답안 제출 응답 큐
```
/user/queue/versus/answer
```

**용도**: 답안 제출에 대한 응답을 받습니다 (선택사항).

---

#### 방 토픽 (Room Topic)

특정 방의 모든 참가자에게 브로드캐스트되는 메시지를 받습니다.

```
/topic/versus/rooms/{roomId}
```

**예시**: `/topic/versus/rooms/123`

**용도**: 다음 이벤트들을 받습니다:
- `QUESTION_STARTED`
- `QUESTION_FINISHED`
- `MATCH_FINISHED`
- `ANSWER_SUBMITTED`

---

## 이벤트 타입 및 구조

### 이벤트 타입 목록

1. **JOIN_ROOM_RESPONSE**: 방 참가 응답 (snapshot 포함)
2. **QUESTION_STARTED**: 문제 시작
3. **QUESTION_FINISHED**: 문제 종료
4. **MATCH_FINISHED**: 게임 종료
5. **ANSWER_SUBMITTED**: 답안 제출 (상대방 제출 알림)

---

### 이벤트 상세 구조

#### 1. JOIN_ROOM_RESPONSE

**수신 큐**: `/user/queue/versus/join`

**메시지 구조**:
```json
{
  "snapshot": {
    "room": {
      "roomId": 123,
      "status": "IN_PROGRESS" | "WAIT" | "COMPLETED" | "CANCELLED",
      "mode": "DUEL" | "TOURNAMENT" | "GOLDENBELL",
      ...
    },
    "scoreboard": {
      "status": "IN_PROGRESS" | "DONE",
      "items": [
        {
          "userId": "user123",
          "nickname": "사용자1",
          "skinId": 1,
          "score": 100,
          "rank": 1,
          ...
        }
      ],
      "currentQuestion": {
        "questionId": 456,
        "roundNo": 1,
        "phase": "MAIN",
        "orderNo": 1,
        "timeLimitSec": 30,
        "startedAt": "2024-01-01T12:00:00Z",  // ISO 8601 형식
        "endTime": "2024-01-01T12:00:30Z"
      },
      ...
    },
    ...
  }
}
```

**특징**:
- `eventType` 필드가 없습니다. `snapshot` 필드 존재 여부로 판단합니다.
- 재연결 시 현재 상태를 복구하는 데 사용됩니다.
- 수신 후 **하트비트를 시작**해야 합니다.

---

#### 2. QUESTION_STARTED

**수신 토픽**: `/topic/versus/rooms/{roomId}`

**메시지 구조**:
```json
{
  "eventType": "QUESTION_STARTED",
  "questionId": 456,
  "roundNo": 1,
  "phase": "MAIN",
  "startedAt": "2024-01-01T12:00:00Z",  // ISO 8601 형식
  "timeLimitSec": 30,
  ...
}
```

**처리 방법**:
1. UI 타이머를 시작합니다.
2. 타이머 종료 시간을 계산합니다: `endTimeMs = new Date(startedAt).getTime() + (timeLimitSec * 1000)`
3. 문제 화면을 표시합니다.

**중요**: 
- 프론트엔드는 타이머가 0이 되어도 **자동으로 답안을 제출하거나 다음 문제로 이동하지 않습니다**.
- 서버가 `QUESTION_FINISHED` 또는 다음 `QUESTION_STARTED`를 보낼 때까지 대기합니다.

---

#### 3. QUESTION_FINISHED

**수신 토픽**: `/topic/versus/rooms/{roomId}`

**메시지 구조**:
```json
{
  "eventType": "QUESTION_FINISHED",
  "questionId": 456,
  ...
}
```

**처리 방법**:
- 문제 종료 UI를 표시할 수 있습니다.
- 다음 `QUESTION_STARTED` 이벤트를 기다립니다.

---

#### 4. MATCH_FINISHED

**수신 토픽**: `/topic/versus/rooms/{roomId}`

**메시지 구조**:
```json
{
  "eventType": "MATCH_FINISHED",
  "roomId": 123,
  ...
}
```

**처리 방법**:
1. **하트비트를 즉시 중단**합니다.
2. 결과 화면으로 전환합니다.
3. 최종 스코어는 REST API (`/api/versus/rooms/{roomId}/scoreboard`)로 조회합니다.

---

#### 5. ANSWER_SUBMITTED

**수신 토픽**: `/topic/versus/rooms/{roomId}`

**메시지 구조**:
```json
{
  "eventType": "ANSWER_SUBMITTED",
  "userId": "user123",
  "questionId": 456,
  "userAnswer": "A",
  "timeMs": 5000,
  ...
}
```

**처리 방법**:
- 상대방이 답안을 제출했음을 UI에 표시할 수 있습니다 (선택사항).

---

## 하트비트 규칙

### 시작 조건

- `JOIN_ROOM_RESPONSE` 이벤트를 수신한 **즉시** 시작합니다.

### 전송 규칙

1. **Destination**: `/app/versus/heartbeat`
2. **본문 형식**:
   ```json
   {
     "command": "HEARTBEAT",
     "roomId": 123
   }
   ```
3. **전송 주기**: **10초마다** 전송합니다.
4. **즉시 전송**: 하트비트 시작 시 즉시 한 번 전송합니다.

### 중단 조건

다음 경우에 하트비트를 **즉시 중단**합니다:

1. `MATCH_FINISHED` 이벤트 수신
2. WebSocket 연결 해제
3. 컴포넌트 언마운트

### 구현 예시

```typescript
let heartbeatIntervalId: NodeJS.Timeout | null = null;

function startHeartbeat(roomId: number) {
  // 이미 실행 중이면 중복 실행 방지
  if (heartbeatIntervalId) {
    return;
  }

  // 즉시 한 번 전송
  sendHeartbeat(roomId);

  // 10초마다 전송
  heartbeatIntervalId = setInterval(() => {
    sendHeartbeat(roomId);
  }, 10000);
}

function sendHeartbeat(roomId: number) {
  if (!client?.connected) {
    return;
  }

  client.publish({
    destination: '/app/versus/heartbeat',
    body: JSON.stringify({
      command: 'HEARTBEAT',
      roomId: roomId
    })
  });
}

function stopHeartbeat() {
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
}

// JOIN_ROOM_RESPONSE 수신 시
if (eventType === 'JOIN_ROOM_RESPONSE' || data.snapshot) {
  startHeartbeat(roomId);
}

// MATCH_FINISHED 수신 시
if (eventType === 'MATCH_FINISHED') {
  stopHeartbeat();
}
```

### 중요 사항

- **REST API 기반 heartbeat는 사용하지 않습니다** (`/api/versus/rooms/{roomId}/heartbeat`).
- 오직 WebSocket STOMP 방식만 사용합니다.

---

## 타이머 규칙

### 타이머 계산 방법

`QUESTION_STARTED` 이벤트에서 받은 정보로 타이머를 계산합니다:

```typescript
const startedAt = event.startedAt; // ISO 8601 형식 문자열
const timeLimitSec = event.timeLimitSec; // 초 단위

const startedAtMs = new Date(startedAt).getTime();
const endTimeMs = startedAtMs + (timeLimitSec * 1000);
```

### UI 타이머 표시

```typescript
useEffect(() => {
  if (!endTimeMs) {
    setTimeLeft(0);
    return;
  }

  const updateTimeLeft = () => {
    const now = Date.now();
    const remainingMs = endTimeMs - now;
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
    setTimeLeft(remainingSec);
  };

  // 즉시 한 번 업데이트
  updateTimeLeft();

  // 주기적으로 업데이트 (200ms ~ 1초 간격 권장)
  const interval = setInterval(updateTimeLeft, 200);

  return () => clearInterval(interval);
}, [endTimeMs]);
```

### 중요 규칙

1. **프론트엔드는 타이머가 0이 되어도 아무 동작을 하지 않습니다**.
   - 자동 답안 제출 ❌
   - 자동 다음 문제 이동 ❌
   - 서버 이벤트만을 기준으로 상태 전환 ✅

2. **서버가 시간을 제어합니다**.
   - 서버가 `QUESTION_FINISHED` 또는 다음 `QUESTION_STARTED`를 보내면 그때 상태가 변경됩니다.

3. **타이머는 표시용입니다**.
   - 사용자에게 남은 시간을 보여주는 용도로만 사용합니다.

---

## 전체 플로우

### 1. 게임 시작 플로우

```
1. 사용자가 매칭 요청
   ↓
2. REST API: POST /api/versus/match/request
   ↓
3. 매칭 완료 시 roomId 수신
   ↓
4. WebSocket 연결: /ws/versus?token={token}
   ↓
5. STOMP 연결 성공
   ↓
6. 개인 큐 구독:
   - /user/queue/versus/match
   - /user/queue/versus/join
   - /user/queue/versus/answer
   ↓
7. 방 토픽 구독: /topic/versus/rooms/{roomId}
   ↓
8. Publish: /app/versus/join (roomId 전송)
   ↓
9. Subscribe: /user/queue/versus/join에서 JOIN_ROOM_RESPONSE 수신
   ↓
10. 하트비트 시작 (10초마다 /app/versus/heartbeat 전송)
   ↓
11. 방 토픽에서 QUESTION_STARTED 이벤트 수신
   ↓
12. 문제 화면 표시, 타이머 시작
   ↓
13. 사용자가 답안 제출
   ↓
14. Publish: /app/versus/answer (답안 전송)
   ↓
15. 방 토픽에서 QUESTION_FINISHED 또는 다음 QUESTION_STARTED 수신
   ↓
16. (반복: 11 ~ 15)
   ↓
17. 방 토픽에서 MATCH_FINISHED 수신
   ↓
18. 하트비트 중단
   ↓
19. 결과 화면 표시
```

### 2. 재연결 플로우

```
1. WebSocket 연결 끊김 감지
   ↓
2. 재연결 시도 (STOMP Client의 reconnectDelay 활용)
   ↓
3. STOMP 연결 성공
   ↓
4. 기존 구독 재등록
   ↓
5. Publish: /app/versus/join (roomId 전송)
   ↓
6. Subscribe: /user/queue/versus/join에서 JOIN_ROOM_RESPONSE 수신
   ↓
7. snapshot으로 현재 상태 복구
   ↓
8. 하트비트 재시작
```

---

## 구현 예시

### 완전한 WebSocket 클라이언트 구현

```typescript
import SockJS from 'sockjs-client/dist/sockjs';
import { Client } from '@stomp/stompjs';

type BattleEventType = 
  | 'JOIN_ROOM_RESPONSE'
  | 'QUESTION_STARTED'
  | 'QUESTION_FINISHED'
  | 'MATCH_FINISHED'
  | 'ANSWER_SUBMITTED';

interface BattleEvent {
  eventType: BattleEventType;
  [key: string]: any;
}

interface JoinRoomSnapshot {
  room: {
    roomId: number;
    status: string;
    [key: string]: any;
  };
  scoreboard: {
    status: string;
    currentQuestion?: {
      questionId: number;
      startedAt?: string;
      timeLimitSec?: number;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

type BattleEventCallback = (eventType: BattleEventType, event: BattleEvent) => void;
type SnapshotCallback = (snapshot: JoinRoomSnapshot) => void;

class BattleWebSocketClient {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private subscriptions: Array<{ unsubscribe: () => void }> = [];
  private roomId: number | null = null;
  private eventCallback: BattleEventCallback | null = null;
  private snapshotCallback: SnapshotCallback | null = null;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private isMatchFinished: boolean = false;

  setEventCallback(callback: BattleEventCallback | null): void {
    this.eventCallback = callback;
  }

  setSnapshotCallback(callback: SnapshotCallback | null): void {
    this.snapshotCallback = callback;
  }

  connect(roomId?: number): void {
    if (this.isConnected && this.client?.active) {
      return;
    }

    const token = getAccessToken(); // JWT 토큰 가져오기
    if (!token) {
      console.error('[BattleWebSocket] 토큰을 찾을 수 없습니다.');
      return;
    }

    if (roomId) {
      this.roomId = roomId;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const wsUrl = `${API_BASE_URL}/ws/versus?token=${token}`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[BattleWebSocket] 연결 성공, roomId:', this.roomId);
        this.isConnected = true;
        this.subscribeToQueues();
        if (this.roomId) {
          this.subscribeToRoom(this.roomId);
          this.joinRoom(this.roomId);
        }
      },
      onDisconnect: () => {
        console.log('[BattleWebSocket] 연결 해제, roomId:', this.roomId);
        this.isConnected = false;
        this.subscriptions = [];
        this.stopHeartbeat();
      },
      onStompError: (frame) => {
        console.error('[BattleWebSocket] STOMP 에러, roomId:', this.roomId, frame);
      },
      onWebSocketError: (event) => {
        console.error('[BattleWebSocket] WebSocket 에러, roomId:', this.roomId, event);
      },
    });

    this.client.activate();
  }

  private subscribeToQueues(): void {
    if (!this.client || !this.isConnected) {
      return;
    }

    const personalQueues = [
      '/user/queue/versus/match',
      '/user/queue/versus/join',
      '/user/queue/versus/answer',
    ];

    personalQueues.forEach((queue) => {
      const subscription = this.client!.subscribe(queue, (message) => {
        this.handleMessage(queue, message);
      });
      
      this.subscriptions.push(subscription);
      console.log(`[BattleWebSocket] 구독 완료: ${queue}, roomId:`, this.roomId);
    });
  }

  subscribeToRoom(roomId: number): void {
    if (!this.client || !this.isConnected) {
      return;
    }

    const roomTopic = `/topic/versus/rooms/${roomId}`;
    
    const subscription = this.client.subscribe(roomTopic, (message) => {
      this.handleMessage(roomTopic, message);
    });

    this.subscriptions.push(subscription);
    this.roomId = roomId;
    console.log(`[BattleWebSocket] 방 구독 완료: ${roomTopic}, roomId:`, roomId);
  }

  private handleMessage(destination: string, message: { body: string }): void {
    try {
      const data = JSON.parse(message.body);
      
      // JOIN_ROOM_RESPONSE 처리 (snapshot 포함)
      if (destination === '/user/queue/versus/join') {
        if (data.snapshot) {
          const snapshot = data.snapshot as JoinRoomSnapshot;
          console.log('[BattleWebSocket] JOIN_ROOM_RESPONSE 수신, roomId:', this.roomId, snapshot);
          
          if (this.snapshotCallback) {
            this.snapshotCallback(snapshot);
          }
          
          // 하트비트 시작
          if (this.roomId && !this.isMatchFinished) {
            this.startHeartbeat(this.roomId);
          }
        }
        return;
      }

      // 일반 이벤트 처리
      const event: BattleEvent = data;
      const eventType = event.eventType;

      console.log(`[BattleWebSocket] 이벤트 수신 [${eventType}], roomId:`, this.roomId, event);

      // MATCH_FINISHED 수신 시 heartbeat 즉시 중단
      if (eventType === 'MATCH_FINISHED') {
        console.log('[BattleWebSocket] MATCH_FINISHED 수신, heartbeat 중단, roomId:', this.roomId);
        this.isMatchFinished = true;
        this.stopHeartbeat();
      }

      // 이벤트 콜백 호출
      if (this.eventCallback) {
        this.eventCallback(eventType, event);
      }
    } catch (error) {
      console.error('[BattleWebSocket] 메시지 파싱 실패:', error, message.body);
    }
  }

  joinRoom(roomId: number): void {
    if (!this.client || !this.isConnected) {
      console.error('[BattleWebSocket] 클라이언트가 연결되지 않았습니다. roomId:', roomId);
      return;
    }

    this.roomId = roomId;
    this.isMatchFinished = false;

    const destination = '/app/versus/join';
    const body = JSON.stringify({ roomId });

    this.client.publish({
      destination,
      body,
    });

    console.log('[BattleWebSocket] JOIN_ROOM 전송, roomId:', roomId);
  }

  submitAnswer(roomId: number, questionId: number, userAnswer: string, correct: boolean, timeMs: number, roundNo: number, phase: "MAIN" | "REVIVAL"): void {
    if (!this.client || !this.isConnected) {
      console.error('[BattleWebSocket] 클라이언트가 연결되지 않았습니다.');
      return;
    }

    const destination = '/app/versus/answer';
    const body = JSON.stringify({
      roomId,
      questionId,
      userAnswer,
      correct,
      timeMs,
      roundNo,
      phase
    });

    this.client.publish({
      destination,
      body,
    });

    console.log('[BattleWebSocket] ANSWER 제출, roomId:', roomId, 'questionId:', questionId);
  }

  private sendHeartbeat(roomId: number): void {
    if (!this.client || !this.isConnected) {
      return;
    }

    const destination = '/app/versus/heartbeat';
    const body = JSON.stringify({
      command: 'HEARTBEAT',
      roomId: roomId
    });

    this.client.publish({
      destination,
      body,
    });

    console.log('[BattleWebSocket] HEARTBEAT 전송, roomId:', roomId);
  }

  private startHeartbeat(roomId: number): void {
    if (this.heartbeatIntervalId) {
      return;
    }

    // 즉시 한 번 전송
    this.sendHeartbeat(roomId);

    // 10초마다 전송
    this.heartbeatIntervalId = setInterval(() => {
      if (this.isMatchFinished) {
        this.stopHeartbeat();
        return;
      }
      this.sendHeartbeat(roomId);
    }, 10000);

    console.log('[BattleWebSocket] HEARTBEAT 시작, roomId:', roomId);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
      console.log('[BattleWebSocket] HEARTBEAT 중단, roomId:', this.roomId);
    }
  }

  disconnect(): void {
    if (!this.client) {
      return;
    }

    this.stopHeartbeat();

    this.subscriptions.forEach((subscription) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('[BattleWebSocket] 구독 해제 실패:', error);
      }
    });
    this.subscriptions = [];

    if (this.client.active) {
      this.client.deactivate();
    }

    this.client = null;
    this.isConnected = false;
    this.roomId = null;
    this.isMatchFinished = false;
    console.log('[BattleWebSocket] 연결 해제 완료');
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export { BattleWebSocketClient };
export type { BattleEventType, BattleEvent, JoinRoomSnapshot };
```

### React 컴포넌트에서 사용 예시

```typescript
import { useEffect, useRef, useState } from 'react';
import { BattleWebSocketClient } from './BattleWebSocketClient';

function BattleComponent({ roomId }: { roomId: number }) {
  const wsClientRef = useRef<BattleWebSocketClient | null>(null);
  const [questionEndTimeMs, setQuestionEndTimeMs] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!roomId) return;

    const wsClient = new BattleWebSocketClient();

    // JOIN_ROOM snapshot 핸들러
    wsClient.setSnapshotCallback((snapshot) => {
      console.log('JOIN_ROOM snapshot 수신:', snapshot);
      
      // 상태 복구
      const currentQuestion = snapshot.scoreboard?.currentQuestion;
      if (currentQuestion?.startedAt && currentQuestion?.timeLimitSec) {
        const startedAtMs = new Date(currentQuestion.startedAt).getTime();
        const endTimeMs = startedAtMs + (currentQuestion.timeLimitSec * 1000);
        setQuestionEndTimeMs(endTimeMs);
      }
    });

    // 이벤트 핸들러
    wsClient.setEventCallback((eventType, event) => {
      console.log('이벤트 수신:', eventType, event);

      switch (eventType) {
        case 'QUESTION_STARTED':
          const startedAt = event.startedAt as string;
          const timeLimitSec = event.timeLimitSec as number;
          const startedAtMs = new Date(startedAt).getTime();
          const endTimeMs = startedAtMs + (timeLimitSec * 1000);
          setQuestionEndTimeMs(endTimeMs);
          break;

        case 'QUESTION_FINISHED':
          // 문제 종료 처리
          break;

        case 'MATCH_FINISHED':
          // 게임 종료 처리
          break;

        case 'ANSWER_SUBMITTED':
          // 상대방 답안 제출 알림 (선택사항)
          break;
      }
    });

    // 연결 및 방 참가
    wsClient.connect(roomId);
    wsClientRef.current = wsClient;

    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
    };
  }, [roomId]);

  // 타이머 업데이트 (표시용)
  useEffect(() => {
    if (!questionEndTimeMs) {
      setTimeLeft(0);
      return;
    }

    const updateTimeLeft = () => {
      const now = Date.now();
      const remainingMs = questionEndTimeMs - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setTimeLeft(remainingSec);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 200);

    return () => clearInterval(interval);
  }, [questionEndTimeMs]);

  const handleAnswer = () => {
    if (!wsClientRef.current) return;
    
    // 답안 제출 (예시)
    wsClientRef.current.submitAnswer(
      roomId,
      questionId,
      "A",
      false, // 서버가 채점
      timeMs,
      roundNo,
      "MAIN"
    );
  };

  return (
    <div>
      <div>남은 시간: {timeLeft}초</div>
      <button onClick={handleAnswer}>답안 제출</button>
    </div>
  );
}
```

---

## 정리

### 핵심 사항

1. **WebSocket 연결**: `/ws/versus?token={token}` (SockJS + STOMP)
2. **Publish Destination**:
   - `/app/versus/join` - 방 참가
   - `/app/versus/answer` - 답안 제출
   - `/app/versus/heartbeat` - 하트비트
3. **Subscribe Destination**:
   - 개인 큐: `/user/queue/versus/match`, `/user/queue/versus/join`, `/user/queue/versus/answer`
   - 방 토픽: `/topic/versus/rooms/{roomId}`
4. **하트비트**: `JOIN_ROOM_RESPONSE` 후 시작, `MATCH_FINISHED` 시 중단, 10초마다 전송
5. **타이머**: `QUESTION_STARTED`의 `startedAt + timeLimitSec` 기준으로 표시만, 서버 이벤트에 의존
6. **상태 전환**: 모든 상태 변경은 서버 이벤트에 의존

이 문서를 따라 구현하면 CertPilot Battle WebSocket 연동이 완료됩니다.

