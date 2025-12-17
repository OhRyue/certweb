import { useState, useEffect } from "react";
import axios from "../api/axiosConfig"
import { useNavigate } from "react-router-dom"
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Settings, Save, Edit, CheckCircle2, Loader2, AlertTriangle, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { clearAuthTokens } from "../../utils/authStorage";

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
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  const handleSaveProfile = async () => {
    const trimmedNickname = profile.name.trim();
    
    // 닉네임이 비어있는지 확인
    if (!trimmedNickname) {
      toast.error("닉네임을 입력해주세요.");
      return;
    }

    // 닉네임이 변경되었고 중복 확인이 완료되지 않았거나 사용 불가능한 경우
    const nicknameChanged = trimmedNickname !== userProfile.name;
    if (nicknameChanged) {
      if (nicknameAvailable === null) {
        toast.error("닉네임 중복 확인을 먼저 해주세요.");
        return;
      }
      if (nicknameAvailable === false) {
        toast.error("사용할 수 없는 닉네임입니다.");
        return;
      }
    }

    try {
      setIsSavingProfile(true);
      
      // API 호출
      await axios.put("/account/profile", {
        nickname: trimmedNickname,
        skinId: null,
        timezone: null,
        lang: null
      });

      // 성공 시 로컬 상태 업데이트
      const updatedProfile = { ...profile, name: trimmedNickname };
      setProfile(updatedProfile);
      setSelectedCertId(getCurrentCertId());
      onUpdateProfile(updatedProfile);
      setIsEditingProfile(false);
      setNicknameAvailable(null); // 저장 후 중복 확인 상태 초기화
      toast.success("프로필이 저장되었습니다!");
    } catch (err: any) {
      console.error("프로필 저장 오류:", err);
      toast.error(err.response?.data?.message || "프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingProfile(false);
    }
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

  const handleLogout = async () => {
    try {
      await axios.post("/account/logout")
    } catch (e) {
      console.error("로그아웃 API 실패", e)
    }

    clearAuthTokens()

    toast.success("로그아웃 완료")
    onLogout()
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
      clearAuthTokens();
      
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-purple-600" />
              <h1 className="text-purple-900">설정</h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </Button>
          </div>
          <p className="text-gray-600">내 정보를 관리하세요</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
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
                            // 정보처리기사(certId: 1)가 아닌 다른 자격증 선택 시 알림
                            if (category.certId !== 1) {
                              toast.error("아직 제공되지 않는 자격증입니다.");
                              return;
                            }
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
                    <p className="text-sm text-gray-600">총 경험치</p>
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
                      disabled={isSavingProfile}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          프로필 저장
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                      disabled={isSavingProfile}
                    >
                      취소
                    </Button>
                  </div>
                )}
              </div>
          </Card>

          {/* Account Deletion Section */}
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
