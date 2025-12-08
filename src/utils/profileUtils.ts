// 프로필 이미지 경로
const girlBasicProfile = "/assets/profile/girl_basic_profile.png"
const boyNerdProfile = "/assets/profile/boy_nerd_profile.png"
const girlUniformProfile = "/assets/profile/girl_uniform_profile.jpg"
const girlPajamaProfile = "/assets/profile/girl_pajama_profile.png"
const girlMarriedProfile = "/assets/profile/girl_married_profile.png"
const girlNerdProfile = "/assets/profile/girl_nerd_profile.png"
const girlIdolProfile = "/assets/profile/girl_idol_profile.png"
const girlGhostProfile = "/assets/profile/girl_ghost_profile.png"
const girlCyberpunkProfile = "/assets/profile/girl_cyberpunk_profile.png"
const girlChinaProfile = "/assets/profile/girl_china_profile.jpg"
const girlCatProfile = "/assets/profile/girl_cat_profile.png"
const boyWorkerProfile = "/assets/profile/boy_worker_profile.png"
const boyPoliceofficerProfile = "/assets/profile/boy_policeofficer_profile.png"
const boyHiphopProfile = "/assets/profile/boy_hiphop_profile.png"
const boyDogProfile = "/assets/profile/boy_dog_profile.png"
const boyBasicProfile = "/assets/profile/boy_basic_profile.png"
const boyAgentProfile = "/assets/profile/boy_agent_profile.png"

// skinId를 프로필 이미지로 매핑
const PROFILE_IMAGE_MAP: Record<number, string> = {
  1: girlBasicProfile,
  2: boyNerdProfile,
  3: girlUniformProfile,
  4: girlPajamaProfile,
  5: girlMarriedProfile,
  6: girlNerdProfile,
  7: girlIdolProfile,
  8: girlGhostProfile,
  9: girlCyberpunkProfile,
  10: girlChinaProfile,
  11: girlCatProfile,
  12: boyWorkerProfile,
  13: boyPoliceofficerProfile,
  14: boyHiphopProfile,
  15: boyDogProfile,
  16: boyBasicProfile,
  17: boyAgentProfile,
}

/**
 * skinId로 프로필 이미지 경로를 가져옵니다.
 * @param skinId 스킨 ID
 * @returns 프로필 이미지 경로 (기본값: girl_basic_profile)
 */
export function getProfileImage(skinId: number): string {
  return PROFILE_IMAGE_MAP[skinId] || PROFILE_IMAGE_MAP[1] // 기본값: girl_basic_profile
}

