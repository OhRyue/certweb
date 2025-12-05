import axios from "./axiosConfig";

// 매칭 모드 타입
export type MatchingMode = "CATEGORY" | "DIFFICULTY";

// 시험 모드 타입
export type ExamMode = "WRITTEN" | "PRACTICAL";

// 난이도 타입
export type Difficulty = "EASY" | "NORMAL" | "HARD";

// 매칭 요청 파라미터
export interface MatchRequestParams {
  mode: "DUEL";
  certId: string;
  matchingMode: MatchingMode;
  topicId?: number; // CATEGORY 모드일 때 필수
  difficulty?: Difficulty; // DIFFICULTY 모드일 때 필수
  examMode: ExamMode;
}

// 토너먼트 매칭 요청 파라미터
export interface TournamentMatchRequestParams {
  mode: "TOURNAMENT";
  certId: string;
  examMode: ExamMode;
}

// 매칭 요청 응답
export interface MatchRequestResponse {
  matchId: string;
  status: "WAITING" | "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  opponent?: {
    userId: string;
    nickname: string | null; // account-service 호출 실패 시 null
    skinId: number; // 프로필 조회 실패 시 기본값 1
    avatarUrl?: string;
    level?: number;
  };
  roomId?: string;
  createdAt: string;
}

/**
 * 1:1 배틀 매칭 요청
 * @param params 매칭 요청 파라미터
 * @returns 매칭 요청 응답 데이터
 */
export async function requestMatch(params: MatchRequestParams): Promise<MatchRequestResponse> {
  const response = await axios.post<MatchRequestResponse>("/versus/match/request", params);
  return response.data;
}

/**
 * 토너먼트 매칭 요청
 * @param params 토너먼트 매칭 요청 파라미터
 * @returns 매칭 상태 응답 데이터
 */
export async function requestTournamentMatch(params: TournamentMatchRequestParams): Promise<MatchStatusResponse> {
  const response = await axios.post<MatchStatusResponse>("/versus/match/request", params);
  return response.data;
}

// 매칭 상태 조회 응답 (현재 사용자의 매칭 상태)
export interface MatchStatusResponse {
  matching: boolean;
  roomId: number | null;
  waitingCount: number;
  startedAt?: string;
}

/**
 * 매칭 상태 조회 (현재 사용자의 매칭 상태)
 * @returns 매칭 상태 응답 데이터
 */
export async function getMatchStatus(): Promise<MatchStatusResponse> {
  const response = await axios.get<MatchStatusResponse>("/versus/match/status");
  return response.data;
}

/**
 * 매칭 상태 조회 (matchId 기반 - 레거시 지원)
 * @param matchId 매칭 ID
 * @returns 매칭 상태 응답 데이터
 */
export async function getMatchStatusById(matchId: string): Promise<MatchRequestResponse> {
  const response = await axios.get<MatchRequestResponse>(`/versus/match/${matchId}`);
  return response.data;
}

// 봇 매칭 요청 파라미터
export interface BotMatchParams {
  examMode: ExamMode;
  scopeType: MatchingMode;
  topicId?: number; // CATEGORY 모드일 때 필수
  difficulty?: Difficulty; // DIFFICULTY 모드일 때 필수
}

// 봇 매칭 응답
export interface BotMatchResponse {
  roomId: number;
  myUserId: string;
  botUserId: string;
  botNickname: string | null; // account-service 호출 실패 시 null
  botSkinId: number; // 프로필 조회 실패 시 기본값 1
  scopeJson: string;
}

/**
 * 봇과 매칭
 * @param params 봇 매칭 요청 파라미터
 * @returns 봇 매칭 응답 데이터
 */
export async function matchWithBot(params: BotMatchParams): Promise<BotMatchResponse> {
  // 쿼리 파라미터로 전달
  const queryParams: Record<string, string | number> = {
    examMode: params.examMode,
    scopeType: params.scopeType,
  };
  
  if (params.topicId !== undefined) {
    queryParams.topicId = params.topicId;
  }
  
  if (params.difficulty !== undefined) {
    queryParams.difficulty = params.difficulty;
  }
  
  const response = await axios.post<BotMatchResponse>("/versus/match/duel/bot", null, {
    params: queryParams,
  });
  return response.data;
}

// 방 참가자 정보
export interface RoomParticipant {
  userId: string;
  nickname: string | null; // account-service 호출 실패 시 null
  skinId: number; // 프로필 조회 실패 시 기본값 1
  finalScore: number;
  rank: number;
  alive: boolean;
  revived: boolean;
  joinedAt: string;
}

