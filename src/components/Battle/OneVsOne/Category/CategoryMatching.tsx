import { useState, useEffect, useRef } from "react";
import { Card } from "../../../ui/card";
import { Badge } from "../../../ui/badge";
import { Users, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { requestMatch, getMatchStatus, saveRoomId, getRoomState, type MatchRequestResponse, type MatchStatusResponse } from "../../../api/versusApi";
import axios from "../../../api/axiosConfig";

// 프로필 이미지 import
import girlBasicProfile from "../../../assets/profile/girl_basic_profile.png";
import boyNerdProfile from "../../../assets/profile/boy_nerd_profile.png";
import girlUniformProfile from "../../../assets/profile/girl_uniform_profile.jpg";
import girlPajamaProfile from "../../../assets/profile/girl_pajama_profile.png";
import girlMarriedProfile from "../../../assets/profile/girl_married_profile.png";
import girlNerdProfile from "../../../assets/profile/girl_nerd_profile.png";
import girlIdolProfile from "../../../assets/profile/girl_idol_profile.png";
import girlGhostProfile from "../../../assets/profile/girl_ghost_profile.png";
import girlCyberpunkProfile from "../../../assets/profile/girl_cyberpunk_profile.png";
import girlChinaProfile from "../../../assets/profile/girl_china_profile.jpg";
import girlCatProfile from "../../../assets/profile/girl_cat_profile.png";
import boyWorkerProfile from "../../../assets/profile/boy_worker_profile.png";
import boyPoliceofficerProfile from "../../../assets/profile/boy_policeofficer_profile.png";
import boyHiphopProfile from "../../../assets/profile/boy_hiphop_profile.png";
import boyDogProfile from "../../../assets/profile/boy_dog_profile.png";
import boyBasicProfile from "../../../assets/profile/boy_basic_profile.png";
import boyAgentProfile from "../../../assets/profile/boy_agent_profile.png";

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
};

// skinId로 프로필 이미지 경로 가져오기
function getProfileImage(skinId?: number): string {
  if (!skinId) return PROFILE_IMAGE_MAP[1]; // 기본값: girl_basic_profile
  return PROFILE_IMAGE_MAP[skinId] || PROFILE_IMAGE_MAP[1];
}

interface ParticipantInfo {
  userId: string;
  nickname?: string;
  avatar?: string;
  level?: number;
  score?: number;
  rank?: number | null;
  skinId?: number;
}

