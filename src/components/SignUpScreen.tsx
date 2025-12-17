import axios from "./api/axiosConfig"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Progress } from "./ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, Lock, User, Sparkles, Shield } from "lucide-react"
import { clearAuthTokens, getAccessToken, setAuthTokens } from "../utils/authStorage"

// 아이디 유효성 정규식 (영문+숫자, 8~20자)
const idRegex = /^[A-Za-z0-9]{8,20}$/;
// 비밀번호 정규식: 영문 + 숫자 + 특수문자 최소 1개씩 포함, 8자 이상
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export function SignUpScreen() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [isVerificationSent, setIsVerificationSent] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(false)
    const [isCheckingId, setIsCheckingId] = useState(false)
    const [idAvailable, setIdAvailable] = useState<boolean | null>(null)        // 중복 여부
    const [isIdInvalid, setIsIdInvalid] = useState(false);      // 8~20글자, 영어/숫자 포함 조건 확인
    const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);      // 비밀번호 조건
    const [isEmailInvalid, setIsEmailInvalid] = useState(false);      // 이메일 형식 조건
    const [emailErrorMessage, setEmailErrorMessage] = useState<string>("");      // 이메일 에러 메시지
    const [isVerifiedDone, setIsVerifiedDone] = useState(false)
    const [isCheckingNickname, setIsCheckingNickname] = useState(false);      // 닉네임 중복 확인 중
    const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);      // 닉네임 중복 여부
    const [countdown, setCountdown] = useState(0)      // 이메일 발송 카운트다운 (초 단위)

    // 예시: Step2 자격증 선택용 mock 데이터
    const categories = [
        { certId: 1, name: "정보처리기사", icon: "💻", color: "from-indigo-400 to-blue-400" },
        { certId: 2, name: "컴퓨터활용능력", icon: "📊", color: "from-green-400 to-teal-400" },
        { certId: 3, name: "SQLD", icon: "🧠", color: "from-yellow-400 to-orange-400" },
        { certId: 4, name: "리눅스 마스터", icon: "🐧", color: "from-gray-400 to-slate-400" },
    ]


    const [formData, setFormData] = useState({
        userId: "",
        password: "",
        passwordConfirm: "",
        email: "",
        verificationCode: "",
        nickname: "",
        targetCertification: 0,
    })

    // 아이디 입력 blur 시 유효성 체크
    const handleIdBlur = () => {
        const trimmed = formData.userId.trim();
        // 조건에 맞지 않으면 빨갛게 표시
        if (!idRegex.test(trimmed)) {
            setIsIdInvalid(true);
        } else {
            setIsIdInvalid(false);
        }
    };

    const handlePasswordBlur = () => {
        const trimmed = formData.password.trim();
        if (!passwordRegex.test(trimmed)) {
            setIsPasswordInvalid(true);
        } else {
            setIsPasswordInvalid(false);
        }
    };

    // 디바운싱용
    useEffect(() => {
        const delay = setTimeout(async () => {
            const trimmedId = formData.userId.trim();

            // 형식 자체가 틀리면 중복 체크 안 함
            if (!idRegex.test(trimmedId)) {
                setIdAvailable(null);
                return;
            }

            try {
                setIsCheckingId(true);
                const res = await axios.get(`/account/check-userId`, {
                    params: { userId: trimmedId },
                });
                setIdAvailable(res.data.available);
            } catch (err) {
                console.error("중복 확인 오류:", err);
                setIdAvailable(null);
            } finally {
                setIsCheckingId(false);
            }
        }, 600);

        return () => clearTimeout(delay);
    }, [formData.userId]);

    // 카운트다운 타이머
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    // 1) 이메일 인증 전송 (회원가입 단계)
    const handleSendVerification = async () => {
        if (!formData.userId || !formData.password || !formData.email) {
            alert("아이디, 비밀번호, 이메일을 모두 입력하세요.")
            return
        }

        // 에러 상태 초기화
        setIsEmailInvalid(false)
        setEmailErrorMessage("")
        setIsIdInvalid(false)

        try {
            setLoading(true)
            await axios.post(`/account/send-verification`, {
                userId: formData.userId,
                email: formData.email,
                password: formData.password,
            })

            alert("인증코드가 이메일로 전송되었습니다.")
            setIsVerificationSent(true)
            // 10분(600초) 카운트다운 시작
            setCountdown(600)
        } catch (error: unknown) {
            const errorResponse = error as { response?: { data?: { errors?: Array<{ field: string; message: string }>; message?: string } } }
            const errorData = errorResponse?.response?.data
            
            // errors 배열이 있으면 각 필드별로 에러 처리
            if (errorData?.errors && Array.isArray(errorData.errors)) {
                errorData.errors.forEach((err: { field: string; message: string }) => {
                    if (err.field === "email") {
                        setIsEmailInvalid(true)
                        setEmailErrorMessage(err.message)
                    } else if (err.field === "userId") {
                        setIsIdInvalid(true)
                    }
                })
            }
            
            // 전체 메시지도 표시
            alert(errorData?.message || "회원가입 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    async function handleVerifyEmail() {
        try {
            const res = await axios.post("/account/verify-email", {
                email: formData.email,
                code: formData.verificationCode,
                userId: formData.userId,
                password: formData.password
            })

            const { accessToken, refreshToken, userId, email, role, onboardingCompleted } = res.data

            // 회원가입 완료 직후 기본값은 "로그인 상태 비유지"로 sessionStorage에 저장
            setAuthTokens("session", {
              accessToken,
              refreshToken,
              userId: String(userId),
              email,
              role,
            })

            // onboardingCompleted는 항상 false (회원가입 완료 후 Step 2로 이동하여 온보딩을 완료해야 함)
            // 백엔드에서 온보딩 프로필 설정 완료 시 자동으로 true로 업데이트됨
            console.log("회원가입 완료, onboardingCompleted:", onboardingCompleted)

            alert("회원가입이 완료되었습니다")

            setIsVerifiedDone(true)   // 인증 완료 처리
        } catch (err: unknown) {
            const errorData = (err as { response?: { data?: { message?: string } } })?.response?.data
            alert(errorData?.message || "인증 실패. 인증번호를 확인해주세요")
            console.error(err)
        }
    }

    async function handleCompleteProfile() {
        try {
            // 토큰이 있는지 확인
            const token = getAccessToken()
            if (!token) {
                alert("인증 토큰이 없습니다. 다시 로그인해주세요.")
                navigate("/login")
                return
            }

            // 디버깅: 토큰 정보 확인
            console.log("토큰 확인:", token)
            try {
                const tokenParts = token.split('.')
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]))
                    console.log("토큰 페이로드:", payload)
                    const now = Math.floor(Date.now() / 1000)
                    console.log("현재 시간:", now)
                    console.log("토큰 만료 시간:", payload.exp)
                    console.log("토큰 만료 여부:", now >= payload.exp)
                }
            } catch (e) {
                console.error("토큰 파싱 오류:", e)
            }

            // axios 인터셉터가 자동으로 토큰 갱신 및 재시도를 처리함
            console.log("프로필 설정 API 호출 시작...");
            const res = await axios.post("/account/onboarding/profile", {
                nickname: formData.nickname,
                skinId: 1, // 기본 스킨 ID
                timezone: "Asia/Seoul",
                lang: "ko-KR",
                certId: formData.targetCertification,
                targetExamMode: "WRITTEN",
                targetRoundId: 0
            })
            console.log("프로필 설정 성공:", res.data);
            console.log("온보딩 응답:", {
                emailVerified: res.data.emailVerified,
                nicknameSet: res.data.nicknameSet,
                goalSelected: res.data.goalSelected,
                settingsReady: res.data.settingsReady,
                completed: res.data.completed,
                completedAt: res.data.completedAt,
                nextStep: res.data.nextStep
            });

            alert("프로필 설정 완료")
            navigate("/")
        } catch (err: unknown) {
            const errorResponse = err as { response?: { status?: number; data?: { message?: string; error_description?: string }; headers?: { [key: string]: string } } }
            console.error("프로필 설정 오류:", err)
            console.error("응답 데이터:", errorResponse?.response?.data)
            console.error("응답 헤더:", errorResponse?.response?.headers)

            // 인터셉터가 이미 토큰 갱신을 시도했지만 실패한 경우
            // 또는 토큰 갱신 후에도 여전히 401이 반환되는 경우
            if (errorResponse?.response?.status === 401) {
                // 백엔드에서 반환한 상세 오류 메시지 확인
                const errorDesc = errorResponse?.response?.headers?.['www-authenticate'] || errorResponse?.response?.data?.error_description || "토큰 검증 실패"
                console.error("인증 오류 상세:", errorDesc)
                console.error("⚠️ 백엔드 문제 가능성: refresh로 받은 새 토큰도 검증에 실패했습니다.")
                console.error("백엔드에서 확인 필요: JWT Secret Key 일치 여부, 토큰 검증 로직")

                // 인터셉터가 이미 재시도를 했는데도 실패했다면, 백엔드 문제
                alert("토큰 검증에 실패했습니다. 서버 측 문제일 수 있습니다. 잠시 후 다시 시도해주세요.")
                clearAuthTokens()
                navigate("/login")
            } else {
                alert(errorResponse?.response?.data?.message || "설정 실패")
            }
        }
    }


    // 닉네임 중복 확인
    const handleCheckNickname = async () => {
        const trimmedNickname = formData.nickname.trim();
        
        if (!trimmedNickname) {
            alert("닉네임을 입력하세요.");
            return;
        }

        // 닉네임 길이 체크 (2-12자)
        if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
            alert("닉네임은 2-12자여야 합니다.");
            return;
        }

        try {
            setIsCheckingNickname(true);
            const res = await axios.get(`/account/check-nickname`, {
                params: { nickname: trimmedNickname },
            });
            setNicknameAvailable(res.data.available);
            if (res.data.available) {
                alert(res.data.message || "사용 가능한 닉네임입니다.");
            } else {
                alert("이미 사용 중인 닉네임입니다.");
            }
        } catch (err: unknown) {
            const errorData = (err as { response?: { data?: { message?: string } } })?.response?.data
            console.error("닉네임 중복 확인 오류:", err);
            alert(errorData?.message || "닉네임 확인 중 오류가 발생했습니다.");
            setNicknameAvailable(null);
        } finally {
            setIsCheckingNickname(false);
        }
    };

    // 3) 뒤로가기
    const handleBack = () => {
        if (step === 1) {
            navigate("/login")
        } else {
            setStep(1)
        }
    }

    const isStep2Valid = formData.nickname && formData.targetCertification

    // 이 아래부터는 UI 완전 동일
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 overflow-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-blue-100">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleBack}
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-blue-700"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            돌아가기
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-3xl">📖</div>
                        <div>
                            <h1 className="text-blue-900">CertMaster</h1>
                            <p className="text-xs text-gray-600">회원가입</p>
                        </div>
                    </div>
                    <div className="w-24" />
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-6 py-12">
                {/* Progress Indicator */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step >= 1
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg'
                                : 'bg-gray-200 text-gray-500'
                                }`}>
                                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : "1"}
                            </div>
                            <span className="hidden sm:inline">계정 정보</span>
                        </div>

                        <div className={`h-1 w-16 sm:w-24 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-200'
                            }`} />

                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step >= 2
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg'
                                : 'bg-gray-200 text-gray-500'
                                }`}>
                                2
                            </div>
                            <span className="hidden sm:inline">프로필 설정</span>
                        </div>
                    </div>
                    <Progress value={step * 50} className="h-2" />
                </motion.div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        // Step 1: Account Information
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="p-8 bg-white/80 backdrop-blur border-2 border-blue-200 shadow-xl">
                                <div className="text-center mb-8">
                                    <div className="text-5xl mb-4">🎓</div>
                                    <h2 className="text-blue-900 mb-2">
                                        계정 정보 입력
                                    </h2>
                                    <p className="text-gray-600">
                                        CertPilot에 오신 것을 환영합니다! ✨
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    {/* 아이디 */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm text-gray-700 flex items-center gap-2">
                                                <User className="w-4 h-4 text-blue-600" />
                                                아이디
                                            </label>

                                            {formData.userId && (
                                                <div className="text-[10px]">
                                                    {isCheckingId ? (
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">⏳ 확인 중</p>
                                                    ) : idAvailable === true ? (
                                                        <p className="text-xs text-green-600 flex items-center gap-1"> <CheckCircle2 className="w-3 h-3" /> 사용 가능한 아이디입니다</p>
                                                    ) : idAvailable === false ? (
                                                        <p className="text-xs text-red-600 flex items-center gap-1">❌ 이미 사용 중인 아이디에요</p>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>

                                        <Input
                                            type="text"
                                            placeholder="사용할 아이디를 입력하세요"
                                            value={formData.userId}
                                            disabled={isVerificationSent}
                                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                            onBlur={handleIdBlur} // ← 포커스 해제 시 유효성 검사
                                            className={`bg-white focus:border-blue-400 transition-all ${isIdInvalid || idAvailable === false
                                                ? "border-red-400 text-red-700 placeholder-red-300"
                                                : "border-blue-200"
                                                }`}
                                        />

                                        <p
                                            className={`text-xs mt-1 transition-colors ${isIdInvalid ? "text-red-500" : "text-gray-500"
                                                }`}
                                        >
                                            영문, 숫자 조합 8-20자
                                        </p>
                                    </div>

                                    {/* 비밀번호 */}
                                    <div>
                                        <label className="text-sm text-gray-700 mb-2 block flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-blue-600" />
                                            비밀번호
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            disabled={isVerificationSent}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            onBlur={handlePasswordBlur}
                                            className={`bg-white focus:border-blue-400 transition-all ${isPasswordInvalid ? "border-red-400 text-red-700 placeholder-red-300" : "border-blue-200"
                                                }`}
                                        />
                                        <p
                                            className={`text-xs mt-1 transition-colors ${isPasswordInvalid ? "text-red-500" : "text-gray-500"
                                                }`}
                                        >
                                            영문, 숫자, 특수문자 조합 8자 이상
                                        </p>
                                    </div>


                                    {/* 비밀번호 확인 */}
                                    <div>
                                        <label className="text-sm text-gray-700 mb-2 block flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-blue-600" />
                                            비밀번호 확인
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.passwordConfirm}
                                            disabled={isVerificationSent}
                                            onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                                            className="bg-white border-blue-200 focus:border-blue-400"
                                        />
                                        {formData.passwordConfirm && (
                                            <p className={`text-xs mt-1 flex items-center gap-1 ${formData.password === formData.passwordConfirm
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                {formData.password === formData.passwordConfirm
                                                    ? <><CheckCircle2 className="w-3 h-3" /> 비밀번호가 일치합니다</>
                                                    : '비밀번호가 일치하지 않습니다'
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {/* 이메일 & 인증번호 */}
                                    <div>
                                        <label className="text-sm text-gray-700 mb-2 block flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-blue-600" />
                                            이메일
                                        </label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="email"
                                                placeholder="your@email.com"
                                                value={formData.email}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, email: e.target.value })
                                                    // 입력 시 에러 상태 초기화
                                                    if (isEmailInvalid) {
                                                        setIsEmailInvalid(false)
                                                        setEmailErrorMessage("")
                                                    }
                                                }}
                                                className={`flex-1 bg-white focus:border-blue-400 transition-all ${isEmailInvalid
                                                    ? "border-red-400 text-red-700 placeholder-red-300"
                                                    : "border-blue-200"
                                                    }`}
                                            />
                                            <div className="relative">
                                                {countdown > 0 && (
                                                    <div className="absolute -top-5 right-0 text-sm font-mono text-blue-600">
                                                        {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                                                    </div>
                                                )}
                                                <Button
                                                    type="button"
                                                    onClick={handleSendVerification}
                                                    disabled={
                                                        !formData.email ||                  // 이메일 없으면 X
                                                        !idAvailable ||                     // 아이디 중복이면 X
                                                        isIdInvalid ||                      // 아이디 형식 틀리면 X
                                                        isPasswordInvalid ||                // 비밀번호 형식 틀리면 X
                                                        formData.password !== formData.passwordConfirm // 비밀번호 확인 불일치면 X
                                                    }
                                                    className="whitespace-nowrap bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isVerificationSent ? (
                                                        <>
                                                            <Mail className="w-4 h-4 mr-1" />
                                                            재발송
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Mail className="w-4 h-4 mr-1" />
                                                            인증발송
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        {isEmailInvalid && emailErrorMessage && (
                                            <p className="text-xs mt-1 text-red-500">
                                                {emailErrorMessage}
                                            </p>
                                        )}
                                    </div>

                                    {/* 인증번호 입력 */}
                                    {isVerificationSent && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <label className="text-sm text-gray-700 mb-2 block flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-blue-600" />
                                                인증번호
                                            </label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="text"
                                                    placeholder="6자리 인증번호 입력"
                                                    value={formData.verificationCode}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, verificationCode: e.target.value })
                                                    }
                                                    maxLength={6}
                                                    className="flex-1 bg-white border-blue-200 focus:border-blue-400"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={handleVerifyEmail}
                                                    disabled={isVerifiedDone}
                                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                                                >
                                                    인증 확인
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Security Info */}
                                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="text-blue-900 mb-1">안전한 정보 보호</h3>
                                            <p className="text-sm text-gray-700">
                                                입력하신 모든 정보는 암호화되어 안전하게 보관됩니다
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => {
                                        if (isVerifiedDone) setStep(2)
                                    }}
                                    disabled={!isVerifiedDone}
                                    className={`w-full mt-6 text-white py-6 
                                        ${isVerifiedDone
                                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                                            : "bg-gray-300 cursor-not-allowed"
                                        }`}
                                >
                                    프로필 설정하기
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Card>
                        </motion.div>
                    ) : (
                        // Step 2: Profile Setup
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="p-8 bg-white/80 backdrop-blur border-2 border-blue-200 shadow-xl">
                                <div className="text-center mb-8">
                                    <div className="text-5xl mb-4">✨</div>
                                    <h2 className="text-blue-900 mb-2">
                                        프로필 설정
                                    </h2>
                                    <p className="text-gray-600">
                                        마지막 단계예요! 조금만 더 힘내세요 🎉
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* 닉네임 */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm text-gray-700 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-blue-600" />
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
                                                className={`flex-1 bg-white focus:border-blue-400 transition-all ${nicknameAvailable === false
                                                    ? "border-red-400 text-red-700 placeholder-red-300"
                                                    : "border-blue-200"
                                                    }`}
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleCheckNickname}
                                                disabled={!formData.nickname.trim() || isCheckingNickname}
                                                className="whitespace-nowrap bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                        ? `border-blue-500 bg-gradient-to-br ${category.color} shadow-lg`
                                                        : 'border-gray-200 bg-white hover:border-blue-300'
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
                                        disabled={!isStep2Valid}
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-6 disabled:opacity-50"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        회원가입 완료
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Terms */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-center text-sm text-gray-600"
                >
                    회원가입 시{" "}
                    <button className="text-blue-600 hover:underline">이용약관</button> 및{" "}
                    <button className="text-blue-600 hover:underline">개인정보처리방침</button>에 동의하게 됩니다
                </motion.div>
            </div>
        </div>
    );
}
