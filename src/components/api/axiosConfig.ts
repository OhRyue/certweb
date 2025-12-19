import axios from "axios";
import { emitOnboardingRequired } from "../../utils/authEvents";
import { clearAuthTokens, getAccessToken, getRefreshTokenWithSource, setAuthItemInStorage } from "../../utils/authStorage";

// 환경 변수 검증
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error(
    "VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다. " +
    "Netlify 대시보드에서 환경 변수를 설정해주세요."
  );
}

const instance = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : "/api",
  withCredentials: true,
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});
console.log("🔵 [AXIOS INIT] API_BASE_URL =", API_BASE_URL);
console.log("🔵 [AXIOS INIT] 최종 baseURL =", instance.defaults.baseURL);

// 토큰 제거 유틸 함수
function clearTokens(): void {
  clearAuthTokens();
  console.log("🧹 [AUTH] 토큰 제거 완료");
}

// 요청 인터셉터
instance.interceptors.request.use(
  config => {
    const skipAuth =
      config.url?.includes("account/login") ||
      config.url?.includes("account/send-verification") ||
      config.url?.includes("account/verify-email") ||
      config.url?.includes("account/check-userId") ||
      config.url?.includes("account/forgot-password") ||
      config.url?.includes("account/forgot-password/verify") ||
      config.url?.includes("account/forgot-password/reset") ||
      config.url?.includes("account/refresh")

    if (!skipAuth) {
      // 이미 Authorization 헤더가 설정되어 있으면 (재시도인 경우) 그대로 사용
      // 그렇지 않으면 localStorage에서 토큰 가져오기
      if (!config.headers?.Authorization) {
        const token = getAccessToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
          console.log("요청 인터셉터: 토큰 추가됨", config.url)
        } else {
          console.warn("요청 인터셉터: 토큰이 없음", config.url)
        }
      } else {
        console.log("요청 인터셉터: 이미 Authorization 헤더 있음 (재시도)", config.url)
      }
    }
    
    // 🔴 디버깅용: 실제 요청 URL 확인
    console.log("➡️ [REQUEST]", {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      withCredentials: config.withCredentials,
      hasAuth: !!config.headers?.Authorization
    });

    return config
  },
  error => Promise.reject(error)
);

