/**
 * leveling.ts
 * 
 * 레벨/경험치 시스템 계산 전용 유틸리티
 * 
 * 백엔드에서 주는 값:
 * - totalXP: 총 누적 경험치 (레벨 1부터 지금까지 쌓은 모든 경험치)
 * - level: 현재 레벨
 * 
 * 프론트에서 필요한 값:
 * - 현재 레벨 내에서의 경험치 (0부터 시작하는 값처럼 보여야 함)
 * - 현재 레벨에서 요구되는 최대 경험치 (ex: 레벨 표시 바 최대값)
 * - 진행도 퍼센트
 *
 * 레벨업 규칙:
 * 각 레벨 L을 올리기 위해서는 다음 경험치가 필요함:
 *    XP(L) = 300 + (L * 50)
 * 
 * ex)
 * 1 → 2: 350
 * 2 → 3: 400
 * 3 → 4: 450
 * ...
 */


/**
 * 특정 레벨이 시작될 때까지 필요한 "누적 경험치"를 계산한다.
 *
 * StartXP(L) = Σ (300 + i * 50)   (i = 1 → L-1)
 *
 * 이를 공식으로 단순화한 형태:
 * StartXP(L) = (L - 1) * 300 + 50 * ((L - 1) * L / 2)
 *
 * @param level 현재 레벨
 * @returns 해당 레벨이 시작되기까지 필요한 누적 경험치량
 */
export function getStartXP(level: number): number {
    // L = 현재 레벨의 직전 레벨 카운트
    const L = level - 1
  
    if (L <= 0) return 0 // 레벨 1은 항상 시작 경험치가 0
  
    // (L * 300): 기본 경험치
    // 50 * (L * (L + 1) / 2): 증가량에 대한 누적 보정
    return L * 300 + 50 * (L * (L + 1) / 2)
  }
  
  
  /**
   * 현재 레벨에서 다음 레벨로 가기 위해 필요한 경험치량을 계산한다.
   * 규칙: XP(L) = 300 + (L * 50)
   *
   * @param level 현재 레벨
   * @returns 현재 레벨에서 필요한 경험치량
   */
  export function getRequiredXP(level: number): number {
    return 300 + level * 50
  }
  
  
  /**
   * 프론트에서 쓸 수 있는 레벨 진행상태 정보를 반환한다.
   *
   * 반환 값:
   * - currentLevelXP: 현재 레벨 내에서 사용자의 경험치 (0부터 시작하는 느낌)
   * - requiredXP: 해당 레벨에서 다음 레벨까지 필요한 전체 경험치
   * - progress: 0~1 사이의 진행도 비율
   *
   * @param totalXP 총 누적 경험치
   * @param level 현재 레벨
   */
  export function getLevelProgress(totalXP: number, level: number) {
    const startXP = getStartXP(level)             // 현재 레벨의 시작 누적 경험치
    const requiredXP = getRequiredXP(level)       // 이 레벨에서 필요한 최대 경험치
    const currentLevelXP = totalXP - startXP      // 현재 레벨 내 경험치
  
    // 음수 방지 (레벨 계산이 갱신되기 전에 데이터가 잠깐 잘못 들어오는 경우 방어용)
    const safeCurrentXP = Math.max(0, currentLevelXP)
  
    return {
      currentLevelXP: safeCurrentXP,     // 현재 레벨 기준 경험치
      requiredXP,                        // 다음 레벨까지 필요한 총 경험치
      progress: safeCurrentXP / requiredXP, // 퍼센트 (0~1)
    }
  }
  
  // totalXP를 레벨 내 경험치로 변환
  export function getLevelInternalXP(totalXP: number, level: number) {
    const startXP = getStartXP(level)
    return totalXP - startXP
  }