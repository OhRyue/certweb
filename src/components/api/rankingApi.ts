import axios from "./axiosConfig";

// 랭킹 스코프 타입
export type RankingScope = "OVERALL" | "WEEKLY" | "HALL_OF_FAME";

// 랭킹 사용자 정보
export interface RankingUser {
  userId: string;
  nickname: string;
  skinId: number;
  score: number;
  rank: number;
  xp: number;
  streak: number;
  lastUpdatedAt: string;
}

// 랭킹 응답 타입
export interface RankingResponse {
  scope: RankingScope;
  reference: string;
  generatedAt: string;
  top: RankingUser[];
  me: RankingUser | null;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// 랭킹 API 파라미터
export interface RankingParams {
  scope: RankingScope;
  reference?: string; // 날짜, 비워두면 오늘 기준
  page?: number;
  size?: number;
}

/**
 * 랭킹 데이터를 가져옵니다.
 * @param params 랭킹 조회 파라미터
 * @returns 랭킹 응답 데이터
 */
export async function getRankings(params: RankingParams): Promise<RankingResponse> {
  const { scope, reference, page = 0, size = 10 } = params;
  
  const queryParams: Record<string, string | number> = {
    page,
    size,
  };
  
  if (reference) {
    queryParams.reference = reference;
  }
  
  const response = await axios.get<RankingResponse>(`/progress/rankings/${scope}`, {
    params: queryParams,
  });
  
  return response.data;
}