// 방 문제 정보
export interface RoomQuestion {
  questionId: number;
  roundNo: number;
  phase: "MAIN";
  order: number;
  timeLimitSec: number;
}

// 스코어보드 항목
export interface ScoreboardItem {
  userId: string;
  nickname: string | null; // account-service 호출 실패 시 null
  skinId: number; // 프로필 조회 실패 시 기본값 1
  correctCount: number;
  totalCount: number;
  score: number;
  totalTimeMs: number;
  rank: number;
  alive: boolean;
  revived: boolean;
}

// 스코어보드
export interface CurrentQuestion {
  questionId: number;
  roundNo: number;
  phase: string;
  orderNo: number;
  timeLimitSec: number;
  endTime: string; // ISO 8601 형식
}

export interface Scoreboard {
  roomId: number;
  status: string;
  items: ScoreboardItem[];
  currentQuestion?: CurrentQuestion;
}

// 방 정보
export interface RoomInfo {
  roomId: number;
  mode: "DUEL" | "GOLDENBELL" | "TOURNAMENT";
  status: "WAIT" | "IN_PROGRESS" | "ONGOING" | "COMPLETED" | "CANCELLED";
  participantCount: number;
  createdAt: string;
  scheduledAt?: string; // 예약된 시작 시간 (ISO 8601 형식)
}

// 방 정보 조회 응답
export interface RoomDetailResponse {
  room: RoomInfo;
  participants: RoomParticipant[];
  questions: RoomQuestion[];
  tournamentBracketJson: string;
  goldenbellRuleJson: string;
  scoreboard: Scoreboard;
}

/**
 * 방 정보 조회
 * @param roomId 방 ID
 * @returns 방 정보 응답 데이터
 */
export async function getRoomDetail(roomId: number): Promise<RoomDetailResponse> {
  const response = await axios.get<RoomDetailResponse>(`/versus/rooms/${roomId}`);
  return response.data;
}

/**
 * roomId를 localStorage에 저장
 * @param roomId 방 ID
 */
export function saveRoomId(roomId: number): void {
  localStorage.setItem("currentRoomId", String(roomId));
}

/**
 * localStorage에서 roomId 가져오기
 * @returns 방 ID 또는 null
 */
export function getSavedRoomId(): number | null {
  const roomId = localStorage.getItem("currentRoomId");
  return roomId ? Number(roomId) : null;
}

/**
 * localStorage에서 roomId 제거
 */
export function clearRoomId(): void {
  localStorage.removeItem("currentRoomId");
}

