import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom"
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Flame,
  Star,
  Award,
  ChevronRight,
  Settings,
  Bell
} from "lucide-react";
import { NotificationModal } from "./NotificationModal";
import { getNotifications, NOTIFICATION_ICON_MAP, type Notification } from "./api/notificationsApi";
// Format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
import type { UserProfile } from "../types";
import axios from "./api/axiosConfig";
import { CERT_MAP } from "../constants/certMap";

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

// skinId로 프로필 이미지 경로 가져오기
function getProfileImage(skinId: number): string {
  return PROFILE_IMAGE_MAP[skinId] || PROFILE_IMAGE_MAP[1] // 기본값: girl_basic_profile
}

interface HomeDashboardProps {
  userProfile: UserProfile;
}

interface QuickStats {
  solvedToday: number;
  minutesToday: number;
  accuracyToday: number;
  xpToday: number;
  accuracyDelta: number;
}

interface OverviewResponse {
  user: {
    userId: string;
    nickname: string;
    skinId: number;
    level: number;
    xpTotal: number;
    streakDays: number;
  };
  goal: {
    certId: number;
    targetExamMode: string;
    targetRoundId: number;
    targetExamDate: string | null;
    dday: number;
  };
}

interface RankingUser {
  userId: string;
  nickname: string;
  avatarUrl: string;
  level: number;
  score: number;
  xpTotal: number;
  self: boolean;
  rank: number;
}

interface RankingResponse {
  top5: RankingUser[];
  me: RankingUser;
  generatedAt: string;
}

interface ProgressCardResponse {
  totalTopics: number;
  completedTopics: number;
  pendingTopics: number;
  completionRate: number;
  lastStudiedAt: string | null;
}

// 자격증별 아이콘 매핑 (ID 기반)
const CERT_ICON_MAP: Record<number, string> = {
  1: "💻", // 정보처리기사
  2: "🗄️", // SQLD
  3: "📊", // 컴활 1급
  4: "🐧", // 리눅스마스터 2급
};

// 자격증 이름별 아이콘 매핑 (폴백용)
const CERT_NAME_ICON_MAP: Record<string, string> = {
  "정보처리기사": "💻",
  "SQLD": "🗄️",
  "컴활 1급": "📊",
  "리눅스마스터 2급": "🐧",
};