// 응답 인터셉터 - 401 에러를 JWT 만료/온보딩 미완료/기타로 구분하여 처리
instance.interceptors.response.use(
  (response) => {
    // 성공 응답 로깅 (디버깅용)
    console.log("✅ [RESPONSE]", {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ========================================
    // 네트워크 에러 처리 (401 이전에 처리)
    // ========================================
    
    // 네트워크 연결 실패 (백엔드 서버가 꺼져있거나 연결 불가)
    if (!error.response) {
      const errorMessage = error.message || "알 수 없는 네트워크 에러";
      const errorCode = error.code || "UNKNOWN";
      
      console.error("🔴 [NETWORK ERROR] 네트워크 연결 실패:", {
        message: errorMessage,
        code: errorCode,
        url: originalRequest?.url,
        baseURL: originalRequest?.baseURL,
        fullURL: originalRequest ? `${originalRequest.baseURL}${originalRequest.url}` : "N/A"
      });

      // 상세 에러 정보
      if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        console.error("🔴 [NETWORK ERROR] 서버에 연결할 수 없습니다.");
        console.error("   가능한 원인:");
        console.error("   1. 백엔드 서버가 실행되지 않았거나 꺼져있음");
        console.error("   2. 네트워크 연결 문제");
        console.error("   3. 방화벽이나 프록시 설정 문제");
        console.error(`   4. API URL이 올바르지 않음: ${originalRequest?.baseURL}`);
      } else if (error.code === "ECONNREFUSED") {
        console.error("🔴 [NETWORK ERROR] 연결이 거부되었습니다.");
        console.error("   백엔드 서버가 해당 포트에서 실행되지 않고 있습니다.");
      } else if (error.code === "ETIMEDOUT") {
        console.error("🔴 [NETWORK ERROR] 요청 시간이 초과되었습니다.");
        console.error("   서버 응답이 너무 느리거나 연결이 끊어졌습니다.");
      }

      // 네트워크 에러는 그대로 reject (사용자에게 표시할 수 있도록)
      return Promise.reject(error);
    }

    // HTTP 에러 응답 로깅
    console.error("❌ [HTTP ERROR]", {
      url: originalRequest?.url,
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: error.response.headers
    });

    // 401 에러가 아니면 그대로 reject
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // refresh 엔드포인트의 401은 별도 처리하지 않음
    if (originalRequest.url?.includes("/account/refresh")) {
      return Promise.reject(error);
    }

    // 이미 재시도한 경우는 더 이상 처리하지 않음
    if (originalRequest._retry) {
      console.error("🔴 [AUTH] 재시도 후에도 401 발생");
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // ========================================
    // 401 에러 분류 (우선순위대로 처리)
    // ========================================

    // (1) JWT 만료 감지: WWW-Authenticate 헤더 확인
    const wwwAuthHeader = error.response?.headers?.["www-authenticate"]?.toLowerCase();
    if (
      wwwAuthHeader &&
      (wwwAuthHeader.includes("jwt expired") || wwwAuthHeader.includes("invalid_token"))
    ) {
      console.warn("⚠️ [AUTH] JWT 만료 감지 (WWW-Authenticate)");
      clearTokens();
      window.location.href = "/login?reason=expired";
      return Promise.reject(error);
    }

    // (2) 온보딩 미완료 감지: response body의 errorCode 확인
    const errorCode = error.response?.data?.errorCode;
    if (errorCode === "ONBOARDING_REQUIRED") {
      console.warn("⚠️ [AUTH] 온보딩 미완료 감지");
      // 라우터 밖(인터셉터)에서 SPA 이동을 직접 수행하지 않고,
      // 전역 이벤트로 신호를 보내 라우터 레벨에서 navigate로 처리한다.
      emitOnboardingRequired();
      return Promise.reject(error);
    }

    // (3) 기타 401 - refresh token으로 재시도
    console.log("🔄 [AUTH] 401 발생, refresh token으로 재시도 시도");
    originalRequest._retry = true;

    try {
      const { token: refreshToken, source } = getRefreshTokenWithSource();
      if (!refreshToken) {
        console.error("🔴 [AUTH] Refresh 토큰이 없습니다.");
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      console.log("🔄 [AUTH] 토큰 갱신 시도...");
      const res = await instance.post("/account/refresh", { refreshToken });

      const newAccessToken = res.data.accessToken;
      if (!newAccessToken) {
        console.error("🔴 [AUTH] 새 액세스 토큰을 받지 못했습니다.");
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // 새 토큰 저장
      // refreshToken이 존재했던 저장소에 accessToken도 같이 갱신 저장
      setAuthItemInStorage(source ?? "session", "accessToken", newAccessToken);
      console.log("✅ [AUTH] 새 토큰 저장 완료");

      // 원래 요청의 Authorization 헤더를 새 토큰으로 업데이트
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      console.log("🔄 [AUTH] 원래 요청 재시도:", originalRequest.url);

      // 원래 요청 재시도
      return instance(originalRequest);
    } catch (refreshError: any) {
      console.error("🔴 [AUTH] 토큰 갱신 실패:", refreshError);
      
      // refresh 실패 시에도 WWW-Authenticate 헤더를 확인
      const refreshWwwAuth = refreshError.response?.headers?.["www-authenticate"]?.toLowerCase();
      if (
        refreshWwwAuth &&
        (refreshWwwAuth.includes("jwt expired") || refreshWwwAuth.includes("invalid_token"))
      ) {
        console.warn("⚠️ [AUTH] Refresh token도 만료됨");
        clearTokens();
        window.location.href = "/login?reason=expired";
      } else {
        clearTokens();
        window.location.href = "/login";
      }
      
      return Promise.reject(refreshError);
    }
  }
);

export default instance;
