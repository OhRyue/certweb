// 프로필 이미지 import
import girlBasicProfile from "../components/assets/profile/girl_basic_profile.png"
import boyNerdProfile from "../components/assets/profile/boy_nerd_profile.png"
import girlUniformProfile from "../components/assets/profile/girl_uniform_profile.jpg"
import girlPajamaProfile from "../components/assets/profile/girl_pajama_profile.png"
import girlMarriedProfile from "../components/assets/profile/girl_married_profile.png"
import girlNerdProfile from "../components/assets/profile/girl_nerd_profile.png"
import girlIdolProfile from "../components/assets/profile/girl_idol_profile.png"
import girlGhostProfile from "../components/assets/profile/girl_ghost_profile.png"
import girlCyberpunkProfile from "../components/assets/profile/girl_cyberpunk_profile.png"
import girlChinaProfile from "../components/assets/profile/girl_china_profile.jpg"
import girlCatProfile from "../components/assets/profile/girl_cat_profile.png"
import boyWorkerProfile from "../components/assets/profile/boy_worker_profile.png"
import boyPoliceofficerProfile from "../components/assets/profile/boy_policeofficer_profile.png"
import boyHiphopProfile from "../components/assets/profile/boy_hiphop_profile.png"
import boyDogProfile from "../components/assets/profile/boy_dog_profile.png"
import boyBasicProfile from "../components/assets/profile/boy_basic_profile.png"
import boyAgentProfile from "../components/assets/profile/boy_agent_profile.png"

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

