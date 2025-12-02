import { useState } from "react";
import axios from "../api/axiosConfig"
import { useNavigate } from "react-router-dom"
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Settings, User, Bell, Database, Save, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

  const handleSaveProfile = () => {
    onUpdateProfile(profile);
    toast.success("프로필이 저장되었습니다!");
  };

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
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  {profile.avatar && (profile.avatar.startsWith('/') || profile.avatar.includes('.png') || profile.avatar.includes('.jpg')) ? (
                    <img 
                      src={profile.avatar} 
                      alt={profile.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl">{profile.avatar || "🙂"}</div>
                  )}
                  <div className="flex-1">
                    <Label>프로필 이미지</Label>
                    <Input
                      value={profile.avatar}
                      onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                      className="mt-2"
                      placeholder="이미지 경로 또는 이모지를 입력하세요"
                      disabled
                    />
                    <p className="text-sm text-gray-500 mt-1">프로필 이미지는 상점에서 변경할 수 있습니다.</p>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="name">닉네임</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="mt-2"
                  />
                </div>

                {/* Target Certification */}
                <div>
                  <Label htmlFor="cert">목표 자격증</Label>
                  <Input
                    id="cert"
                    value={profile.targetCertification}
                    onChange={(e) => setProfile({ ...profile, targetCertification: e.target.value })}
                    className="mt-2"
                  />
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

                <Button
                  onClick={handleSaveProfile}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  프로필 저장
                </Button>
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
