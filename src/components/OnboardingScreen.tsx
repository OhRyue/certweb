import axios from "./api/axiosConfig"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { motion } from "motion/react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { CheckCircle2, Sparkles } from "lucide-react"

export function OnboardingScreen() {
    const navigate = useNavigate()
    const [isCheckingNickname, setIsCheckingNickname] = useState(false)
    const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null)

    // 예시: 자격증 선택용 mock 데이터
    const categories = [
        { certId: 1, name: "정보처리기사", icon: "💻", color: "from-indigo-400 to-blue-400" },
        { certId: 2, name: "컴활", icon: "📊", color: "from-green-400 to-teal-400" },
        { certId: 3, name: "SQLD", icon: "🧠", color: "from-yellow-400 to-orange-400" },
        { certId: 4, name: "리눅스", icon: "🐧", color: "from-gray-400 to-slate-400" },
    ]

    const [formData, setFormData] = useState({
        nickname: "",
        targetCertification: 0,
    })

    async function handleCompleteProfile() {
        try {
            // 토큰이 있는지 확인
            const token = localStorage.getItem("accessToken")
            if (!token) {
                alert("인증 토큰이 없습니다. 다시 로그인해주세요.")
                navigate("/login")
                return
            }

            // axios 인터셉터가 자동으로 토큰 갱신 및 재시도를 처리함
            console.log("프로필 설정 API 호출 시작...")
            const res = await axios.post("/account/onboarding/profile", {
                nickname: formData.nickname,
                skinId: 1, // 기본 스킨 ID
                timezone: "Asia/Seoul",
                lang: "ko-KR",
                certId: formData.targetCertification,
                targetExamMode: "WRITTEN",
                targetRoundId: 0
            })
            console.log("프로필 설정 성공:", res.data)
            console.log("온보딩 응답:", {
                emailVerified: res.data.emailVerified,
                nicknameSet: res.data.nicknameSet,
                goalSelected: res.data.goalSelected,
                settingsReady: res.data.settingsReady,
                completed: res.data.completed,
                completedAt: res.data.completedAt,
                nextStep: res.data.nextStep
            })

            alert("프로필 설정 완료")
            navigate("/")
        } catch (err: any) {
            console.error("프로필 설정 오류:", err)
            console.error("응답 데이터:", err.response?.data)
            console.error("응답 헤더:", err.response?.headers)

            // 인터셉터가 이미 토큰 갱신을 시도했지만 실패한 경우
            // 또는 토큰 갱신 후에도 여전히 401이 반환되는 경우
            if (err.response?.status === 401) {
                // 백엔드에서 반환한 상세 오류 메시지 확인
                const errorDesc = err.response?.headers?.['www-authenticate'] || err.response?.data?.error_description || "토큰 검증 실패"
                console.error("인증 오류 상세:", errorDesc)
                console.error("⚠️ 백엔드 문제 가능성: refresh로 받은 새 토큰도 검증에 실패했습니다.")
                console.error("백엔드에서 확인 필요: JWT Secret Key 일치 여부, 토큰 검증 로직")

                // 인터셉터가 이미 재시도를 했는데도 실패했다면, 백엔드 문제
                alert("토큰 검증에 실패했습니다. 서버 측 문제일 수 있습니다. 잠시 후 다시 시도해주세요.")
                localStorage.clear()
                navigate("/login")
            } else {
                alert(err.response?.data?.message || "설정 실패")
            }
        }
    }

    // 닉네임 중복 확인
    const handleCheckNickname = async () => {
        const trimmedNickname = formData.nickname.trim()
        
        if (!trimmedNickname) {
            alert("닉네임을 입력하세요.")
            return
        }

        // 닉네임 길이 체크 (2-12자)
        if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
            alert("닉네임은 2-12자여야 합니다.")
            return
        }

        try {
            setIsCheckingNickname(true)
            const res = await axios.get(`/account/check-nickname`, {
                params: { nickname: trimmedNickname },
            })
            setNicknameAvailable(res.data.available)
            if (res.data.available) {
                alert(res.data.message || "사용 가능한 닉네임입니다.")
            } else {
                alert("이미 사용 중인 닉네임입니다.")
            }
        } catch (err: any) {
            console.error("닉네임 중복 확인 오류:", err)
            alert(err.response?.data?.message || "닉네임 확인 중 오류가 발생했습니다.")
            setNicknameAvailable(null)
        } finally {
            setIsCheckingNickname(false)
        }
    }

    const isFormValid = formData.nickname && formData.targetCertification && nicknameAvailable === true

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 overflow-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-purple-100">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        <div className="text-3xl">📖</div>
                        <div>
                            <h1 className="text-purple-900">CertMaster</h1>
                            <p className="text-xs text-gray-600">프로필 설정</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-12">
                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="p-8 bg-white/80 backdrop-blur border-2 border-purple-200 shadow-xl">
                        <div className="text-center mb-8">
                            <div className="text-5xl mb-4">✨</div>
                            <h2 className="text-purple-900 mb-2">
                                프로필 설정
                            </h2>
                            <p className="text-gray-600">
                                프로필을 설정하고 학습을 시작해보세요! 🎉
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* 닉네임 */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-gray-700 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                        닉네임
                                    </label>
                                    {formData.nickname && (
                                        <div className="text-[10px]">
                                            {isCheckingNickname ? (
                                                <p className="text-xs text-gray-500 flex items-center gap-1">⏳ 확인 중</p>
                                            ) : nicknameAvailable === true ? (
                                                <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 사용 가능한 닉네임입니다</p>
                                            ) : nicknameAvailable === false ? (
                                                <p className="text-xs text-red-600 flex items-center gap-1">❌ 이미 사용 중인 닉네임에요</p>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        placeholder="다른 사람들에게 보여질 닉네임"
                                        value={formData.nickname}
                                        onChange={(e) => {
                                            setFormData({ ...formData, nickname: e.target.value })
                                            // 입력 시 중복 확인 상태 초기화
                                            if (nicknameAvailable !== null) {
                                                setNicknameAvailable(null)
                                            }
                                        }}
                                        className={`flex-1 bg-white focus:border-purple-400 transition-all ${nicknameAvailable === false
                                            ? "border-red-400 text-red-700 placeholder-red-300"
                                            : "border-purple-200"
                                            }`}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleCheckNickname}
                                        disabled={!formData.nickname.trim() || isCheckingNickname}
                                        className="whitespace-nowrap bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCheckingNickname ? (
                                            <>⏳ 확인 중</>
                                        ) : (
                                            <>중복 확인</>
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">한글, 영문, 숫자 2-12자</p>
                            </div>

                            {/* 목표 자격증 선택 */}
                            <div>
                                <label className="text-sm text-gray-700 mb-3 block flex items-center gap-2">
                                    <span className="text-xl">🎯</span>
                                    공부할 자격증을 선택하세요
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {categories.map((category) => (
                                        <button
                                            key={category.certId}
                                            onClick={() => setFormData({ ...formData, targetCertification: category.certId })}
                                            className={`p-5 rounded-xl border-2 transition-all transform hover:scale-105 ${formData.targetCertification === category.certId
                                                ? `border-purple-500 bg-gradient-to-br ${category.color} shadow-lg`
                                                : 'border-gray-200 bg-white hover:border-purple-300'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <div
                                                    className={`text-4xl transition-transform ${formData.targetCertification === category.certId ? 'scale-110' : ''
                                                        }`}
                                                >
                                                    {category.icon}
                                                </div>
                                                <div
                                                    className={`transition-colors ${formData.targetCertification === category.certId
                                                        ? 'text-white'
                                                        : 'text-gray-900'
                                                        }`}
                                                >
                                                    {category.name}
                                                </div>

                                                {formData.targetCertification === category.certId && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                                    >
                                                        <CheckCircle2 className="w-6 h-6 text-white" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-3 text-center">
                                    나중에 설정에서 변경할 수 있어요
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                onClick={handleCompleteProfile}
                                disabled={!isFormValid}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 disabled:opacity-50"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                프로필 설정 완료
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}

