import { useState, useEffect } from "react";
import axios from "../api/axiosConfig"
import { useNavigate } from "react-router-dom"
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Settings, User, Bell, Database, Save, Download, Trash2, Edit, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface SettingsDashboardProps {
  userProfile: {
    name: string;
    avatar: string;
    targetCertification: string;
    level: number;
    xp: number;
  };
  userSettings: {
    timerEnabled: boolean;
    timerDuration: number;
    hintsEnabled: boolean;
    soundEnabled: boolean;
    notifications: {
      dailyReminder: boolean;
      weeklyReport: boolean;
    };
  };
  onUpdateProfile: (profile: any) => void;
  onUpdateSettings: (settings: any) => void;
  onLogout: () => void;
}

export function SettingsDashboard({
  userProfile,
  userSettings,
  onUpdateProfile,
  onUpdateSettings,
  onLogout
}: SettingsDashboardProps) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(userProfile);
  const [settings, setSettings] = useState(userSettings);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // 자격증 선택 목록
  const categories = [
    { certId: 1, name: "정보처리기사", icon: "💻", color: "from-indigo-400 to-blue-400" },
    { certId: 2, name: "컴활", icon: "📊", color: "from-green-400 to-teal-400" },
    { certId: 3, name: "SQLD", icon: "🧠", color: "from-yellow-400 to-orange-400" },
    { certId: 4, name: "리눅스", icon: "🐧", color: "from-gray-400 to-slate-400" },
  ];
  
  // 현재 선택된 자격증 ID 찾기 (이름으로 매칭)
  const getCurrentCertId = () => {
    const found = categories.find(cat => cat.name === profile.targetCertification);
    return found ? found.certId : 0;
  };
  
  const [selectedCertId, setSelectedCertId] = useState(getCurrentCertId());
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCheckNickname = async () => {
    const trimmedNickname = profile.name.trim();
    
    if (!trimmedNickname) {
      toast.error("닉네임을 입력해주세요.");
      return;
    }

    try {
      setIsCheckingNickname(true);
      const res = await axios.get(`/account/check-nickname`, {
        params: { nickname: trimmedNickname },
      });
      setNicknameAvailable(res.data.available);
      if (res.data.available) {
        toast.success("사용 가능한 닉네임입니다!");
      } else {
        toast.error("이미 사용 중인 닉네임입니다.");
      }
    } catch (err: any) {
      console.error("닉네임 중복 확인 오류:", err);
      toast.error(err.response?.data?.message || "중복 확인 중 오류가 발생했습니다.");
      setNicknameAvailable(null);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setNicknameAvailable(null); // 편집 모드 진입 시 중복 확인 상태 초기화
  };

  const handleSaveProfile = () => {
    // 눈 속임용: 실제로는 원래 값으로 되돌림
    const originalProfile = { ...userProfile };
    setProfile(originalProfile);
    setSelectedCertId(getCurrentCertId());
    onUpdateProfile(originalProfile);
    setIsEditingProfile(false);
    toast.success("프로필이 저장되었습니다!");
  };

  const handleCancelEdit = () => {
    setProfile(userProfile); // 원래 값으로 복원
    setSelectedCertId(getCurrentCertId()); // 선택된 자격증도 원래 값으로 복원
    setIsEditingProfile(false);
  };
  
  // userProfile이 변경되면 selectedCertId도 업데이트
  useEffect(() => {
    setSelectedCertId(getCurrentCertId());
  }, [userProfile.targetCertification]);

  const handleSaveSettings = () => {
    onUpdateSettings(settings);
    toast.success("설정이 저장되었습니다!");
  };

  const handleExportData = () => {
    toast.success("데이터 내보내기가 시작되었습니다!");
  };

  const handleResetData = () => {
    if (confirm("정말로 모든 학습 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      toast.success("데이터가 초기화되었습니다.");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("/account/logout")
    } catch (e) {
      console.error("로그아웃 API 실패", e)
    }

    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("userId")

    toast.success("로그아웃 완료")
     onLogout()   // 여기서 상태 false 됨
    navigate("/login", { replace: true })
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.error("비밀번호를 입력해주세요.");
      return;
    }

    try {
      setIsDeleting(true);
      await axios.post("/account/withdraw", {
        password: deletePassword,
      });

      toast.success("계정이 탈퇴되었습니다.");
      
      // 로컬 스토리지 정리
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      
      // 로그아웃 처리
      onLogout();
      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error("계정 탈퇴 오류:", err);
      toast.error(err.response?.data?.message || "계정 탈퇴 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletePassword("");
    }
  };


  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-purple-600" />
            <h1 className="text-purple-900">설정</h1>
          </div>
          <p className="text-gray-600">내 정보와 학습 환경을 관리하세요</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              프로필
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              학습 환경
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              데이터 관리
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="p-6 border-2 border-purple-200">
              <h2 className="text-purple-900 mb-6">프로필 정보</h2>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <Label htmlFor="name">닉네임</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => {
                        setProfile({ ...profile, name: e.target.value });
                        setNicknameAvailable(null); // 입력 시 중복 확인 상태 초기화
                      }}
                      className={`flex-1 ${
                        nicknameAvailable === false ? "border-red-400" : 
                        nicknameAvailable === true ? "border-green-400" : ""
                      }`}
                      disabled={!isEditingProfile}
                      placeholder="닉네임을 입력하세요"
                    />
                    <Button
                      type="button"
                      onClick={handleCheckNickname}
                      disabled={!isEditingProfile || isCheckingNickname || !profile.name.trim()}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      {isCheckingNickname ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          확인 중
                        </>
                      ) : (
                        "중복확인"
                      )}
                    </Button>
                  </div>
                  {nicknameAvailable === true && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      사용 가능한 닉네임입니다
                    </p>
                  )}
                  {nicknameAvailable === false && (
                    <p className="text-xs text-red-600 mt-1">
                      이미 사용 중인 닉네임입니다
                    </p>
                  )}
                </div>

                {/* Target Certification */}
                <div>
                  <Label htmlFor="cert" className="mb-3 block">목표 자격증</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.certId}
                        type="button"
                        onClick={() => {
                          if (isEditingProfile) {
                            // 편집 모드일 때만 선택 가능 (눈 속임용 - 실제로는 저장되지 않음)
                            setSelectedCertId(category.certId);
                            setProfile({ ...profile, targetCertification: category.name });
                          }
                        }}
                        disabled={!isEditingProfile}
                        className={`p-5 rounded-xl border-2 transition-all transform ${
                          isEditingProfile ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-60'
                        } ${
                          selectedCertId === category.certId
                            ? `border-purple-500 bg-gradient-to-br ${category.color} shadow-lg`
                            : 'border-gray-200 bg-white hover:border-purple-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`text-4xl transition-transform ${
                              selectedCertId === category.certId ? 'scale-110' : ''
                            }`}
                          >
                            {category.icon}
                          </div>
                          <div
                            className={`transition-colors ${
                              selectedCertId === category.certId
                                ? 'text-white'
                                : 'text-gray-900'
                            }`}
                          >
                            {category.name}
                          </div>
                          {selectedCertId === category.certId && (
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stats (Read-only) */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">레벨</p>
                    <p className="text-purple-600">Level {profile.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">경험치</p>
                    <p className="text-purple-600">{profile.xp} XP</p>
                  </div>
                </div>

                {!isEditingProfile ? (
                  <Button
                    onClick={handleEditProfile}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    프로필 수정하기
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      프로필 저장
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      취소
                    </Button>
                  </div>
                )}
              </div>
            </Card>
            <Button
              onClick={handleLogout}
              className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white"
            >
              로그아웃
            </Button>

          </TabsContent>

          {/* Study Settings Tab */}
          <TabsContent value="study">
            <div className="space-y-6">
              {/* Timer Settings */}
              <Card className="p-6 border-2 border-purple-200">
                <h3 className="text-purple-900 mb-4">타이머 설정</h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>타이머 사용</Label>
                      <p className="text-sm text-gray-600">문제 풀이 시간 제한</p>
                    </div>
                    <Switch
                      checked={settings.timerEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, timerEnabled: checked })
                      }
                    />
                  </div>

                  {settings.timerEnabled && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>문제당 시간 (초)</Label>
                        <span className="text-purple-600">{settings.timerDuration}초</span>
                      </div>
                      <Slider
                        value={[settings.timerDuration]}
                        onValueChange={(value) =>
                          setSettings({ ...settings, timerDuration: value[0] })
                        }
                        min={30}
                        max={180}
                        step={10}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Study Aids */}
              <Card className="p-6 border-2 border-purple-200">
                <h3 className="text-purple-900 mb-4">학습 보조</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>힌트 사용</Label>
                      <p className="text-sm text-gray-600">문제 풀이 시 힌트 표시</p>
                    </div>
                    <Switch
                      checked={settings.hintsEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, hintsEnabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>효과음</Label>
                      <p className="text-sm text-gray-600">정답/오답 효과음</p>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, soundEnabled: checked })
                      }
                    />
                  </div>
                </div>
              </Card>

              {/* Notifications */}
              <Card className="p-6 border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <h3 className="text-purple-900">알림 설정</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>일일 학습 알림</Label>
                      <p className="text-sm text-gray-600">매일 학습 시간 알림</p>
                    </div>
                    <Switch
                      checked={settings.notifications.dailyReminder}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, dailyReminder: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>주간 리포트</Label>
                      <p className="text-sm text-gray-600">주간 학습 리포트 발송</p>
                    </div>
                    <Switch
                      checked={settings.notifications.weeklyReport}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, weeklyReport: checked }
                        })
                      }
                    />
                  </div>
                </div>
              </Card>

              <Button
                onClick={handleSaveSettings}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                설정 저장
              </Button>
            </div>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data">
            <div className="space-y-6">
              <Card className="p-6 border-2 border-blue-200">
                <h3 className="text-blue-900 mb-4">데이터 내보내기</h3>
                <p className="text-gray-600 mb-4">
                  학습 기록, 통계, 설정 등 모든 데이터를 JSON 파일로 내보냅니다.
                </p>
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="w-full border-2 border-blue-500 text-blue-700 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  데이터 내보내기
                </Button>
              </Card>

              <Card className="p-6 border-2 border-red-200">
                <h3 className="text-red-900 mb-4">데이터 초기화</h3>
                <p className="text-gray-600 mb-4">
                  ⚠️ 모든 학습 기록과 통계가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
                <Button
                  onClick={handleResetData}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  모든 데이터 초기화
                </Button>
              </Card>

              <Card className="p-6 border-2 border-red-300">
                <h3 className="text-red-900 mb-4">계정 탈퇴</h3>
                <p className="text-gray-600 mb-4">
                  ⚠️ 계정을 탈퇴하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
                <Button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  계정 탈퇴하기
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 탈퇴 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">계정 탈퇴 확인</DialogTitle>
            <DialogDescription>
              계정을 탈퇴하려면 비밀번호를 입력해주세요. 탈퇴 후에는 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="delete-password">비밀번호</Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && deletePassword.trim() && !isDeleting) {
                    handleDeleteAccount();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletePassword("");
              }}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!deletePassword.trim() || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  탈퇴 중...
                </>
              ) : (
                "탈퇴하기"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
