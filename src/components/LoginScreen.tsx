import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Sparkles,
  BookOpen,
  Trophy,
  Users,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface LoginScreenProps {
  onLogin: () => void;
  onSignUp?: () => void;
}

export function LoginScreen({ onLogin, onSignUp }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate()

  const features = [
    {
      icon: "📚",
      title: "체계적 학습",
      description: "Micro/Review 모드로 효율적 학습",
      color: "from-blue-400 to-cyan-400"
    },
    {
      icon: "🎯",
      title: "맞춤 학습",
      description: "난이도별, 약점 보완 퀴즈",
      color: "from-sky-400 to-blue-400"
    },
    {
      icon: "⚔️",
      title: "배틀 모드",
      description: "친구와 겨루며 재미있게 학습",
      color: "from-cyan-400 to-teal-400"
    },
    {
      icon: "📊",
      title: "학습 리포트",
      description: "나의 학습 현황을 한눈에",
      color: "from-blue-500 to-indigo-500"
    }
  ];

  const categories = [
    { name: "정보처리기사", icon: "💻", count: "500+ 문제" },
    { name: "토익", icon: "🇺🇸", count: "800+ 문제" },
    { name: "재무회계", icon: "💰", count: "400+ 문제" },
    { name: "법률", icon: "⚖️", count: "600+ 문제" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제로는 여기서 인증 로직을 처리합니다
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-3xl">📖</div>
            <div>
              <h1 className="text-blue-900">CertMaster</h1>
              <p className="text-sm text-gray-600">자격증 공부의 시작</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            무료 체험
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Hero Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hero */}
            <div className="mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="bg-blue-100 text-blue-700 mb-4">
                  AI 기반 학습 플랫폼
                </Badge>
                <h1 className="text-5xl text-blue-900 mb-4">
                  자격증 합격,<br />
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    더 쉽고 재미있게
                  </span> ✨
                </h1>
                <p className="text-xl text-gray-600 mb-6">
                  체계적인 학습 시스템과 AI 해설로<br />
                  자격증 준비를 완벽하게 지원합니다
                </p>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-3 gap-4 mb-12"
              >
                <Card className="p-4 text-center bg-white/60 backdrop-blur">
                  <div className="text-3xl mb-2">🎓</div>
                  <div className="text-blue-900">10,000+</div>
                  <div className="text-sm text-gray-600">학습자</div>
                </Card>
                <Card className="p-4 text-center bg-white/60 backdrop-blur">
                  <div className="text-3xl mb-2">📝</div>
                  <div className="text-blue-900">2,300+</div>
                  <div className="text-sm text-gray-600">문제</div>
                </Card>
                <Card className="p-4 text-center bg-white/60 backdrop-blur">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-blue-900">95%</div>
                  <div className="text-sm text-gray-600">합격률</div>
                </Card>
              </motion.div>
            </div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-12"
            >
              <h2 className="text-blue-900 mb-6">🎯 주요 기능</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <Card className="p-4 hover:shadow-lg transition-shadow bg-white/60 backdrop-blur">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.color} flex-shrink-0`}>
                          <div className="text-2xl">{feature.icon}</div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-blue-900 mb-1">{feature.title}</h3>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h2 className="text-blue-900 mb-6">📚 지원 자격증</h2>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category, index) => (
                  <Card
                    key={index}
                    className="p-4 bg-white/60 backdrop-blur hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl group-hover:scale-110 transition-transform">
                        {category.icon}
                      </div>
                      <div>
                        <div className="text-blue-900">{category.name}</div>
                        <div className="text-sm text-gray-600">{category.count}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login/Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:sticky lg:top-24"
          >
            <Card className="p-8 bg-white/80 backdrop-blur border-2 border-blue-200 shadow-xl">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🎓</div>
                <h2 className="text-blue-900 mb-2">로그인</h2>
                <p className="text-gray-600">학습을 계속하려면 로그인하세요</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-700 mb-2 block">이메일</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white border-blue-200 focus:border-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700 mb-2 block">비밀번호</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border-blue-200 focus:border-blue-400"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-blue-300" />
                    로그인 유지
                  </label>
                  <button type="button" className="text-blue-600 hover:underline">
                    비밀번호 찾기
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-6"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  로그인하기
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">또는</span>
                  </div>
                </div>

                {/* Social Login */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google로 계속하기
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="#03C75A" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 16.5h-9v-9h9v9z" />
                    </svg>
                    네이버로 계속하기
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="#FEE500" viewBox="0 0 24 24">
                      <path fill="#000000" d="M12 3c-4.97 0-9 3.37-9 7.5 0 2.63 1.69 4.95 4.24 6.32l-.75 2.77 2.84-1.56c.87.19 1.78.29 2.67.29 4.97 0 9-3.37 9-7.5S16.97 3 12 3z" />
                    </svg>
                    카카오로 계속하기
                  </Button>
                </div>

                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    계정이 없으신가요? <span className="text-blue-600 font-medium">회원가입</span>
                  </button>
                </div>
              </form>
            </Card>

            {/* Quick Demo Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 text-center"
            >
              <Button
                onClick={onLogin}
                variant="ghost"
                className="text-blue-600 hover:bg-blue-50"
              >
                <Zap className="w-4 h-4 mr-2" />
                로그인 없이 둘러보기
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 pt-8 border-t border-blue-100 text-center text-gray-600"
        >
          <p className="mb-2">© 2025 CertMaster. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <button className="hover:text-blue-600">이용약관</button>
            <span>·</span>
            <button className="hover:text-blue-600">개인정보처리방침</button>
            <span>·</span>
            <button className="hover:text-blue-600">고객센터</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
