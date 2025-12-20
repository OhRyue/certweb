import { useState, useEffect, useRef } from "react";
import { Card } from "../../ui/card";
import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { saveRoomId } from "../../api/versusApi";
import axios from "../../api/axiosConfig";
import { BattleWebSocketClient, type MatchResponse } from "../../../ws/BattleWebSocketClient";

export function TournamentMatching() {
  const [step, setStep] = useState<"matching" | "matched">("matching");
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { examType, topicName, isBotMatch } = (location.state as { examType?: string; topicName?: string; isBotMatch?: boolean }) || { 
    examType: "written",
    topicName: "토너먼트",
    isBotMatch: false
  };
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsClientRef = useRef<BattleWebSocketClient | null>(null);

  // 시험 모드 변환 (프론트엔드 -> 백엔드)
  const convertExamMode = (mode: string): "WRITTEN" | "PRACTICAL" => {
    return mode === "practical" ? "PRACTICAL" : "WRITTEN";
  };

  // 매칭 요청 및 폴링 (봇전) 또는 WebSocket (PvP)
  useEffect(() => {
    let isMounted = true;

    const startMatching = async () => {
      // 봇전인 경우 REST API 폴링 방식 사용
      if (isBotMatch) {
        try {
          // 1. certId 가져오기
          const goalRes = await axios.get("/account/goal");
          const certId = String(goalRes.data.certId);

          // 2. 토너먼트 매칭 요청 (REST API)
          const { requestTournamentMatch, getMatchStatus } = await import("../../api/versusApi");
          const matchResponse = await requestTournamentMatch({
            mode: "TOURNAMENT",
            certId: certId,
            examMode: convertExamMode(examType),
          });

          if (!isMounted) return;

          // 응답에서 초기 상태 설정
          setWaitingCount(matchResponse.waitingCount || 0);

          // 3. 폴링 시작 (2초마다)
          const pollInterval = 2000;
          pollingIntervalRef.current = setInterval(async () => {
            try {
              const statusResponse = await getMatchStatus();
              
              if (!isMounted) return;

              // 대기 인원 수 업데이트
              if (statusResponse.waitingCount !== undefined) {
                setWaitingCount(statusResponse.waitingCount);
              }

              // matching이 false가 되면 매칭이 완료된 것
              if (!statusResponse.matching) {
                // 폴링 중지
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                }

                // roomId가 있으면 매칭 완료 → 게임으로 이동
                if (statusResponse.roomId !== null) {
                  // roomId 저장
                  saveRoomId(statusResponse.roomId);
                  
                  setStep("matched");

                  // 1.5초 후 자동으로 토너먼트 게임 시작
                  setTimeout(() => {
                    if (isMounted) {
                      const gamePath = examType === "written" 
                        ? "/battle/tournament/game/written"
                        : "/battle/tournament/game/practical";
                      
                      navigate(gamePath, {
                        state: {
                          roomId: statusResponse.roomId,
                          examType: examType,
                          startedAt: statusResponse.startedAt,
                          isBotMatch: true,
                        }
                      });
                    }
                  }, 1500);
                } else {
                  // roomId가 없으면 매칭 취소/만료
                  setError("매칭이 취소되었거나 만료되었습니다.");
                }
              }
            } catch (err: unknown) {
              console.error("매칭 상태 조회 실패", err);
              const axiosError = err as { response?: { status?: number } };
              if (axiosError.response?.status === 404 || axiosError.response?.status === 400) {
                // 매칭이 취소되었거나 만료됨
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                }
                setError("매칭이 만료되었습니다. 다시 시도해주세요.");
              }
            }
          }, pollInterval);
        } catch (err: unknown) {
          console.error("매칭 요청 실패", err);
          if (isMounted) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || "매칭 요청에 실패했습니다.");
          }
        }
        return;
      }

      // PvP인 경우 WebSocket 방식 사용
      try {
        // 1. certId 가져오기
        const goalRes = await axios.get("/account/goal");
        const certId = String(goalRes.data.certId);

        // 2. WebSocket 클라이언트 생성 및 연결
        const wsClient = new BattleWebSocketClient();
        wsClientRef.current = wsClient;

        // 매칭 응답 핸들러 설정
        wsClient.setMatchResponseCallback((response: MatchResponse) => {
          if (!isMounted) return;

          console.log('[TournamentMatching] MATCH_RESPONSE 수신:', response);

          // 대기 인원 수 업데이트
          if (response.waitingCount !== null) {
            setWaitingCount(response.waitingCount);
          }

          // 매칭 성공 시 (matching: false, roomId 있음)
          if (!response.matching && response.roomId !== null) {
            // roomId 저장
            saveRoomId(response.roomId);
            
            setStep("matched");

            // 1.5초 후 자동으로 토너먼트 게임 시작
            setTimeout(() => {
              if (isMounted) {
                const gamePath = examType === "written" 
                  ? "/battle/tournament/game/written"
                  : "/battle/tournament/game/practical";
                
                navigate(gamePath, {
                  state: {
                    roomId: response.roomId,
                    examType: examType,
                    isBotMatch: false,
                  }
                });
              }
            }, 1500);
          }

          // 에러 메시지 처리
          if (response.message) {
            setError(response.message);
          }
        });

        // WebSocket 연결
        wsClient.connect();

        // 연결 후 매칭 요청 전송
        setTimeout(() => {
          if (wsClient.getConnectionStatus()) {
            wsClient.requestMatch({
              mode: "TOURNAMENT",
              certId: certId,
              examMode: convertExamMode(examType),
            });
          } else {
            console.error('[TournamentMatching] WebSocket 연결 실패');
            setError("연결에 실패했습니다. 다시 시도해주세요.");
          }
        }, 500);
      } catch (err: unknown) {
        console.error("매칭 요청 실패", err);
        if (isMounted) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || "매칭 요청에 실패했습니다.");
        }
      }
    };

    startMatching();

    return () => {
      isMounted = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      // WebSocket 연결 해제
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
    };
  }, [examType, navigate, isBotMatch]);

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
                    <span className="text-gray-600">모드</span>
                    <span className="text-gray-900">토너먼트</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">시험 유형</span>
                    <span className="text-gray-900">
                      {examType === "written" ? "📝 필기" : "💻 실기"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">대기 인원</span>
                    <span className="text-gray-900">{waitingCount}명</span>
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
  if (step === "matched") {
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
                <p className="text-gray-600">토너먼트에 참가했습니다</p>
              </div>

              {/* 토너먼트 정보 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 text-center border border-purple-100 mb-6"
              >
                <p className="text-sm text-gray-600 mb-1">곧 토너먼트가 시작됩니다</p>
                <p className="text-xs text-purple-700">{topicName} · {examType === "written" ? "필기" : "실기"}</p>
                <p className="text-xs text-gray-500 mt-2">8명이 참가하는 토너먼트</p>
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
