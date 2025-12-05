import axios from "axios";

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
});
console.log("🔵 [AXIOS INIT] API_BASE_URL =", API_BASE_URL);
console.log("🔵 [AXIOS INIT] 최종 baseURL =", instance.defaults.baseURL);

// 토큰 제거 유틸 함수
function clearTokens(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
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
        const token = localStorage.getItem("accessToken")
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
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });

    return config
  },
  error => Promise.reject(error)
);

// 응답 인터셉터 - 401 에러를 JWT 만료/온보딩 미완료/기타로 구분하여 처리
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
      window.location.href = "/onboarding";
      return Promise.reject(error);
    }

    // (3) 기타 401 - refresh token으로 재시도
    console.log("🔄 [AUTH] 401 발생, refresh token으로 재시도 시도");
    originalRequest._retry = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
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
      localStorage.setItem("accessToken", newAccessToken);
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
