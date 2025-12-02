import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import type { StoreCatalogResponse, InventoryItem } from "../../types";
import axios from "../api/axiosConfig";
import { 
  ShoppingBag, 
  Sparkles, 
  Lock,
  CheckCircle2,
  Coins,
  Loader2,
  Package
} from "lucide-react";
import { toast } from "sonner";

// 프로필 이미지 import
import girlBasicProfile from "../assets/profile/girl_basic_profile.png"
import boyNerdProfile from "../assets/profile/boy_nerd_profile.png"
import girlUniformProfile from "../assets/profile/girl_uniform_profile.jpg"
import girlPajamaProfile from "../assets/profile/girl_pajama_profile.png"
import girlMarriedProfile from "../assets/profile/girl_married_profile.png"
import girlNerdProfile from "../assets/profile/girl_nerd_profile.png"
import girlIdolProfile from "../assets/profile/girl_idol_profile.png"
import girlGhostProfile from "../assets/profile/girl_ghost_profile.png"
import girlCyberpunkProfile from "../assets/profile/girl_cyberpunk_profile.png"
import girlChinaProfile from "../assets/profile/girl_china_profile.jpg"
import girlCatProfile from "../assets/profile/girl_cat_profile.png"
import boyWorkerProfile from "../assets/profile/boy_worker_profile.png"
import boyPoliceofficerProfile from "../assets/profile/boy_policeofficer_profile.png"
import boyHiphopProfile from "../assets/profile/boy_hiphop_profile.png"
import boyDogProfile from "../assets/profile/boy_dog_profile.png"
import boyBasicProfile from "../assets/profile/boy_basic_profile.png"
import boyAgentProfile from "../assets/profile/boy_agent_profile.png"

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
function getProfileImage(skinId?: number): string {
  if (!skinId) return PROFILE_IMAGE_MAP[1]; // 기본값: girl_basic_profile
  return PROFILE_IMAGE_MAP[skinId] || PROFILE_IMAGE_MAP[1]
}

interface ShopDashboardProps {
  onPurchase?: (itemId: number, price: number) => void;
}

