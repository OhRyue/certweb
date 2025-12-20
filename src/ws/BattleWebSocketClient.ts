import { Client } from '@stomp/stompjs';
import { getAccessToken } from '../utils/authStorage';

/**
 * 응답 메시지 타입 (개인 큐에서 수신)
 */
type ResponseType = 
  | 'MATCH_RESPONSE'
  | 'JOIN_ROOM_RESPONSE'
  | 'SUBMIT_ANSWER_RESPONSE'
  | 'HEARTBEAT_RESPONSE';

/**
 * 방 토픽 이벤트 타입 (방 브로드캐스트)
 */
export type BattleEventType = 
  | 'PLAYER_JOINED'
  | 'MATCH_STARTED'
  | 'QUESTION_STARTED'
  | 'ANSWER_SUBMITTED'
  | 'SCOREBOARD_UPDATED'
  | 'ROUND_COMPLETED'
  | 'INTERMISSION_STARTED'
  | 'MATCH_FINISHED';

/**
 * 방 토픽 이벤트 인터페이스
 */
export interface BattleEvent {
  eventType: BattleEventType;
  [key: string]: any;
}

/**
 * 매칭 응답 인터페이스
 */
export interface MatchResponse {
  type: 'MATCH_RESPONSE';
  success: boolean;
  matching: boolean;
  roomId: number | null;
  waitingCount: number | null;
  message: string | null;
}

/**
 * JOIN_ROOM_RESPONSE snapshot 구조 (새 문서 기준)
 */
export interface JoinRoomSnapshot {
  room: {
    roomId: number;
    mode: "DUEL" | "TOURNAMENT" | "GOLDENBELL";
    status: string;
    examMode: "WRITTEN" | "PRACTICAL";
    createdAt: string;
    scheduledAt: string | null;
    isBotMatch: boolean;
  };
  participants: Array<{
    userId: string;
    nickname: string | null;
    skinId: number;
    eliminated: boolean;
    revived: boolean;
    finalScore: number | null;
    rank: number | null;
    joinedAt: string;
  }>;
  currentQuestion: {
    questionId: number;
    roundNo: number;
    phase: "MAIN" | "REVIVAL";
    orderNo: number;
    timeLimitSec: number;
    endTime: string; // ISO 8601 형식
    remainingSeconds: number;
  } | null;
  intermission: {
    nextQuestionId: number;
    nextRoundNo: number;
    nextPhase: string;
    durationSec: number;
    startedAt: string;
    questionStartAt: string;
  } | null;
  currentRoundNo: number;
  currentPhase: "MAIN" | "REVIVAL";
  scoreboard: {
    items: Array<{
      userId: string;
      nickname: string | null;
      skinId: number;
      correctCount: number;
      totalCount: number;
      score: number;
      totalTimeMs: number;
      rank: number;
      alive: boolean;
      revived: boolean;
    }>;
  };
  snapshotAt: string;
}

/**
 * 매칭 응답 핸들러 타입
 */
export type MatchResponseCallback = (response: MatchResponse) => void;

/**
 * Battle WebSocket 이벤트 핸들러 타입 (방 토픽 이벤트)
 */
export type BattleEventCallback = (eventType: BattleEventType, event: BattleEvent) => void;

/**
 * JOIN_ROOM snapshot 핸들러 타입
 */
export type SnapshotCallback = (snapshot: JoinRoomSnapshot) => void;

/**
 * 답안 제출 응답 핸들러 타입
 */
export type SubmitAnswerResponseCallback = (response: {
  type: 'SUBMIT_ANSWER_RESPONSE';
  success: boolean;
  roomId: number;
  questionId: number;
  message: string | null;
  scoreboard?: {
    items: Array<{
      userId: string;
      nickname: string | null;
      skinId: number;
      correctCount: number;
      totalCount: number;
      score: number;
      totalTimeMs: number;
      rank: number;
      alive: boolean;
      revived: boolean;
    }>;
  };
}) => void;

/**
 * Battle 전용 WebSocket 클라이언트
 * 
 * 이 클래스는 WebSocket 연결 및 이벤트 수신만 담당합니다.
 * 상태 저장, UI 호출, 타이머, 화면 전환 등의 로직은 포함하지 않습니다.
 */
