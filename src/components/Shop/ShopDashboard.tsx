import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ShopItem } from "../../types";
import { 
  ShoppingBag, 
  Sparkles, 
  Crown,
  Shirt,
  Glasses,
  Image as ImageIcon,
  Star,
  Lock,
  CheckCircle2,
  Coins
} from "lucide-react";
import { toast } from "sonner";

interface ShopDashboardProps {
  shopItems: ShopItem[];
  userPoints: number;
  onPurchase: (itemId: string, price: number) => void;
}

export function ShopDashboard({ shopItems, userPoints, onPurchase }: ShopDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "전체", icon: ShoppingBag },
    { id: "hat", label: "모자", icon: Crown },
    { id: "clothes", label: "의상", icon: Shirt },
    { id: "accessory", label: "액세서리", icon: Glasses },
    { id: "background", label: "배경", icon: ImageIcon },
    { id: "special", label: "특수 아이템", icon: Sparkles },
  ];

  const rarityColors = {
    common: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
    rare: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
    epic: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
    legendary: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  };

  const rarityLabels = {
    common: "일반",
    rare: "레어",
    epic: "에픽",
    legendary: "전설",
  };

  const filteredItems = selectedCategory === "all" 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory);

  const handlePurchase = (item: ShopItem) => {
    if (item.isPurchased) {
      toast.error("이미 구매한 아이템입니다!");
      return;
    }

    if (userPoints < item.price) {
      toast.error("포인트가 부족합니다!");
      return;
    }

    onPurchase(item.id, item.price);
    toast.success(`${item.name}을(를) 구매했습니다! 🎉`);
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
                <p className="text-gray-600">포인트로 다양한 아이템을 구매하세요!</p>
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

          {/* Category Tabs */}
          <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start bg-white border-2 border-gray-200 p-1">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {category.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const rarity = rarityColors[item.rarity];
            const canAfford = userPoints >= item.price;

            return (
              <Card 
                key={item.id} 
                className={`p-5 transition-all hover:shadow-lg border-2 ${rarity.border} ${
                  item.isPurchased ? "opacity-75" : ""
                }`}
              >
                {/* Item Image Placeholder */}
                <div className="relative mb-4">
                  <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-6xl">{item.name.split(" ")[0]}</div>
                  </div>
                  
                  {/* Rarity Badge */}
                  <Badge 
                    className={`absolute top-2 right-2 ${rarity.bg} ${rarity.text} border-0`}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {rarityLabels[item.rarity]}
                  </Badge>

                  {/* Purchased Badge */}
                  {item.isPurchased && (
                    <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Badge className="bg-green-500 text-white border-0">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        구매완료
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
                      disabled={item.isPurchased || !canAfford}
                      className={
                        item.isPurchased
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : canAfford
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }
                    >
                      {item.isPurchased ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          소유중
                        </>
                      ) : canAfford ? (
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
        {filteredItems.length === 0 && (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-700 mb-2">아이템이 없습니다</h3>
            <p className="text-gray-500">다른 카테고리를 확인해보세요</p>
          </Card>
        )}

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
