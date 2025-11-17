import axios from "./api/axiosConfig"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Progress } from "./ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, Lock, User, Sparkles, Shield, Zap } from "lucide-react"

export function SignUpScreen() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [isVerificationSent, setIsVerificationSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isCheckingId, setIsCheckingId] = useState(false)
    const [idAvailable, setIdAvailable] = useState<boolean | null>(null)        // 중복 여부
    const [isIdInvalid, setIsIdInvalid] = useState(false);      // 8~20글자, 영어/숫자 포함 조건 확인
    const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);      // 비밀번호 조건

    // 예시: Step2 자격증 선택용 mock 데이터
    const categories = [
        { id: "정보처리기사", name: "정보처리기사", icon: "💻", color: "from-indigo-400 to-blue-400" },
        { id: "컴퓨터활용능력", name: "컴활", icon: "📊", color: "from-green-400 to-teal-400" },
        { id: "SQLD", name: "SQLD", icon: "🧠", color: "from-yellow-400 to-orange-400" },
        { id: "리눅스마스터", name: "리눅스", icon: "🐧", color: "from-gray-400 to-slate-400" },
    ]

    // 아이디 유효성 정규식 (영문+숫자, 8~20자)
    const idRegex = /^[A-Za-z0-9]{8,20}$/;
    // 비밀번호 정규식: 영문 + 숫자 + 특수문자 최소 1개씩 포함, 8자 이상
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;


    const [formData, setFormData] = useState({
        userId: "",
        password: "",
        passwordConfirm: "",
        email: "",
        verificationCode: "",
        nickname: "",
        targetCertification: "",
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
                const res = await axios.get(`account/check-userId`, {
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

    // 1) 이메일 인증 전송 (회원가입 단계)
    const handleSendVerification = async () => {
        if (!formData.userId || !formData.password || !formData.email) {
            alert("아이디, 비밀번호, 이메일을 모두 입력하세요.")
            return
        }

        try {
            setLoading(true)
            await axios.post(`/account/send-verification`, {
                userId: formData.userId,
                email: formData.email,
                password: formData.password,
            })

            alert("인증코드가 이메일로 전송되었습니다.")
            setIsVerificationSent(true)
        } catch (error: any) {
            alert(error.response?.data?.message || "회원가입 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 2) 다음 버튼 로직 (Step1 → Step2 or 완료)
    const handleNext = async () => {
        if (step === 1) {
            setStep(2)
        } else {
            try {
                setLoading(true)
                await axios.post(`/account/verify-email`, {
                    email: formData.email,
                    code: formData.verificationCode,
                    nickname: formData.nickname,
                    targetCertification: formData.targetCertification,
                })

                alert("회원가입 완료! 로그인 해주세요.")
                navigate("/login")
            } catch (error: any) {
                alert(error.response?.data?.message || "인증 실패. 인증번호를 확인해주세요.")
            } finally {
                setLoading(false)
            }
        }
    }

    async function handleRegister() {
        try {
            const res = await axios.post(`/account/register`, {
                username: formData.userId,
                password: formData.password,
                email: formData.email
            })
            console.log(res.data) // userId, username 등 확인
            navigate("/login")
        } catch (err) {
            console.error(err)
        }
    }

    async function handleVerifyEmail() {
        try {
            const res = await axios.post("/account/verify-email", {
                email: formData.email,
                code: formData.verificationCode,
                username: formData.userId,   // 추가
                password: formData.password  // 추가
            });

            alert("이메일 인증 및 회원가입이 완료되었습니다!");
            setStep(2); // 다음 단계(프로필 설정)으로 전환
        } catch (err: any) {
            alert(err.response?.data?.message || "인증 실패. 인증번호를 확인해주세요.");
            console.error("인증 실패:", err);
        }
    }


    // 3) 뒤로가기
    const handleBack = () => {
        if (step === 1) {
            navigate("/login")
        } else {
            setStep(1)
        }
    }

    // 유효성 검사
    const isStep1Valid =
        formData.userId &&
        formData.password &&
        formData.passwordConfirm &&
        formData.password === formData.passwordConfirm &&
        formData.email &&
        formData.verificationCode

    const isStep2Valid = formData.nickname && formData.targetCertification

    // 이 아래부터는 UI 완전 동일
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 overflow-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-purple-100">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleBack}
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-purple-700"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            돌아가기
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-3xl">📖</div>
                        <div>
                            <h1 className="text-purple-900">CertMaster</h1>
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
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step >= 1
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                                : 'bg-gray-200 text-gray-500'
                                }`}>
                                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : "1"}
                            </div>
                            <span className="hidden sm:inline">계정 정보</span>
                        </div>

                        <div className={`h-1 w-16 sm:w-24 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-200'
                            }`} />

                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step >= 2
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
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
                            <Card className="p-8 bg-white/80 backdrop-blur border-2 border-purple-200 shadow-xl">
                                <div className="text-center mb-8">
                                    <div className="text-5xl mb-4">🎓</div>
                                    <h2 className="text-purple-900 mb-2">
                                        계정 정보 입력
                                    </h2>
                                    <p className="text-gray-600">
                                        CertMaster에 오신 것을 환영합니다! ✨
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    {/* 아이디 */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm text-gray-700 flex items-center gap-2">
                                                <User className="w-4 h-4 text-purple-600" />
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
                                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                            onBlur={handleIdBlur} // ← 포커스 해제 시 유효성 검사
                                            className={`bg-white focus:border-purple-400 transition-all ${isIdInvalid || idAvailable === false
                                                ? "border-red-400 text-red-700 placeholder-red-300"
                                                : "border-purple-200"
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
                                            <Lock className="w-4 h-4 text-purple-600" />
                                            비밀번호
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            onBlur={handlePasswordBlur}
                                            className={`bg-white focus:border-purple-400 transition-all ${isPasswordInvalid ? "border-red-400 text-red-700 placeholder-red-300" : "border-purple-200"
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
                                            <Lock className="w-4 h-4 text-purple-600" />
                                            비밀번호 확인
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.passwordConfirm}
                                            onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                                            className="bg-white border-purple-200 focus:border-purple-400"
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
                                            <Mail className="w-4 h-4 text-purple-600" />
                                            이메일
                                        </label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="email"
                                                placeholder="your@email.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="flex-1 bg-white border-purple-200 focus:border-purple-400"
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleSendVerification}
                                                disabled={
                                                    !formData.email ||                  // 이메일 없으면 X
                                                    isVerificationSent ||               // 이미 발송됐으면 X
                                                    !idAvailable ||                     // 아이디 중복이면 X
                                                    isIdInvalid ||                      // 아이디 형식 틀리면 X
                                                    isPasswordInvalid ||                // 비밀번호 형식 틀리면 X
                                                    formData.password !== formData.passwordConfirm // 비밀번호 확인 불일치면 X
                                                }
                                                className={`whitespace-nowrap ${isVerificationSent
                                                    ? 'bg-green-500 hover:bg-green-600'
                                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                                                    } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {isVerificationSent ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                                        발송완료
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

                                    {/* 인증번호 입력 */}
                                    {isVerificationSent && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <label className="text-sm text-gray-700 mb-2 block flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-purple-600" />
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
                                                    className="flex-1 bg-white border-purple-200 focus:border-purple-400"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={handleVerifyEmail} // 여기만 추가하면 됨 (백엔드 연결용 함수)
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
                                    onClick={handleNext}
                                    disabled={!isStep1Valid}
                                    className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 disabled:opacity-50"
                                >
                                    회원가입 완료
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
                            <Card className="p-8 bg-white/80 backdrop-blur border-2 border-purple-200 shadow-xl">
                                <div className="text-center mb-8">
                                    <div className="text-5xl mb-4">✨</div>
                                    <h2 className="text-purple-900 mb-2">
                                        프로필 설정
                                    </h2>
                                    <p className="text-gray-600">
                                        마지막 단계예요! 조금만 더 힘내세요 🎉
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* 닉네임 */}
                                    <div>
                                        <label className="text-sm text-gray-700 mb-2 block flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-purple-600" />
                                            닉네임
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="다른 사람들에게 보여질 닉네임"
                                            value={formData.nickname}
                                            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                            className="bg-white border-purple-200 focus:border-purple-400"
                                        />
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
                                                    key={category.id}
                                                    onClick={() => setFormData({ ...formData, targetCertification: category.id })}
                                                    className={`p-5 rounded-xl border-2 transition-all transform hover:scale-105 ${formData.targetCertification === category.id
                                                        ? `border-purple-500 bg-gradient-to-br ${category.color} shadow-lg`
                                                        : 'border-gray-200 bg-white hover:border-purple-300'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className={`text-4xl transition-transform ${formData.targetCertification === category.id ? 'scale-110' : ''
                                                            }`}>
                                                            {category.icon}
                                                        </div>
                                                        <div className={`transition-colors ${formData.targetCertification === category.id
                                                            ? 'text-white'
                                                            : 'text-gray-900'
                                                            }`}>
                                                            {category.name}
                                                        </div>
                                                        {formData.targetCertification === category.id && (
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

                                    {/* 가입 혜택 */}
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
                                        <h3 className="text-purple-900 mb-3 flex items-center gap-2">
                                            🎁 가입 축하 혜택
                                        </h3>
                                        <div className="space-y-2">
                                            {[
                                                "7일 무료 프리미엄 체험",
                                                "1,000 포인트 즉시 지급",
                                                "AI 해설 무제한 이용",
                                                "배틀 모드 즉시 참여",
                                                "커스텀 아바타 아이템 증정"
                                            ].map((benefit, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="flex items-center gap-2 text-sm text-gray-700"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                                                    {benefit}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <Button
                                        onClick={() => setStep(1)}
                                        variant="outline"
                                        className="flex-1 border-2 border-purple-200 hover:bg-purple-50"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        이전
                                    </Button>
                                    <Button
                                        onClick={handleVerifyEmail}
                                        disabled={!isStep2Valid}
                                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 disabled:opacity-50"
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
                    <button className="text-purple-600 hover:underline">이용약관</button> 및{" "}
                    <button className="text-purple-600 hover:underline">개인정보처리방침</button>에 동의하게 됩니다
                </motion.div>
            </div>
        </div>
    );
}