export function CategoryMatching() {
  const [step, setStep] = useState<"matching" | "matched">("matching");
  const [matchedOpponent, setMatchedOpponent] = useState<ParticipantInfo | null>(null);
  const [myInfo, setMyInfo] = useState<ParticipantInfo | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { topicId, topicName, examType } = location.state || { 
    topicId: null, 
    topicName: "미정", 
    examType: "written" 
  };
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 난이도 변환 (프론트엔드 -> 백엔드)
  const convertDifficulty = (diff: string): "EASY" | "NORMAL" | "HARD" => {
    switch (diff) {
      case "easy": return "EASY";
      case "medium": return "NORMAL";
      case "hard": return "HARD";
      default: return "NORMAL";
    }
  };

  // 시험 모드 변환 (프론트엔드 -> 백엔드)
  const convertExamMode = (mode: string): "WRITTEN" | "PRACTICAL" => {
    return mode === "practical" ? "PRACTICAL" : "WRITTEN";
  };

  // 매칭 요청 및 폴링
  useEffect(() => {
    if (!topicId) {
      setError("토픽이 선택되지 않았습니다.");
      return;
    }

    let isMounted = true;

    const startMatching = async () => {
      try {
        // 1. certId 가져오기
        const goalRes = await axios.get("/account/goal");
        const certId = String(goalRes.data.certId);

        // 2. 매칭 요청
        const matchResponse = await requestMatch({
          mode: "DUEL",
          certId: certId,
          matchingMode: "CATEGORY",
          topicId: topicId,
          examMode: convertExamMode(examType),
        });

        if (!isMounted) return;

        setMatchId(matchResponse.matchId);

        // 3. 무한 프로그레스 바는 CSS 애니메이션으로 처리

        // 4. 폴링 시작 (대기 상태: 2~3초)
        const pollInterval = 2000; // 2초
        pollingIntervalRef.current = setInterval(async () => {
          try {
            const statusResponse = await getMatchStatus();
            
            if (!isMounted) return;

            if (statusResponse.roomId !== null) {
              // 매칭 완료 → 방 정보 조회
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
              }
              
              // roomId 저장
              saveRoomId(statusResponse.roomId);
              
              try {
                // 방 상태 조회하여 참가자 정보 가져오기
                const roomState = await getRoomState(statusResponse.roomId);
                const roomDetail = roomState.detail;
                
                // 현재 사용자 정보 가져오기
                const profileRes = await axios.get("/account/profile");
                const myUserId = profileRes.data.userId || profileRes.data.id;
                
                // 참가자 목록에서 자신과 상대 구분
                const myParticipant = roomDetail.participants.find(p => p.userId === myUserId);
                const opponentParticipant = roomDetail.participants.find(p => p.userId !== myUserId);
                
                // 내 프로필 정보 가져오기
                const myProfileRes = await axios.get("/account/profile");
                const mySkinId = myProfileRes.data.skinId || 1;
                
                if (myParticipant) {
                  setMyInfo({
                    userId: myParticipant.userId,
                    score: myParticipant.finalScore ?? 0,
                    rank: myParticipant.rank,
                    skinId: mySkinId,
                  });
                }
                
                if (opponentParticipant) {
                  setMatchedOpponent({
                    userId: opponentParticipant.userId,
                    score: opponentParticipant.finalScore ?? 0,
                    rank: opponentParticipant.rank,
                    skinId: opponentParticipant.skinId || 1,
                  });
                }
                
                setStep("matched");

                // 1.5초 후 자동으로 게임 시작
                setTimeout(() => {
                  if (isMounted) {
                  navigate("/battle/onevsone/category/start", {
                    state: {
                      matchId: matchResponse.matchId,
                      roomId: statusResponse.roomId,
                      topicName: topicName,
                      topicId: topicId,
                      examType: examType,
                      startedAt: statusResponse.startedAt,
                      opponentId: opponentParticipant?.userId,
                      myUserId: myUserId,
                    }
                  });
                  }
                }, 1500);
              } catch (err: any) {
                console.error("방 정보 조회 실패", err);
                // 방 정보 조회 실패해도 기본 정보로 진행
                setStep("matched");
                
                setTimeout(() => {
                  if (isMounted) {
                  navigate("/battle/onevsone/category/start", {
                    state: {
                      matchId: matchResponse.matchId,
                      roomId: statusResponse.roomId,
                      topicName: topicName,
                      topicId: topicId,
                      examType: examType,
                      startedAt: statusResponse.startedAt,
                    }
                  });
                  }
                }, 1500);
              }
            } else if (!statusResponse.matching) {
              // 매칭 없음 (취소/만료 등) → UI 정리
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
              }
              setError("매칭이 취소되었거나 만료되었습니다.");
            }
            // statusResponse.matching === true 이면 계속 폴링
          } catch (err: any) {
            console.error("매칭 상태 조회 실패", err);
            if (err.response?.status === 404 || err.response?.status === 400) {
              // 매칭이 취소되었거나 만료됨
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
              }
              setError("매칭이 만료되었습니다. 다시 시도해주세요.");
            }
          }
        }, pollInterval);
      } catch (err: any) {
        console.error("매칭 요청 실패", err);
        if (isMounted) {
          setError(err.response?.data?.message || "매칭 요청에 실패했습니다.");
        }
      }
    };

    startMatching();

    return () => {
      isMounted = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [topicId, topicName, examType, navigate]);

  // Matching Step
  if (step === "matching") {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto"
          >
            <Card className="p-8 border-2 border-purple-200 bg-white/80 backdrop-blur text-center">
              {/* 아이콘 */}
              <div className="text-7xl mb-6">🎯</div>

              {/* 매칭 중 텍스트 */}
              <h2 className="text-purple-900 mb-2">매칭 중</h2>
              <p className="text-gray-600 mb-6">상대를 찾고 있습니다</p>

              {/* 선택 정보 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6 border border-purple-100">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">토픽</span>
                    <span className="text-gray-900">{topicName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">시험 유형</span>
                    <span className="text-gray-900">
                      {examType === "written" ? "📝 필기" : "💻 실기"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* 로딩 스피너 */}
              <div className="flex flex-col items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-sm text-gray-600"
                >
                  매칭 중입니다.
                </motion.p>
              </div>

            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Matched Step
  if (step === "matched" && matchedOpponent) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8 border-2 border-purple-200 bg-white/80 backdrop-blur">
              {/* 성공 아이콘 */}
              <div className="text-center mb-6">
                <div className="text-7xl mb-4">🎉</div>
                <h2 className="text-purple-900 mb-2">매칭 완료!</h2>
                <p className="text-gray-600">상대를 찾았습니다</p>
              </div>

              {/* VS 대결 */}
              <div className="grid grid-cols-3 gap-4 items-center mb-6">
                {/* 나 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-2 overflow-hidden border-2 border-white shadow-md">
                    <img
                      src={getProfileImage(myInfo?.skinId)}
                      alt={myInfo?.userId || "나"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {myInfo?.userId || "나"}
                  </p>
                  {myInfo && (
                    <>
                      {myInfo.rank !== null && myInfo.rank !== undefined && (
                        <p className="text-xs text-purple-600">순위: {myInfo.rank}위</p>
                      )}
                    </>
                  )}
                </motion.div>

                {/* VS */}
                <div className="text-center">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2">
                    VS
                  </Badge>
                </div>

                {/* 상대 */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mb-2 overflow-hidden border-2 border-white shadow-md">
                    <img
                      src={getProfileImage(matchedOpponent?.skinId)}
                      alt={matchedOpponent?.userId || "상대"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {matchedOpponent?.userId || "상대"}
                  </p>
                  {matchedOpponent && (
                    <>
                      {matchedOpponent.rank !== null && matchedOpponent.rank !== undefined && (
                        <p className="text-xs text-blue-600">순위: {matchedOpponent.rank}위</p>
                      )}
                    </>
                  )}
                </motion.div>
              </div>

              {/* 배틀 정보 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 text-center border border-purple-100"
              >
                <p className="text-sm text-gray-600 mb-1">곧 배틀이 시작됩니다</p>
                <p className="text-xs text-purple-700">{topicName} · {examType === "written" ? "필기" : "실기"}</p>
              </motion.div>

              {/* 로딩 표시 */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