// 타임라인 이벤트
export interface TimelineEvent {
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

// 실시간 스냅샷
export interface RealtimeSnapshot {
  scoreboard: Scoreboard;
  activeRound: number;
  activePhase: "MAIN" | string;
  updatedAt: string;
}

// 방 상태 조회 응답
export interface RoomStateResponse {
  detail: RoomDetailResponse;
  timeline: TimelineEvent[];
  realtime: RealtimeSnapshot;
}

/**
 * 방 상태 조회 (상세 정보 + 타임라인 + 실시간 스냅샷)
 * 1초 폴링으로 사용하여 실시간 상태를 갱신할 수 있습니다.
 * @param roomId 방 ID
 * @param limit 타임라인 이벤트 조회 개수 (기본값: 50)
 * @returns 방 상태 응답 데이터
 */
export async function getRoomState(roomId: number, limit: number = 50): Promise<RoomStateResponse> {
  const response = await axios.get<RoomStateResponse>(`/versus/rooms/${roomId}/state`, {
    params: {
      limit,
    },
  });
  return response.data;
}

/**
 * 스코어보드 조회
 * 1초 폴링으로 사용하여 실시간 스코어보드를 갱신할 수 있습니다.
 * @param roomId 방 ID
 * @returns 스코어보드 응답 데이터
 */
export async function getScoreboard(roomId: number): Promise<Scoreboard> {
  const response = await axios.get<Scoreboard>(`/versus/rooms/${roomId}/scoreboard`);
  return response.data;
}

/**
 * 방의 문제 목록 조회
 * order 기준으로 정렬하여 문제 진행 순서를 관리할 수 있습니다.
 * @param roomId 방 ID
 * @returns 문제 목록 (order 기준 정렬됨)
 */
export async function getRoomQuestions(roomId: number): Promise<RoomQuestion[]> {
  const response = await axios.get<RoomQuestion[]>(`/versus/rooms/${roomId}/questions`);
  // order 기준으로 정렬하여 반환
  return response.data.sort((a, b) => a.order - b.order);
}

// 답안 제출 요청 파라미터
export interface SubmitAnswerParams {
  questionId: number;
  userAnswer: string; // 반드시 제공 (예: "A", "B", "C", "D")
  correct: boolean;
  timeMs: number; // 소요 시간 (밀리초)
  roundNo: number;
  phase: "MAIN" | "REVIVAL";
}

// 답안 제출 응답
export interface SubmitAnswerResponse {
  roomId: number;
  status: string;
  items: ScoreboardItem[];
}

/**
 * 답안 제출
 * @param roomId 방 ID
 * @param params 답안 제출 파라미터
 * @returns 스코어보드 응답 데이터
 */
export async function submitAnswer(roomId: number, params: SubmitAnswerParams): Promise<SubmitAnswerResponse> {
  const response = await axios.post<SubmitAnswerResponse>(`/versus/rooms/${roomId}/answers`, params);
  return response.data;
}

// 골든벨 봇전 시작 응답
export interface GoldenBellBotMatchResponse {
  roomId: number;
  myUserId: string;
  botUserIds: string[];
}

/**
 * 골든벨 봇전 시작
 * 호출 시 방이 생성됩니다. 사용자+봇19명이 참가하여 매치를 시작합니다. 첫 번째 문제 시작이 자동으로 진행됩니다.
 * @param examMode 시험 모드 (WRITTEN/PRACTICAL)
 * @returns 골든벨 봇전 시작 응답 데이터
 */
export async function startGoldenBellBotMatch(examMode: ExamMode): Promise<GoldenBellBotMatchResponse> {
  const response = await axios.post<GoldenBellBotMatchResponse>(
    `/versus/match/goldenbell/bot`,
    null,
    {
      params: {
        examMode,
      },
    }
  );
  return response.data;
}

// 문제 상세 정보 응답
export interface VersusQuestionResponse {
  questionId?: number;
  id?: number; // API 응답에 따라 id 또는 questionId 사용
  mode: "WRITTEN" | "PRACTICAL";
  type: "OX" | "MULTIPLE" | "MCQ" | "SHORT" | "LONG";
  difficulty: "EASY" | "NORMAL" | "HARD";
  stem: string;
  answerKey: string;
  solutionText: string;
  payloadJson: {
    choices?: Array<{
      label: string;
      content: string;
      correct: boolean;
    }>;
    [key: string]: unknown;
  };
}

/**
 * 문제 상세 정보 조회
 * 스코어보드에서 받은 currentQuestion.questionId를 사용합니다.
 * @param questionId 문제 ID
 * @returns 문제 상세 정보
 */
export async function getVersusQuestion(questionId: number): Promise<VersusQuestionResponse> {
  const response = await axios.get<VersusQuestionResponse>(`/study/versus/questions/${questionId}`);
  return response.data;
}

// 골든벨 답안 제출 요청 파라미터 (roundNo, phase 없이)
export interface GoldenBellSubmitAnswerParams {
  questionId: number;
  userAnswer: string;
  correct: boolean;
  timeMs: number | null;
}

/**
 * 골든벨 답안 제출
 * @param roomId 방 ID
 * @param params 답안 제출 파라미터
 * @returns 스코어보드 응답 데이터
 */
export async function submitGoldenBellAnswer(
  roomId: number,
  params: GoldenBellSubmitAnswerParams
): Promise<SubmitAnswerResponse> {
  const response = await axios.post<SubmitAnswerResponse>(
    `/versus/rooms/${roomId}/answers`,
    params
  );
  return response.data;
}

// 골든벨 답안 정보 항목
export interface QuestionAnswerItem {
  userId: string;
  nickname: string | null; // account-service 호출 실패 시 null
  skinId: number; // 프로필 조회 실패 시 기본값 1
  userAnswer: string;
  correct: boolean;
  timeMs: number;
  scoreDelta: number;
  submittedAt: string;
}

// 골든벨 답안 정보 응답
export interface QuestionAnswersResponse {
  questionId: number;
  answers: QuestionAnswerItem[];
}

/**
 * 골든벨 문제별 답안 정보 조회
 * @param roomId 방 ID
 * @param questionId 문제 ID
 * @returns 답안 정보 응답 데이터
 */
export async function getQuestionAnswers(
  roomId: number,
  questionId: number
): Promise<QuestionAnswersResponse> {
  const response = await axios.get<QuestionAnswersResponse>(
    `/versus/rooms/${roomId}/questions/${questionId}/answers`
  );
  return response.data;
}

/**
 * 닉네임이 null일 때 userId를 반환하는 유틸리티 함수
 * @param nickname 닉네임 (null 가능)
 * @param userId 사용자 ID
 * @returns 닉네임 또는 사용자 ID
 */
export function getDisplayName(nickname: string | null | undefined, userId: string): string {
  return nickname || userId;
}

// ===== 방 생성 API =====

// 방 생성 요청 파라미터
export interface CreateRoomParams {
  mode: "DUEL" | "TOURNAMENT" | "GOLDENBELL";
  scopeJson: string; // JSON 문자열: {"examMode":"WRITTEN","difficulty":"NORMAL","topicScope":"ALL"}
  scheduledAt?: string; // ISO 8601 형식 (UTC 기준), 선택사항
  participants?: string[]; // 초대할 사용자 ID 리스트, 선택사항
}

// 방 생성 응답
export interface CreateRoomResponse {
  room: RoomInfo;
  participants: RoomParticipant[];
  questions: RoomQuestion[];
  tournamentBracketJson: string | null;
  goldenbellRuleJson: string | null;
  scoreboard: Scoreboard;
}

/**
 * 새로운 대전 방 생성
 * @param params 방 생성 파라미터
 * @returns 방 생성 응답 데이터
 */
export async function createRoom(params: CreateRoomParams): Promise<CreateRoomResponse> {
  const response = await axios.post<CreateRoomResponse>("/versus/rooms", params);
  return response.data;
}

/**
 * 골든벨 사람전 방 생성 (간편 함수)
 * @param examMode 시험 모드 (WRITTEN/PRACTICAL)
 * @param difficulty 난이도 (EASY/NORMAL/HARD)
 * @param scheduledAt 시작 시각 (ISO 8601 형식, UTC 기준)
 * @returns 방 생성 응답 데이터
 */
export async function createGoldenBellRoom(
  examMode: ExamMode,
  difficulty: Difficulty,
  scheduledAt: string
): Promise<CreateRoomResponse> {
  const scopeJson = JSON.stringify({
    examMode: examMode,
    difficulty: difficulty,
    topicScope: "ALL"
  });

  return createRoom({
    mode: "GOLDENBELL",
    scopeJson: scopeJson,
    scheduledAt: scheduledAt
  });
}

// 예약된 방 목록 항목
export interface ScheduledRoom {
  roomId: number;
  mode: "DUEL" | "TOURNAMENT" | "GOLDENBELL";
  status: "WAIT" | "IN_PROGRESS" | "ONGOING" | "COMPLETED" | "CANCELLED";
  participantCount: number;
  createdAt: string;
  scheduledAt: string;
}

/**
 * 예약된 방 목록 조회
 * @param mode 게임 모드 (GOLDENBELL, TOURNAMENT, DUEL)
 * @returns 예약된 방 목록
 */
export async function getScheduledRooms(mode: "GOLDENBELL" | "TOURNAMENT" | "DUEL"): Promise<ScheduledRoom[]> {
  const response = await axios.get<ScheduledRoom[]>("/versus/rooms/scheduled", {
    params: {
      mode: mode
    }
  });
  return response.data;
}

/**
 * 방 참가
 * JWT 토큰에서 현재 로그인한 사용자 ID를 자동으로 가져옵니다.
 * 방 상태가 WAIT일 때만 참가 가능합니다.
 * scheduledAt이 설정된 경우, 시작 10분 전부터 입장 가능합니다.
 * @param roomId 참가할 방 ID
 * @returns 방 참가 응답 데이터 (CreateRoomResponse와 동일한 구조)
 */
export async function joinRoom(roomId: number): Promise<CreateRoomResponse> {
  const response = await axios.post<CreateRoomResponse>(`/versus/rooms/${roomId}/join`);
  return response.data;
}

// Heartbeat 응답
export interface HeartbeatResponse {
  message: string;
  success: boolean;
}

/**
 * Heartbeat 전송
 * 대기실에서 30초마다 호출하여 연결 상태 유지
 * 1분 이상 heartbeat가 없으면 백엔드에서 자동 추방
 * @param roomId 방 ID
 * @returns Heartbeat 응답
 */
export async function sendHeartbeat(roomId: number): Promise<HeartbeatResponse> {
  const response = await axios.post<HeartbeatResponse>(`/versus/rooms/${roomId}/heartbeat`);
  return response.data;
}

