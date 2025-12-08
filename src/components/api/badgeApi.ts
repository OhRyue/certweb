import axios from "./axiosConfig";

// 배지 정보
export interface BadgeInfo {
  code: string;
  name: string;
  rarity: string;
  earnedAt?: string; // earned 배열에만 있음
  owned?: boolean; // catalog 배열에만 있음
}

// 배지 통계
export interface BadgeStats {
  totalEarned: number;
  totalAvailable: number;
  byRarity: Array<{
    rarity: string;
    earned: number;
    total: number;
  }>;
}

// 내 배지 조회 응답
export interface MyBadgeResponse {
  earned: BadgeInfo[];
  catalog: BadgeInfo[];
  stats: BadgeStats;
}

/**
 * 내 배지를 조회합니다.
 * @returns 내 배지 응답 데이터
 */
export async function getMyBadges(): Promise<MyBadgeResponse> {
  const response = await axios.get<MyBadgeResponse>("/progress/badge/my");
  return response.data;
}

