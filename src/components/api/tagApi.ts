import axios from "./axiosConfig";

export interface TagInfo {
  code: string;
  labelKo: string;
  labelEn?: string;
  description?: string;
  domain: string;
  orderNo: number;
}

/**
 * 태그 코드로 태그 정보 조회
 * @param codes 태그 코드 배열
 * @returns 태그 정보 배열
 */
export async function getTagsByCodes(codes: string[]): Promise<TagInfo[]> {
  if (codes.length === 0) return [];
  
  const codesParam = codes.join(",");
  const res = await axios.get(`/study/tags/by-codes`, {
    params: { codes: codesParam }
  });
  
  // 응답이 배열인지 객체인지 확인
  if (Array.isArray(res.data)) {
    return res.data;
  }
  
  // 단일 객체인 경우 배열로 변환
  return [res.data];
}

