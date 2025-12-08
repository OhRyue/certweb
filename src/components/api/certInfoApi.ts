import axios from "./axiosConfig";

// 동기화 응답 타입
export interface SyncResponse {
  name: string;
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
  failed: boolean;
  message: string | null;
}

// 동기화 파라미터
export interface SyncParams {
  source: string; // "all" (필수)
  jmCd?: string; // "1320" (정보처리기사)
  qualgbCd?: string;
  year?: string;
  seriesCd?: string;
}

/**
 * 공공데이터포털 API 동기화를 실행합니다.
 * @param params 동기화 파라미터
 * @returns 동기화 응답 데이터
 */
export async function syncCertData(params: SyncParams): Promise<SyncResponse> {
  const { source, jmCd, qualgbCd, year, seriesCd } = params;
  
  const queryParams: Record<string, string> = {};
  
  if (jmCd) queryParams.jmCd = jmCd;
  if (qualgbCd) queryParams.qualgbCd = qualgbCd;
  if (year) queryParams.year = year;
  if (seriesCd) queryParams.seriesCd = seriesCd;
  
  const response = await axios.post<SyncResponse>(
    `/cert/external/sync/${source}`,
    null,
    {
      params: queryParams,
    }
  );
  
  return response.data;
}

// 시험 일정 응답 타입
export interface ExamSchedule {
  id: number;
  source: string;
  implYy: string;
  implSeq: string;
  qualgbCd: string;
  qualgbNm: string;
  jmCd: string;
  jmNm: string;
  description: string;
  docRegStartDt: string;
  docRegEndDt: string;
  docExamStartDt: string;
  docExamEndDt: string;
  docPassDt: string;
  pracRegStartDt: string;
  pracRegEndDt: string;
  pracExamStartDt: string;
  pracExamEndDt: string;
  pracPassDt: string;
}

// 시험 일정 조회 파라미터
export interface ExamScheduleParams {
  year?: string;
  qualgbCd?: string;
  jmCd?: string;
}

/**
 * 시험 일정을 조회합니다.
 * @param params 시험 일정 조회 파라미터
 * @returns 시험 일정 배열
 */
export async function getExamSchedule(
  params: ExamScheduleParams = {}
): Promise<ExamSchedule[]> {
  const { year, qualgbCd, jmCd } = params;
  
  const queryParams: Record<string, string> = {};
  
  if (year) queryParams.year = year;
  if (qualgbCd) queryParams.qualgbCd = qualgbCd;
  if (jmCd) queryParams.jmCd = jmCd;
  
  const response = await axios.get<ExamSchedule[]>(
    `/cert/external/exam-schedule`,
    {
      params: queryParams,
    }
  );
  
  return response.data;
}

// 자격증 정보 항목 타입
export interface QualificationInfoItem {
  contents: string;
  infogb: string; // "출제경향", "출제기준", "취득방법"
  jmfldnm: string;
  mdobligfldcd: string;
  mdobligfldnm: string;
  obligfldcd: string;
  obligfldnm: string;
}

// 자격증 정보 응답 타입
export interface QualificationInfoResponse {
  response: null;
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    items: {
      item: QualificationInfoItem[];
    };
    numOfRows: null;
    pageNo: null;
    totalCount: null;
  };
}

/**
 * 자격증 정보를 조회합니다.
 * @param jmCd 자격증 코드 (필수)
 * @returns 자격증 정보 응답 데이터
 */
export async function getQualificationInfo(
  jmCd: string
): Promise<QualificationInfoResponse> {
  const response = await axios.get<QualificationInfoResponse>(
    `/cert/external/qualification-info-qnet`,
    {
      params: {
        jmCd,
      },
    }
  );
  
  return response.data;
}

// 자격증 기본 정보 응답 타입
export interface QualificationBasicInfo {
  jmCd: string;
  seriesCd: string;
  jmNm: string;
  engJmNm: string;
  seriesNm: string;
  implNm: string;
  instiNm: string;
  summary: string;
  job: string;
  trend: string;
  career: string;
  hist: string;
}

/**
 * 자격증 기본 정보를 조회합니다.
 * @param jmCd 자격증 코드 (필수)
 * @returns 자격증 기본 정보
 */
export async function getQualificationBasicInfo(
  jmCd: string
): Promise<QualificationBasicInfo> {
  const response = await axios.get<QualificationBasicInfo>(
    `/cert/external/qualification-info`,
    {
      params: {
        jmCd,
      },
    }
  );

  return response.data;
}

// 출제 기준 토픽 타입
export interface Topic {
  id: number;
  certId: number;
  parentId: number | null;
  code: string;
  title: string;
  emoji: string;
  examMode: string;
  orderNo: number;
}

// 출제 기준 응답 타입
export interface RootTopicsResponse {
  topics: Topic[];
}

/**
 * 출제 기준 루트 토픽을 조회합니다.
 * @param mode 시험 모드 (WRITTEN 또는 PRACTICAL)
 * @returns 루트 토픽 배열
 */
export async function getRootTopics(
  mode: "WRITTEN" | "PRACTICAL"
): Promise<Topic[]> {
  const response = await axios.get<RootTopicsResponse>(
    `/cert/topics/root/${mode}`
  );

  return response.data.topics;
}

