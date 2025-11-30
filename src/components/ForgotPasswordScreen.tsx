import axios from "./api/axiosConfig";
import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ArrowLeft, Mail, CheckCircle, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ForgotPasswordScreenProps {
    onBack: () => void;
}

export function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
    const [step, setStep] = useState<"email" | "code" | "complete">("email");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const navigate = useNavigate()
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState("");

    // 1️⃣ 인증 메일 전송
    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("/account/forgot-password", { userId: username });
            alert("인증 코드가 이메일로 전송되었습니다!");
            setStep("code");
        } catch (err: any) {
            alert(err.response?.data || "이메일 발송 중 오류가 발생했습니다");
        }
    };

    // 2️⃣ 인증 코드 확인
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post("/account/forgot-password/verify", {
                email,
                code: verificationCode,
            });
            alert(res.data.message);
            setStep("complete");
        } catch (err: any) {
            alert(err.response?.data || "인증 코드가 올바르지 않습니다.");
        }
    };

    // 3️⃣ 비밀번호 재설정
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            alert("이메일 정보가 누락되었습니다. 처음부터 다시 시도해주세요.");
            setStep("email");
            return;
        }

        try {
            const res = await axios.post("/account/forgot-password/reset", {
                email,
                newPassword,
            });
            alert(res.data.message);
            navigate("/login");
        } catch (err: any) {
            console.error("비밀번호 변경 에러:", err.response || err);
            alert(err.response?.data || "비밀번호 변경 중 오류가 발생했습니다.");
        }
    };

    // 비밀번호 형식 유효성 판단
    const handleNewPasswordBlur = () => {
        setIsPasswordInvalid(!passwordRegex.test(newPassword));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                <Button onClick={() => navigate("/login")} variant="ghost" className="mb-4 text-gray-600 hover:text-purple-600">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    로그인으로 돌아가기
                </Button>

                <Card className="p-8 bg-white/80 backdrop-blur border-2 border-purple-200 shadow-xl">
                    {/* STEP 1: 아이디 입력 */}
                    {step === "email" && (
                        <form onSubmit={handleSendEmail}>
                            <h2 className="text-purple-900 mb-4 text-center text-lg">비밀번호 찾기</h2>
                            <label className="text-sm text-gray-700 mb-2 block">아이디</label>
                            <Input
                                type="text"
                                placeholder="가입한 아이디 입력"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mb-4"
                                required
                            />
                            <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-6">
                                <Mail className="w-4 h-4 mr-2" />
                                인증 코드 보내기
                            </Button>
                        </form>
                    )}

                    {/* STEP 2: 인증 코드 입력 */}
                    {step === "code" && (
                        <form onSubmit={handleVerifyCode}>
                            <h2 className="text-purple-900 mb-4 text-center text-lg">이메일 인증</h2>
                            <label className="text-sm text-gray-700 mb-2 block">이메일</label>
                            <Input
                                type="email"
                                placeholder="가입 시 사용한 이메일"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mb-4"
                                required
                            />
                            <label className="text-sm text-gray-700 mb-2 block">인증 코드</label>
                            <Input
                                type="text"
                                placeholder="6자리 코드"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="mb-4"
                                required
                            />
                            <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-6">
                                인증하기
                            </Button>
                        </form>
                    )}

                    {/* STEP 3: 비밀번호 재설정 */}
                    {step === "complete" && (
                        <form onSubmit={handleResetPassword}>
                            <h2 className="text-purple-900 mb-4 text-center text-lg">새 비밀번호 설정</h2>

                            <label className="text-sm text-gray-700 mb-2 block">새 비밀번호</label>

                            <Input
                                type="password"
                                placeholder="새 비밀번호 입력"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value)
                                    if (isPasswordInvalid) {
                                        setIsPasswordInvalid(false)
                                    }
                                }}
                                onBlur={handleNewPasswordBlur}
                                className={`bg-white focus:border-purple-400 transition-all ${isPasswordInvalid
                                    ? "border-red-400 text-red-700 placeholder-red-300"
                                    : "border-purple-200"
                                    }`}
                                required
                            />

                            <p
                                className={`text-xs mt-1 transition-colors ${isPasswordInvalid ? "text-red-500" : "text-gray-500"
                                    }`}
                            >
                                영문 숫자 특수문자 포함 8자 이상
                            </p>

                            {/* 비밀번호 재확인 */}
                            <label className="text-sm text-gray-700 mb-2 block mt-4">비밀번호 확인</label>

                            <Input
                                type="password"
                                placeholder="새 비밀번호 다시 입력"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                className="bg-white border-purple-200 focus:border-purple-400"
                            />

                            {passwordConfirm && (
                                <p
                                    className={`text-xs mt-1 flex items-center gap-1 ${newPassword === passwordConfirm ? "text-green-600" : "text-red-600"
                                        }`}
                                >
                                    {newPassword === passwordConfirm ? (
                                        <>
                                            <CheckCircle className="w-3 h-3" /> 비밀번호가 일치합니다
                                        </>
                                    ) : (
                                        "비밀번호가 일치하지 않습니다"
                                    )}
                                </p>
                            )}

                            <Button
                                type="submit"
                                disabled={
                                    !passwordRegex.test(newPassword) ||
                                    newPassword !== passwordConfirm
                                }
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-6 mt-4 disabled:opacity-50"
                            >
                                비밀번호 변경하기
                            </Button>
                        </form>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}
