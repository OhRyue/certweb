import axios from "axios";

const instance = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

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

    return config
  },
  error => Promise.reject(error)
);

// 응답 인터셉터 (토큰 만료 시 재발급)
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 오류이고, 아직 재시도하지 않았고, refresh 엔드포인트가 아닌 경우
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/account/refresh")
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          console.error("Refresh 토큰이 없습니다.");
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        console.log("토큰 만료 감지, 갱신 시도...");
        const res = await instance.post("/account/refresh", { refreshToken });

        const newAccessToken = res.data.accessToken;
        if (!newAccessToken) {
          console.error("새 액세스 토큰을 받지 못했습니다.");
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // 새 토큰 저장
        localStorage.setItem("accessToken", newAccessToken);
        console.log("새 토큰 저장 완료:", newAccessToken.substring(0, 50) + "...");
        
        // 새 토큰 페이로드 확인
        try {
          const tokenParts = newAccessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log("새 토큰 페이로드:", payload);
            const now = Math.floor(Date.now() / 1000);
            console.log("현재 시간:", now, "토큰 만료 시간:", payload.exp);
          }
        } catch (e) {
          console.error("새 토큰 파싱 오류:", e);
        }

        // 원래 요청의 Authorization 헤더를 새 토큰으로 명시적으로 업데이트
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // 재시도 플래그를 리셋하지 않음 (무한 루프 방지)
        console.log("원래 요청 재시도:", originalRequest.url);
        console.log("재시도 요청 헤더:", originalRequest.headers);

        // 원래 요청 재시도
        return instance(originalRequest);
      } catch (refreshError: any) {
        console.error("토큰 갱신 실패:", refreshError);
        // 재시도 플래그를 리셋하지 않아서 무한 루프 방지
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // 재시도를 이미 시도했는데도 401이 오는 경우
    if (
      error.response?.status === 401 &&
      originalRequest._retry &&
      !originalRequest.url?.includes("/account/refresh")
    ) {
      console.error("토큰 갱신 후에도 인증 실패. 로그인이 필요합니다.");
      localStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default instance;
