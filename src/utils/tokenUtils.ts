// JWT 토큰 유틸리티 함수

/**
 * JWT 토큰을 디코딩하여 payload를 반환합니다.
 * @param token JWT 토큰
 * @returns 디코딩된 payload 또는 null
 */
export function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('JWT 디코딩 실패:', error)
    return null
  }
}

/**
 * JWT 토큰의 만료 여부를 확인합니다.
 * @param token JWT 토큰
 * @param bufferSeconds 만료 시간 여유 (초) - 이 시간만큼 미리 만료로 간주
 * @returns 만료되었으면 true, 아니면 false
 */
export function isTokenExpired(token: string, bufferSeconds: number = 0): boolean {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return true // 디코딩 실패 또는 exp 없음 = 만료로 간주
  }
  
  const expirationTime = payload.exp * 1000 // exp는 초 단위이므로 밀리초로 변환
  const currentTime = Date.now()
  const bufferTime = bufferSeconds * 1000
  
  return currentTime >= (expirationTime - bufferTime)
}

/**
 * 토큰의 남은 시간을 초 단위로 반환합니다.
 * @param token JWT 토큰
 * @returns 남은 시간(초) 또는 0
 */
export function getTokenRemainingTime(token: string): number {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return 0
  }
  
  const expirationTime = payload.exp * 1000
  const currentTime = Date.now()
  const remainingTime = Math.max(0, expirationTime - currentTime)
  
  return Math.floor(remainingTime / 1000)
}

/**
 * 토큰 정보를 로깅합니다 (디버깅용)
 */
export function logTokenInfo(token: string, label: string = 'Token'): void {
  const payload = decodeJWT(token)
  if (!payload) {
    console.log(`[${label}] 디코딩 실패`)
    return
  }
  
  const remainingSeconds = getTokenRemainingTime(token)
  const expirationDate = payload.exp ? new Date(payload.exp * 1000).toLocaleString('ko-KR') : 'N/A'
  
  console.log(`[${label}] 정보:`, {
    만료시간: expirationDate,
    남은시간: `${remainingSeconds}초 (${Math.floor(remainingSeconds / 60)}분)`,
    만료여부: isTokenExpired(token) ? '만료됨' : '유효함',
    사용자ID: payload.sub || payload.userId || 'N/A',
  })
}