export function ShopDashboard({ onPurchase }: ShopDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [catalogData, setCatalogData] = useState<StoreCatalogResponse | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shop" | "inventory">("shop");
  const [currentSkinId, setCurrentSkinId] = useState<number | null>(null);

  // API에서 상점 데이터 가져오기
  useEffect(() => {
    async function fetchCatalog() {
      try {
        setLoading(true);
        const res = await axios.get("/progress/store/catalog");
        setCatalogData(res.data);
      } catch (err) {
        console.error("상점 데이터 불러오기 실패", err);
        toast.error("상점 데이터를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchCatalog();
  }, []);

  // API에서 보유 스킨 인벤토리 가져오기
  useEffect(() => {
    async function fetchInventory() {
      try {
        setInventoryLoading(true);
        const res = await axios.get("/progress/store/inventory");
        setInventory(res.data || []);
      } catch (err) {
        console.error("인벤토리 데이터 불러오기 실패", err);
        toast.error("인벤토리 데이터를 불러올 수 없습니다.");
      } finally {
        setInventoryLoading(false);
      }
    }

    fetchInventory();
  }, []);

  // 현재 장착된 스킨 가져오기
  const fetchCurrentSkin = async () => {
    try {
      const res = await axios.get("/account/profile");
      if (res.data?.skinId !== undefined) {
        setCurrentSkinId(res.data.skinId);
      }
    } catch (err) {
      console.error("현재 스킨 정보 불러오기 실패", err);
    }
  };

  useEffect(() => {
    fetchCurrentSkin();
  }, []);

  // API 응답을 ShopItem 형식으로 변환 (카테고리는 기본값 사용)
  type ExtendedShopItem = {
    id: string;
    name: string;
    category: "hat" | "clothes" | "accessory" | "background" | "special";
    price: number;
    description: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    isPurchased: boolean;
    itemId: number;
    limitPerUser: number;
    active: boolean;
    skinId?: number;
  };

  // 보유한 itemId Set 생성 (인벤토리에서)
  const ownedItemIds = new Set(inventory.map(item => item.itemId));

  const shopItems: ExtendedShopItem[] = catalogData?.items.map(item => {
    // itemId == skinId 이므로 itemId를 skinId로 사용
    const skinId = item.itemId;
    // 인벤토리에 있으면 구매 불가능
    const isOwned = item.owned || ownedItemIds.has(item.itemId);
    
    return {
      id: item.itemId.toString(),
      name: item.name,
      category: "special" as const, // API에 category가 없으므로 기본값
      price: item.price,
      description: item.description,
      rarity: "common" as const, // API에 rarity가 없으므로 기본값
      isPurchased: isOwned,
      itemId: item.itemId, // 원본 itemId 보존
      limitPerUser: item.limitPerUser,
      active: item.active,
      skinId: skinId, // itemId를 skinId로 사용
    };
  }) || [];

  const userPoints = catalogData?.user.pointBalance || 0;

  const handlePurchase = async (item: ExtendedShopItem) => {
    if (item.isPurchased) {
      toast.error("이미 구매한 아이템입니다!");
      return;
    }

    if (userPoints < item.price) {
      toast.error("포인트가 부족합니다!");
      return;
    }

    try {
      // 구매 API 호출
      await axios.post("/progress/store/purchase", null, {
        params: {
          itemId: item.itemId
        }
      });

      // 인벤토리 새로고침
      const inventoryRes = await axios.get("/progress/store/inventory");
      setInventory(inventoryRes.data || []);

      // API 호출 성공 후 로컬 상태 업데이트
      if (catalogData) {
        setCatalogData({
          ...catalogData,
          user: {
            ...catalogData.user,
            pointBalance: catalogData.user.pointBalance - item.price,
            ownedItemCount: catalogData.user.ownedItemCount + 1,
          },
          items: catalogData.items.map(i => 
            i.itemId === item.itemId ? { ...i, owned: true } : i
          ),
        });
      }

      // 콜백 호출 (있으면)
      if (onPurchase) {
        onPurchase(item.itemId, item.price);
      }

      toast.success(`${item.name}을(를) 구매했습니다! 🎉`);
    } catch (err) {
      console.error("아이템 구매 실패:", err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "구매 중 오류가 발생했습니다.";
      toast.error(errorMessage);
    }
  };

  const handleEquipSkin = async (skinId: number) => {
    try {
      await axios.put("/account/profile/skin", {
        skinId: skinId
      });

      // 서버에서 최신 상태 가져오기
      await fetchCurrentSkin();
      
      // 스킨 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('skinChanged', { detail: { skinId } }));
      
      toast.success("스킨이 장착되었습니다! 🎉");
    } catch (err) {
      console.error("스킨 장착 실패:", err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "스킨 장착 중 오류가 발생했습니다.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">✨ 캐릭터 상점</h1>
                <p className="text-gray-600">포인트로 다양한 캐릭터를 구매하세요!</p>
              </div>
            </div>
            
            {/* User Points Display */}
            <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">보유 포인트</p>
                  <p className="text-yellow-700">{userPoints.toLocaleString()} P</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "shop" | "inventory")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur border-2 border-gray-200 mb-6">
            <TabsTrigger 
              value="shop" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              상점
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Package className="w-4 h-4 mr-2" />
              내 스킨
            </TabsTrigger>
          </TabsList>

          {/* 상점 탭 */}
          <TabsContent value="shop">
            {/* Loading State */}
            {loading ? (
              <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
                <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-gray-700 mb-2">상점 데이터를 불러오는 중...</h3>
              </Card>
            ) : (
              <>
                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {shopItems.filter(item => item.active).map((item) => {
            const canAfford = userPoints >= item.price;

            return (
              <Card 
                key={item.id} 
                className={`p-5 transition-all hover:shadow-lg border-2 border-gray-300 ${
                  item.isPurchased ? "opacity-75" : ""
                }`}
              >
                {/* Item Image */}
                <div className="relative mb-4">
                  <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={getProfileImage(item.skinId)}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.error(`이미지 로드 실패: ${item.name}, skinId: ${item.skinId}`);
                        // 이미지 로드 실패 시 텍스트 표시
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-text')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'fallback-text text-6xl';
                          fallback.textContent = item.name.split(" ")[0];
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>

                  {/* Purchased Badge */}
                  {item.isPurchased && (
                    <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Badge className="bg-green-500 text-white border-0">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        소지 중
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Item Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>

                  {/* Price and Purchase Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-600" />
                      <span className="text-yellow-700">{item.price.toLocaleString()} P</span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handlePurchase(item)}
                      disabled={item.isPurchased || !canAfford || !item.active}
                      className={
                        item.isPurchased
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : canAfford && item.active
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }
                    >
                      {item.isPurchased ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          소유중
                        </>
                      ) : canAfford && item.active ? (
                        <>
                          <ShoppingBag className="w-3 h-3 mr-1" />
                          구매
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          부족
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
              );
            })}
            </div>

                {/* Empty State */}
                {shopItems.filter(item => item.active).length === 0 && (
                  <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-gray-700 mb-2">아이템이 없습니다</h3>
                    <p className="text-gray-500">현재 판매 중인 아이템이 없습니다</p>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* 내 스킨 탭 */}
          <TabsContent value="inventory">
            {inventoryLoading ? (
              <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
                <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-gray-700 mb-2">인벤토리를 불러오는 중...</h3>
              </Card>
            ) : (
              <>
                {inventory.length === 0 ? (
                  <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-gray-700 mb-2">보유한 스킨이 없습니다</h3>
                    <p className="text-gray-500">상점에서 스킨을 구매해보세요!</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {inventory.map((inventoryItem) => {
                      // catalogData에서 해당 아이템 정보 찾기
                      const catalogItem = catalogData?.items.find(item => item.itemId === inventoryItem.itemId);
                      const skinId = inventoryItem.itemId; // itemId == skinId
                      const itemName = catalogItem?.name || `스킨 #${inventoryItem.itemId}`;
                      const itemDescription = catalogItem?.description || "";

                      const isEquipped = currentSkinId === skinId;

                      return (
                        <Card 
                          key={inventoryItem.id} 
                          onClick={() => handleEquipSkin(skinId)}
                          className={`p-5 transition-all hover:shadow-lg border-2 cursor-pointer ${
                            isEquipped 
                              ? "border-blue-500 bg-blue-50" 
                              : "border-green-300 hover:border-green-400"
                          }`}
                        >
                          {/* Item Image */}
                          <div className="relative mb-4">
                            <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              <img
                                src={getProfileImage(skinId)}
                                alt={itemName}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  console.error(`이미지 로드 실패: ${itemName}, skinId: ${skinId}`);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.fallback-text')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'fallback-text text-6xl';
                                    fallback.textContent = itemName.split(" ")[0];
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            </div>

                            {/* Equipped Badge */}
                            {isEquipped && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-blue-500 text-white border-0">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  장착중
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Item Info */}
                          <div className="space-y-2">
                            <div>
                              <h3 className="text-gray-900 mb-1">{itemName}</h3>
                              {itemDescription && (
                                <p className="text-sm text-gray-600">{itemDescription}</p>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              구매일: {new Date(inventoryItem.ownedAt).toLocaleDateString('ko-KR')}
                            </div>
                            {!isEquipped && (
                              <Button
                                size="sm"
                                className="w-full mt-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                              >
                                장착하기
                              </Button>
                            )}
                            {isEquipped && (
                              <Button
                                size="sm"
                                disabled
                                className="w-full mt-2 bg-blue-300 text-white cursor-not-allowed"
                              >
                                장착 중
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-blue-900 mb-2">💡 포인트 획득 방법</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/60">Micro 학습</Badge>
                  <span>100P</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/60">Review 완료</Badge>
                  <span>200P</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/60">대전 승리</Badge>
                  <span>150P</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