export class BattleWebSocketClient {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private subscriptions: Array<{ unsubscribe: () => void }> = [];
  private roomId: number | null = null;
  private matchResponseCallback: MatchResponseCallback | null = null;
  private eventCallback: BattleEventCallback | null = null;
  private snapshotCallback: SnapshotCallback | null = null;
  private submitAnswerResponseCallback: SubmitAnswerResponseCallback | null = null;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private isMatchFinished: boolean = false;

  /**
   * 매칭 응답 핸들러를 설정합니다.
   * @param callback 매칭 응답 수신 시 호출될 콜백 함수
   */
  setMatchResponseCallback(callback: MatchResponseCallback | null): void {
    this.matchResponseCallback = callback;
  }

  /**
   * 이벤트 핸들러를 설정합니다.
   * @param callback 방 토픽 이벤트 수신 시 호출될 콜백 함수
   */
  setEventCallback(callback: BattleEventCallback | null): void {
    this.eventCallback = callback;
  }

  /**
   * JOIN_ROOM snapshot 핸들러를 설정합니다.
   * @param callback snapshot 수신 시 호출될 콜백 함수
   */
  setSnapshotCallback(callback: SnapshotCallback | null): void {
    this.snapshotCallback = callback;
  }

  /**
   * 답안 제출 응답 핸들러를 설정합니다.
   * @param callback 답안 제출 응답 수신 시 호출될 콜백 함수
   */
  setSubmitAnswerResponseCallback(callback: SubmitAnswerResponseCallback | null): void {
    this.submitAnswerResponseCallback = callback;
  }

  /**
   * WebSocket 연결을 초기화합니다.
   * @param roomId 방 ID (선택사항, 방 이벤트 구독 시 필요)
   */
  connect(roomId?: number): void {
    // 이미 연결되어 있으면 재연결 금지
    if (this.isConnected && this.client?.active) {
      console.log('[BattleWebSocket] 이미 연결되어 있습니다. roomId:', this.roomId);
      return;
    }

    // 연결 중인 상태에서 중복 호출 방지
    if (this.client && !this.isConnected) {
      console.log('[BattleWebSocket] 연결 진행 중입니다. roomId:', this.roomId);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      console.error('[BattleWebSocket] 토큰을 찾을 수 없습니다.');
      return;
    }

    if (roomId) {
      this.roomId = roomId;
    }

    // WebSocket URL 구성: 순수 WebSocket 사용 (http(s):// → ws(s):// 변환)
    // 문서 기준: ws://{gateway-host}/ws/versus?token={JWT_TOKEN}
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const wsBaseUrl = API_BASE_URL.replace(/^https?:\/\//, (match) => {
      return match === 'https://' ? 'wss://' : 'ws://';
    });
    const wsUrl = `${wsBaseUrl}/ws/versus?token=${encodeURIComponent(token)}`;

    console.log('[BattleWebSocket] 연결 시도:', wsUrl.replace(token, 'TOKEN_HIDDEN'));