export function HomeDashboard({ userProfile }: HomeDashboardProps) {
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [rankingData, setRankingData] = useState<RankingResponse | null>(null);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [progressData, setProgressData] = useState<ProgressCardResponse | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<"WRITTEN" | "PRACTICAL">("WRITTEN");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateSettingLoading, setDateSettingLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  // Get the target certification exam from API
  const targetCertName = overview?.goal?.certId 
    ? CERT_MAP[overview.goal!.certId as keyof typeof CERT_MAP] 
    : null;
  
  const targetCertIcon = overview?.goal?.certId 
    ? CERT_ICON_MAP[overview.goal!.certId] || "📚"
    : (targetCertName ? CERT_NAME_ICON_MAP[targetCertName] || "📚" : "📚");
  
  const dDay = overview?.goal?.dday ?? null;

  // Update selectedDate when overview changes
  useEffect(() => {
    if (overview?.goal?.targetExamDate) {
      const date = new Date(overview.goal.targetExamDate);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      }
    } else {
      setSelectedDate(undefined);
    }
  }, [overview]);

  // Fetch overview (user and goal data)
  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const res = await axios.get("/progress/home/overview");
      setOverview(res.data);
    } catch (err) {
      console.error("홈 개요 데이터 불러오기 실패", err);
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Set target exam date
  const handleSetDate = async (date: Date | undefined) => {
    if (!date) return;

    try {
      setDateSettingLoading(true);
      const dateString = formatDate(date);
      await axios.put("/account/goal/date", {
        targetExamDate: dateString
      });
      
      // Refresh overview data
      await fetchOverview();
      setDatePickerOpen(false);
    } catch (err) {
      console.error("시험일정 설정 실패", err);
      alert("시험일정 설정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setDateSettingLoading(false);
    }
  };

  // Fetch quick stats
  useEffect(() => {
    async function fetchQuickStats() {
      try {
        setLoading(true);
        const res = await axios.get("/progress/home/quick-stats");
        setQuickStats(res.data);
      } catch (err) {
        console.error("오늘의 성과 데이터 불러오기 실패", err);
        setQuickStats(null);
      } finally {
        setLoading(false);
      }
    }

    fetchQuickStats();
  }, []);

  // Fetch ranking data
  useEffect(() => {
    async function fetchRanking() {
      try {
        setRankingLoading(true);
        const res = await axios.get("/progress/home/ranking");
        setRankingData(res.data);
      } catch (err) {
        console.error("랭킹 데이터 불러오기 실패", err);
        setRankingData(null);
      } finally {
        setRankingLoading(false);
      }
    }

    fetchRanking();
  }, []);

  // Fetch progress card data
  useEffect(() => {
    async function fetchProgress() {
      try {
        setProgressLoading(true);
        const res = await axios.get("/progress/home/progress-card", {
          params: {
            mode: selectedMode
          }
        });
        setProgressData(res.data);
      } catch (err) {
        console.error("학습 진행률 데이터 불러오기 실패", err);
        setProgressData(null);
      } finally {
        setProgressLoading(false);
      }
    }

    fetchProgress();
  }, [selectedMode]);

  // Fetch notifications (최근 4개만)
  useEffect(() => {
    async function fetchNotifications() {
      try {
        setNotificationLoading(true);
        const res = await getNotifications({
          unreadOnly: false,
          page: 0,
          size: 4,
        });
        setNotifications(res.content);
      } catch (err) {
        console.error("알림 데이터 불러오기 실패", err);
        setNotifications([]);
      } finally {
        setNotificationLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Character & D-Day */}
          <div className="space-y-6 flex flex-col">
            {/* Character Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-1"
            >
              <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-0 shadow-lg overflow-hidden h-full flex flex-col">
                <div className="p-6 flex-1 flex flex-col">
                    {overview?.user ? (
                      <>
                        <div className="text-center mb-3">
                          <div className="inline-flex items-center justify-center gap-2 mb-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            <span className="text-purple-700">Level {overview.user.level}</span>
                            <Star className="w-5 h-5 text-yellow-500" />
                          </div>
                        </div>

                        {/* Character Display */}
                        <motion.div
                          className="relative flex-1 flex items-center justify-center"
                          animate={{
                            y: [0, -10, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <div className="text-center bg-white/50 backdrop-blur rounded-2xl p-2 w-full overflow-hidden">
                            <img 
                              src={getProfileImage(overview.user.skinId)} 
                              alt={overview.user.nickname}
                              className="w-full h-auto rounded-xl object-cover"
                            />
                          </div>
                        </motion.div>

                        <div className="mt-4 space-y-3">
                          {/* XP Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-purple-700">경험치</span>
                              <span className="text-purple-700">
                                {overview.user.xpTotal} / {((overview.user.level) + 1) * 500} XP
                              </span>
                            </div>
                            <Progress
                              value={((overview.user.xpTotal) / (((overview.user.level) + 1) * 500)) * 100}
                              className="h-3 bg-purple-200"
                            />
                          </div>

                          {/* Streak */}
                          <div className="flex items-center justify-center gap-2 bg-orange-100 rounded-lg p-3">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="text-orange-700">{overview.user.streakDays}일 연속 학습 🔥</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 flex-1 flex items-center justify-center">
                        <span className="text-purple-600 text-sm">로딩 중...</span>
                      </div>
                    )}
                </div>
              </Card>
            </motion.div>

            {/* D-Day Card */}
            {overviewLoading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1"
              >
                <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 border-0 shadow-lg h-full flex flex-col">
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-center">
                      <span className="text-blue-600 text-sm">로딩 중...</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : targetCertName ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1"
              >
                <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 border-0 shadow-lg h-full flex flex-col">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="text-blue-800">목표 시험 📅</h3>
                      </div>
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-200"
                            disabled={dateSettingLoading}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="min-w-[280px] w-fit p-0" align="end">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              if (date) {
                                handleSetDate(date);
                              }
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <div className="bg-white/50 backdrop-blur rounded-xl p-6 mb-4">
                        <div className="text-center">
                          <div className="text-5xl mb-3">{targetCertIcon}</div>
                          <p className="text-blue-900 mb-2 text-lg font-semibold">{targetCertName}</p>
                          <p className="text-blue-600">
                            {overview?.goal?.targetExamMode || "시험"}
                          </p>
                        </div>
                      </div>

                      {overview?.goal?.targetExamDate !== null ? (
                        <div className="text-center">
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <div className="text-6xl text-blue-600 mb-2 font-bold">D-{Math.abs(dDay)}</div>
                          </motion.div>
                          <p className="text-blue-700">
                            {dDay <= 30 ? "열심히 준비해요! 💪" : "시간이 충분해요! 😊"}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-4xl text-blue-400 mb-2">D-Day</div>
                          <p className="text-blue-600">
                            시험일정을 설정해주세요
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      asChild
                      className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Link to="/certinfo" className="flex items-center justify-center">
                        시험 정보 보기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : null}
          </div>

          {/* Middle Column - Progress & Quick Actions */}
          <div className="space-y-6 flex flex-col">
            {/* Overall Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1"
            >
              <Card className="bg-white/80 backdrop-blur border-0 shadow-lg h-full flex flex-col">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      <h3 className="text-purple-800">학습 진행률 📈</h3>
                    </div>
                    <Tabs value={selectedMode} onValueChange={(v) => setSelectedMode(v as "WRITTEN" | "PRACTICAL")}>
                      <TabsList className="h-8">
                        <TabsTrigger value="WRITTEN" className="text-xs px-3">
                          📝 필기
                        </TabsTrigger>
                        <TabsTrigger value="PRACTICAL" className="text-xs px-3">
                          ⌨️ 실기
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                  {progressLoading ? (
                    <div className="space-y-4 flex-1 flex items-center justify-center">
                      <div className="bg-white/50 backdrop-blur rounded-lg p-4 flex items-center justify-center">
                        <span className="text-purple-600 text-sm">로딩 중...</span>
                      </div>
                    </div>
                  ) : progressData ? (
                    <div className="space-y-3 flex-1">
                      {/* Overall Progress Bar */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">{targetCertIcon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-purple-800">{targetCertName || "학습 진행률"}</span>
                              <span className="text-purple-600">{progressData.completionRate.toFixed(1)}%</span>
                            </div>
                            <Progress
                              value={progressData.completionRate}
                              className="h-3"
                              style={{
                                background: "#3B82F620",
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-purple-600 ml-14">
                          <span>전체 토픽: {progressData.totalTopics}개</span>
                          <span>완료: {progressData.completedTopics}개</span>
                          <span>남은: {progressData.pendingTopics}개</span>
                        </div>
                      </motion.div>

                      {/* Achievement Badges */}
                      <div className="grid grid-cols-2 gap-3">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 }}
                          className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg p-3 text-center"
                        >
                          <div className="text-2xl mb-1">🎯</div>
                          <div className="text-amber-800 text-xs">달성률</div>
                          <div className="text-amber-700">{progressData.completionRate.toFixed(1)}%</div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 }}
                          className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-3 text-center"
                        >
                          <div className="text-2xl mb-1">✅</div>
                          <div className="text-green-800 text-xs">완료 토픽</div>
                          <div className="text-green-700">{progressData.completedTopics}개</div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7 }}
                          className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-3 text-center"
                        >
                          <div className="text-2xl mb-1">📚</div>
                          <div className="text-blue-800 text-xs">총 토픽</div>
                          <div className="text-blue-700">{progressData.totalTopics}개</div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 }}
                          className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-3 text-center"
                        >
                          <div className="text-2xl mb-1">⏳</div>
                          <div className="text-purple-800 text-xs">남은 토픽</div>
                          <div className="text-purple-700">{progressData.pendingTopics}개</div>
                        </motion.div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white/50 backdrop-blur rounded-lg p-4 flex items-center justify-center">
                        <span className="text-purple-600 text-sm">데이터를 불러올 수 없습니다</span>
                      </div>
                    </div>
                  )}
                  </div>

                  <Button
                    asChild
                    className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <Link to="/report" className="flex items-center justify-center">
                      상세 리포트 보기
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Today's Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex-1"
            >
              <Card className="bg-gradient-to-br from-green-100 to-emerald-100 border-0 shadow-lg h-full flex flex-col">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-green-600" />
                    <h3 className="text-green-800">오늘의 성과 ✨</h3>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                  {loading ? (
                    <div className="space-y-3 flex-1 flex items-center justify-center">
                      <div className="bg-white/50 backdrop-blur rounded-lg p-3 flex items-center justify-center">
                        <span className="text-green-600 text-sm">로딩 중...</span>
                      </div>
                    </div>
                  ) : quickStats ? (
                    <>
                      <div className="space-y-3 flex-1">
                        <div className="bg-white/50 backdrop-blur rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-2xl">📝</div>
                            <span className="text-green-800">문제 풀이</span>
                          </div>
                          <span className="text-green-600 font-semibold">{quickStats.solvedToday}문제</span>
                        </div>

                        <div className="bg-white/50 backdrop-blur rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-2xl">⏱️</div>
                            <span className="text-green-800">학습 시간</span>
                          </div>
                          <span className="text-green-600 font-semibold">{quickStats.minutesToday}분</span>
                        </div>

                        <div className="bg-white/50 backdrop-blur rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-2xl">✅</div>
                            <span className="text-green-800">정답률</span>
                          </div>
                          <span className="text-green-600 font-semibold">{(quickStats.accuracyToday * 100).toFixed(0)}%</span>
                        </div>

                        <div className="bg-white/50 backdrop-blur rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-2xl">⭐</div>
                            <span className="text-green-800">획득 XP</span>
                          </div>
                          <span className="text-green-600 font-semibold">+{quickStats.xpToday.toLocaleString()} XP</span>
                        </div>
                      </div>

                      <div className={`mt-4 text-center text-sm ${
                        quickStats.accuracyDelta > 0 
                          ? "text-green-700" 
                          : quickStats.accuracyDelta < 0 
                          ? "text-orange-600" 
                          : "text-green-600"
                      }`}>
                        {quickStats.accuracyDelta > 0 ? (
                          <>
                            <TrendingUp className="w-4 h-4 inline-block mr-1" />
                            정답률이 어제보다 {(quickStats.accuracyDelta * 100).toFixed(0)}% 향상되었어요! 🎉
                          </>
                        ) : quickStats.accuracyDelta < 0 ? (
                          <>
                            <TrendingUp className="w-4 h-4 inline-block mr-1 rotate-180" />
                            정답률이 어제보다 {(Math.abs(quickStats.accuracyDelta) * 100).toFixed(0)}% 감소했어요
                          </>
                        ) : (
                          <>
                            정답률이 어제와 동일해요
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 flex-1 flex items-center justify-center">
                      <div className="bg-white/50 backdrop-blur rounded-lg p-3 flex items-center justify-center">
                        <span className="text-green-600 text-sm">데이터를 불러올 수 없습니다</span>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Ranking */}
          <div className="space-y-6 flex flex-col">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex-1"
            >
              <Card className="bg-gradient-to-br from-amber-100 to-yellow-100 border-0 shadow-lg h-full flex flex-col">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-amber-600" />
                    <h3 className="text-amber-800">실시간 랭킹 🏅</h3>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                  {rankingLoading ? (
                    <div className="space-y-3 flex-1 flex items-center justify-center">
                      <div className="bg-white/50 backdrop-blur rounded-lg p-3 flex items-center justify-center">
                        <span className="text-amber-600 text-sm">로딩 중...</span>
                      </div>
                    </div>
                  ) : rankingData ? (
                    <div className="space-y-3 flex-1">
                      {rankingData.top5.map((user, idx) => (
                        <motion.div
                          key={user.userId}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                          className={`rounded-lg p-3 ${user.self
                            ? "bg-gradient-to-r from-purple-200 to-pink-200 border-2 border-purple-400"
                            : "bg-white/50 backdrop-blur"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 min-w-[60px]">
                              {user.rank === 1 && <span className="text-xl">🥇</span>}
                              {user.rank === 2 && <span className="text-xl">🥈</span>}
                              {user.rank === 3 && <span className="text-xl">🥉</span>}
                              {user.rank > 3 && (
                                <span className="text-purple-600 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-sm">
                                  {user.rank}
                                </span>
                              )}
                            </div>

                            <div className="text-2xl flex items-center justify-center w-8 h-8">
                              {user.avatarUrl && !imageErrors.has(user.userId) ? (
                                <img 
                                  src={user.avatarUrl} 
                                  alt={user.nickname}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={() => {
                                    setImageErrors(prev => new Set(prev).add(user.userId));
                                  }}
                                />
                              ) : (
                                <span>👤</span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-purple-900 text-sm truncate">
                                  {user.nickname}
                                </span>
                                {user.self && (
                                  <Badge className="bg-purple-500 text-white text-xs">나</Badge>
                                )}
                              </div>
                              <p className="text-purple-600 text-xs">Lv.{user.level} · {user.score.toLocaleString()}점</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1 flex items-center justify-center">
                      <div className="bg-white/50 backdrop-blur rounded-lg p-3 flex items-center justify-center">
                        <span className="text-amber-600 text-sm">데이터를 불러올 수 없습니다</span>
                      </div>
                    </div>
                  )}
                  </div>

                  <Button
                    asChild
                    className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Link to="/community" className="flex items-center justify-center">
                      전체 랭킹 보기
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex-1"
            >
              <Card className="bg-gradient-to-br from-indigo-100 to-purple-100 border-0 shadow-lg h-full flex flex-col">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-indigo-800">알림 🔔</h3>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                  {notificationLoading ? (
                    <div className="space-y-3 flex-1 flex items-center justify-center">
                      <div className="bg-white/50 backdrop-blur rounded-lg p-3 flex items-center justify-center">
                        <span className="text-indigo-600 text-sm">로딩 중...</span>
                      </div>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="space-y-2 flex-1">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-lg p-3 cursor-pointer transition-all ${
                            notification.isRead
                              ? "bg-white/50 backdrop-blur hover:bg-white/70"
                              : "bg-white/80 backdrop-blur border-l-4 border-indigo-500 hover:bg-white"
                          }`}
                          onClick={() => setNotificationModalOpen(true)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="text-xl flex-shrink-0">
                              {NOTIFICATION_ICON_MAP[notification.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-sm mb-1 truncate ${
                                  notification.isRead
                                    ? "text-gray-700"
                                    : "text-gray-900 font-bold"
                                }`}
                              >
                                {notification.title}
                              </h4>
                              <p
                                className={`text-xs line-clamp-2 ${
                                  notification.isRead
                                    ? "text-gray-600"
                                    : "text-gray-800"
                                }`}
                              >
                                {notification.message}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1 flex items-center justify-center">
                      <div className="bg-white/50 backdrop-blur rounded-lg p-3 flex items-center justify-center">
                        <span className="text-indigo-600 text-sm">알림이 없습니다</span>
                      </div>
                    </div>
                  )}
                  </div>

                  <Button
                    onClick={() => setNotificationModalOpen(true)}
                    className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    더 보기
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        open={notificationModalOpen}
        onOpenChange={setNotificationModalOpen}
      />
    </div>
  );
}