    // STOMP 클라이언트 생성 (순수 WebSocket 사용)
    // 토큰은 URL 쿼리 파라미터와 CONNECT 헤더 모두에 전달
    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        // STOMP CONNECT 프레임에 토큰을 헤더로도 전달 (서버 요구사항에 따라)
        // 일부 서버는 헤더로 토큰을 받을 수 있음
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('[BattleWebSocket] STOMP 디버그:', str);
      },
      logRawCommunication: true,
      // 연결 타임아웃 설정 (서버 응답 대기 시간)
      connectionTimeout: 10000, // 10초로 증가
      onConnect: (frame) => {
        console.log('[BattleWebSocket] 연결 성공 (CONNECTED 수신), roomId:', this.roomId, 'frame:', frame);
        console.log('[BattleWebSocket] CONNECTED 프레임 상세:', {
          command: frame.command,
          headers: frame.headers,
          body: frame.body
        });
        this.isConnected = true;
        
        // 연결 타임아웃 클리어 (전역 변수에 저장된 경우)
        if ((this as any).connectionTimeoutId) {
          clearTimeout((this as any).connectionTimeoutId);
          delete (this as any).connectionTimeoutId;
        }
        
        // STOMP 연결 완료 후 약간의 지연을 두고 구독 및 JOIN_ROOM 전송
        // STOMP 클라이언트가 완전히 준비될 때까지 대기
        setTimeout(() => {
          console.log('[BattleWebSocket] 구독 및 JOIN_ROOM 시작, roomId:', this.roomId);
          console.log('[BattleWebSocket] 클라이언트 상태:', {
            active: this.client?.active,
            connected: this.isConnected,
            roomId: this.roomId
          });
          
          this.subscribeToQueues();
          if (this.roomId) {
            this.subscribeToRoom(this.roomId);
            // 연결 성공 후 자동으로 JOIN_ROOM 전송 (초기 연결 및 재연결 모두)
            setTimeout(() => {
              console.log('[BattleWebSocket] JOIN_ROOM 전송 시도, roomId:', this.roomId);
              this.joinRoom(this.roomId);
            }, 100);
          }
        }, 100);
      },
      onDisconnect: () => {
        console.log('[BattleWebSocket] 연결 해제, roomId:', this.roomId);
        this.isConnected = false;
        this.subscriptions = [];
        // 연결 해제 시 heartbeat 중단
        this.stopHeartbeat();
      },
      onStompError: (frame) => {
        console.error('[BattleWebSocket] STOMP 에러, roomId:', this.roomId, 'frame:', frame);
        console.error('[BattleWebSocket] STOMP 에러 상세:', {
          command: frame.command,
          headers: frame.headers,
          body: frame.body
        });
        // STOMP 에러 발생 시 연결 상태 업데이트
        this.isConnected = false;
      },
      onWebSocketError: (event) => {
        console.error('[BattleWebSocket] WebSocket 에러, roomId:', this.roomId, 'event:', event);
        this.isConnected = false;
      },
      onError: (frame) => {
        console.error('[BattleWebSocket] 일반 에러, roomId:', this.roomId, 'frame:', frame);
        console.error('[BattleWebSocket] 에러 프레임 상세:', {
          command: frame.command,
          headers: frame.headers,
          body: frame.body
        });
        this.isConnected = false;
      },
      // CONNECT 전송 전 콜백
      beforeConnect: () => {
        console.log('[BattleWebSocket] CONNECT 전송 전, roomId:', this.roomId);
      },
      // 연결 실패 시 콜백
      onClose: (event) => {
        console.log('[BattleWebSocket] WebSocket 연결 종료, roomId:', this.roomId, 'event:', event);
        this.isConnected = false;
      },
    });

    // 연결 타임아웃 감지 (5초 후 CONNECTED가 없으면 에러)
    (this as any).connectionTimeoutId = setTimeout(() => {
      if (!this.isConnected && this.client) {
        console.error('[BattleWebSocket] ⚠️ 연결 타임아웃: CONNECTED 응답을 받지 못했습니다. roomId:', this.roomId);
        console.error('[BattleWebSocket] 가능한 원인:');
        console.error('  1. 서버가 STOMP CONNECT 프레임을 처리하지 못함');
        console.error('  2. 인증 실패 (토큰이 잘못되었거나 만료됨)');
        console.error('  3. 서버가 CONNECTED 프레임을 보내지 않음');
        console.error('  4. 네트워크 문제');
        console.error('[BattleWebSocket] 브라우저 개발자 도구의 Network 탭에서 WebSocket 연결을 확인하세요.');
        console.error('[BattleWebSocket] 서버 로그에서 STOMP CONNECT 프레임 수신 여부를 확인하세요.');
      }
    }, 5000);

    // 연결 활성화
    console.log('[BattleWebSocket] 클라이언트 활성화 시작, roomId:', this.roomId);
    try {
      this.client.activate();
      console.log('[BattleWebSocket] 클라이언트 activate() 호출 완료, roomId:', this.roomId);
      console.log('[BattleWebSocket] STOMP CONNECT 프레임 전송 대기 중...');
    } catch (error) {
      if ((this as any).connectionTimeoutId) {
        clearTimeout((this as any).connectionTimeoutId);
        delete (this as any).connectionTimeoutId;
      }
      console.error('[BattleWebSocket] 클라이언트 activate() 실패, roomId:', this.roomId, 'error:', error);
    }
  }

  /**
   * 개인 큐를 구독합니다.
   * 문서 기준: 개별 큐 구독
   * - /user/queue/versus/match: 매칭 응답
   * - /user/queue/versus/join: 방 참가 응답
   * - /user/queue/versus/answer: 답안 제출 응답
   * - /user/queue/versus/heartbeat: 하트비트 응답
   */
  private subscribeToQueues(): void {
    console.log('[BattleWebSocket] subscribeToQueues 호출, client:', !!this.client, 'isConnected:', this.isConnected, 'active:', this.client?.active);
    if (!this.client || !this.isConnected) {
      console.error('[BattleWebSocket] 클라이언트가 연결되지 않았습니다. roomId:', this.roomId, {
        client: !!this.client,
        isConnected: this.isConnected,
        active: this.client?.active
      });
      return;
    }

    const personalQueues = [
      '/user/queue/versus/match',
      '/user/queue/versus/join',
      '/user/queue/versus/answer',
      '/user/queue/versus/heartbeat',
    ];

    personalQueues.forEach((queue) => {
      // 이미 구독 중인지 확인
      const existingSubscription = this.subscriptions.find((sub) => {
        // @ts-ignore - 내부 속성 접근
        return sub.destination === queue;
      });

      if (existingSubscription) {
        console.log(`[BattleWebSocket] 이미 구독 중: ${queue}, roomId:`, this.roomId);
        return;
      }

      const subscription = this.client!.subscribe(queue, (message) => {
        this.handleMessage(queue, message);
      });
      
      this.subscriptions.push(subscription);
      console.log(`[BattleWebSocket] 구독 완료: ${queue}, roomId:`, this.roomId);
    });
  }

  /**
   * 방 이벤트를 구독합니다.
   * 문서 기준: /topic/versus/rooms/{roomId}
   * @param roomId 방 ID
   */
  subscribeToRoom(roomId: number): void {
    console.log('[BattleWebSocket] subscribeToRoom 호출, roomId:', roomId, 'client:', !!this.client, 'isConnected:', this.isConnected, 'active:', this.client?.active);
    if (!this.client || !this.isConnected) {
      console.error('[BattleWebSocket] 클라이언트가 연결되지 않았습니다. roomId:', roomId, {
        client: !!this.client,
        isConnected: this.isConnected,
        active: this.client?.active
      });
      return;
    }

    const roomTopic = `/topic/versus/rooms/${roomId}`;
    
    // 이미 구독 중인지 확인
    const existingSubscription = this.subscriptions.find((sub) => {
      // @ts-ignore - 내부 속성 접근
      return sub.destination === roomTopic;
    });

    if (existingSubscription) {
      console.log(`[BattleWebSocket] 이미 구독 중: ${roomTopic}, roomId:`, roomId);
      return;
    }

    const subscription = this.client.subscribe(roomTopic, (message) => {
      this.handleMessage(roomTopic, message);
    });

    this.subscriptions.push(subscription);
    this.roomId = roomId;
    console.log(`[BattleWebSocket] 방 구독 완료: ${roomTopic}, roomId:`, roomId);
  }

  /**
   * 메시지를 처리합니다.
   * 문서 기준:
   * - /user/queue/versus/match: MATCH_RESPONSE (type: "MATCH_RESPONSE")
   * - /user/queue/versus/join: JOIN_ROOM_RESPONSE (type: "JOIN_ROOM_RESPONSE", snapshot 포함)
   * - /user/queue/versus/answer: SUBMIT_ANSWER_RESPONSE (type: "SUBMIT_ANSWER_RESPONSE")
   * - /user/queue/versus/heartbeat: HEARTBEAT_RESPONSE (type: "HEARTBEAT_RESPONSE")
   * - /topic/versus/rooms/{roomId}: 방 브로드캐스트 이벤트 (eventType 필드 사용)
   * @param destination 구독 대상 (큐 또는 토픽)
   * @param message STOMP 메시지
   */
  private handleMessage(destination: string, message: { body: string }): void {
    try {
      const data = JSON.parse(message.body);

      // 개인 큐 응답 처리 (type 필드 사용)
      if (destination.startsWith('/user/queue/versus/')) {
        const responseType = data.type as ResponseType;

        switch (destination) {
          case '/user/queue/versus/match':
            if (responseType === 'MATCH_RESPONSE') {
              const matchResponse = data as MatchResponse;
              console.log('[BattleWebSocket] MATCH_RESPONSE 수신:', matchResponse);
              
              if (this.matchResponseCallback) {
                this.matchResponseCallback(matchResponse);
              }

              // 매칭 성공 시 roomId 저장 및 방 구독
              if (matchResponse.success && matchResponse.roomId && !matchResponse.matching) {
                this.roomId = matchResponse.roomId;
                this.subscribeToRoom(matchResponse.roomId);
                this.joinRoom(matchResponse.roomId);
              }
            }
            return;

          case '/user/queue/versus/join':
            if (responseType === 'JOIN_ROOM_RESPONSE' && data.snapshot) {
              const snapshot = data.snapshot as JoinRoomSnapshot;
              console.log('[BattleWebSocket] JOIN_ROOM_RESPONSE 수신, roomId:', data.roomId, snapshot);
              
              if (this.snapshotCallback) {
                this.snapshotCallback(snapshot);
              }
              
              // JOIN_ROOM 성공 후 heartbeat 시작
              if (this.roomId && !this.isMatchFinished) {
                this.startHeartbeat(this.roomId);
              }
            }
            return;

          case '/user/queue/versus/answer':
            if (responseType === 'SUBMIT_ANSWER_RESPONSE') {
              console.log('[BattleWebSocket] SUBMIT_ANSWER_RESPONSE 수신:', data);
              
              if (this.submitAnswerResponseCallback) {
                this.submitAnswerResponseCallback(data);
              }
            }
            return;

          case '/user/queue/versus/heartbeat':
            if (responseType === 'HEARTBEAT_RESPONSE') {
              // 하트비트 응답은 로그만 남김 (필요시 콜백 추가 가능)
              console.log('[BattleWebSocket] HEARTBEAT_RESPONSE 수신, roomId:', data.roomId);
            }
            return;
        }
      }

      // 방 토픽 이벤트 처리 (eventType 필드 사용)
      if (destination.startsWith('/topic/versus/rooms/')) {
        const event: BattleEvent = data;
        const eventType = event.eventType;

        if (!eventType) {
          console.warn('[BattleWebSocket] eventType이 없는 메시지:', data);
          return;
        }

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
      }
    } catch (error) {
      console.error('[BattleWebSocket] 메시지 파싱 실패:', error, message.body);
    }
  }

  /**
   * WebSocket 연결을 해제합니다.
   */
  disconnect(): void {
    if (!this.client) {
      return;
    }

    // heartbeat 중단
    this.stopHeartbeat();

    // 모든 구독 해제
    this.subscriptions.forEach((subscription) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('[BattleWebSocket] 구독 해제 실패:', error);
      }
    });
    this.subscriptions = [];

    // 연결 해제
    if (this.client.active) {
      this.client.deactivate();
    }

    const disconnectedRoomId = this.roomId;
    this.client = null;
    this.isConnected = false;
    this.roomId = null;
    this.isMatchFinished = false;
    console.log('[BattleWebSocket] 연결 해제 완료, roomId:', disconnectedRoomId);
  }

  /**
   * 매칭 요청을 전송합니다.
   * 문서 기준: /app/versus/match/request
   * 응답: /user/queue/versus/match 큐에서 수신
   * @param params 매칭 요청 파라미터
   */
  requestMatch(params: {
    mode: "DUEL" | "TOURNAMENT";
    certId: string;
    matchingMode?: "CATEGORY" | "DIFFICULTY"; // DUEL 모드일 때 필수
    topicId?: number; // CATEGORY 모드일 때 필수
    difficulty?: "EASY" | "NORMAL" | "HARD"; // DIFFICULTY 모드일 때 필수
    examMode: "WRITTEN" | "PRACTICAL";
  }): void {
    if (!this.client || !this.isConnected) {
      console.error('[BattleWebSocket] 클라이언트가 연결되지 않았습니다.');
      return;
    }

    const destination = '/app/versus/match/request';
    // 문서 기준: command 필드 추가
    const body = JSON.stringify({
      command: "REQUEST_MATCH",
      ...params
    });

    this.client.publish({
      destination,
      body,
    });

    console.log('[BattleWebSocket] 매칭 요청 전송:', params);
  }

  /**
   * 매칭 취소를 전송합니다.
   * 문서 기준: /app/versus/match/cancel
   * 응답: /user/queue/versus/match 큐에서 수신
   * @param mode 게임 모드 ("DUEL" 또는 "TOURNAMENT")
   */
  cancelMatch(mode: "DUEL" | "TOURNAMENT"): void {
    if (!this.client || !this.isConnected) {
      console.error('[BattleWebSocket] 클라이언트가 연결되지 않았습니다.');
      return;
    }

    const destination = '/app/versus/match/cancel';
    const body = JSON.stringify({
      command: "CANCEL_MATCH",
      mode: mode
    });

    this.client.publish({
      destination,
      body,
    });

    console.log('[BattleWebSocket] 매칭 취소 전송:', mode);
  }

  /**
   * JOIN_ROOM 메시지를 전송합니다.
   * 문서 기준: /app/versus/join
   * @param roomId 방 ID
   */
  joinRoom(roomId: number): void {
    console.log('[BattleWebSocket] joinRoom 호출, roomId:', roomId, 'client:', !!this.client, 'isConnected:', this.isConnected, 'active:', this.client?.active);
    if (!this.client || !this.isConnected) {
      console.error('[BattleWebSocket] 클라이언트가 연결되지 않았습니다. roomId:', roomId, {
        client: !!this.client,
        isConnected: this.isConnected,
        active: this.client?.active
      });
      return;
    }

    if (!this.client.active) {
      console.error('[BattleWebSocket] STOMP 클라이언트가 활성화되지 않았습니다. roomId:', roomId);
      return;
    }

    this.roomId = roomId;
    this.isMatchFinished = false;

    const destination = '/app/versus/join';
    const body = JSON.stringify({ roomId });

    try {
      this.client.publish({
        destination,
        body,
      });
      console.log('[BattleWebSocket] JOIN_ROOM 전송 성공, roomId:', roomId, 'destination:', destination, 'body:', body);
    } catch (error) {
      console.error('[BattleWebSocket] JOIN_ROOM 전송 실패, roomId:', roomId, 'error:', error);
    }
  }

  /**
   * 답안을 제출합니다.
   * 문서 기준: /app/versus/answer
   * 응답: /user/queue/versus/answer 큐에서 SUBMIT_ANSWER_RESPONSE 수신
   * @param roomId 방 ID
   * @param questionId 문제 ID
   * @param userAnswer 사용자 답안
   */
  submitAnswer(
    roomId: number,
    questionId: number,
    userAnswer: string
  ): void {
    if (!this.client || !this.isConnected) {
      console.error('[BattleWebSocket] 클라이언트가 연결되지 않았습니다. roomId:', roomId);
      return;
    }

    const destination = '/app/versus/answer';
    const body = JSON.stringify({
      roomId,
      questionId,
      userAnswer
    });

    this.client.publish({
      destination,
      body,
    });

    console.log('[BattleWebSocket] ANSWER 제출, roomId:', roomId, 'questionId:', questionId);
  }

  /**
   * HEARTBEAT를 전송합니다.
   * 문서 기준: /app/versus/heartbeat
   * 응답: /user/queue/versus/heartbeat 큐에서 HEARTBEAT_RESPONSE 수신
   * @param roomId 방 ID
   */
  private sendHeartbeat(roomId: number): void {
    if (!this.client || !this.isConnected) {
      console.warn('[BattleWebSocket] HEARTBEAT 전송 실패 - 연결되지 않음, roomId:', roomId);
      return;
    }

    const destination = '/app/versus/heartbeat';
    const body = JSON.stringify({
      roomId: roomId
    });

    this.client.publish({
      destination,
      body,
    });

    console.log('[BattleWebSocket] HEARTBEAT 전송, roomId:', roomId);
  }

  /**
   * HEARTBEAT를 시작합니다.
   * 문서 기준: 5-10초마다 전송 (10초로 설정)
   * @param roomId 방 ID
   */
  private startHeartbeat(roomId: number): void {
    // 이미 실행 중이면 중복 실행 방지
    if (this.heartbeatIntervalId) {
      console.log('[BattleWebSocket] HEARTBEAT 이미 실행 중입니다. roomId:', roomId);
      return;
    }

    // 즉시 한 번 전송
    this.sendHeartbeat(roomId);

    // 10초마다 전송 (문서 권장: 5-10초)
    this.heartbeatIntervalId = setInterval(() => {
      if (this.isMatchFinished) {
        this.stopHeartbeat();
        return;
      }
      this.sendHeartbeat(roomId);
    }, 10000);

    console.log('[BattleWebSocket] HEARTBEAT 시작, roomId:', roomId);
  }

  /**
   * HEARTBEAT를 중단합니다.
   */
  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
      console.log('[BattleWebSocket] HEARTBEAT 중단, roomId:', this.roomId);
    }
  }

  /**
   * 연결 상태를 반환합니다.
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
