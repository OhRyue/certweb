# LevelUpScreen 사용 가이드

## 개요

레벨업 화면 컴포넌트는 학습 완료 또는 퀴즈 완료 후 획득한 경험치를 시각화하고, 레벨업 및 티어업 애니메이션을 제공합니다.

## 티어 시스템

| 티어 | 레벨 범위 | 색상 | 이모지 |
|------|----------|------|--------|
| 브론즈 | 1-10 | 황갈색 | 🥉 |
| 실버 | 11-20 | 회색 | 🥈 |
| 골드 | 21-30 | 황금색 | 🥇 |
| 플래티넘 | 31-40 | 청록색 | 💎 |
| 다이아몬드 | 41-50 | 청색 | 💠 |
| 마스터 | 51-60 | 보라-핑크 | 👑 |

## Props

```typescript
interface LevelUpScreenProps {
  currentLevel: number;      // 현재 레벨
  currentExp: number;        // 현재 경험치 (레벨 내 경험치)
  earnedExp: number;         // 획득한 경험치
  expPerLevel: number;       // 레벨당 필요한 경험치
  onComplete: () => void;    // 완료 버튼 클릭 시 호출
}
```

## 사용 방법

### 1. App.tsx에서 상태 추가

```typescript
// App.tsx
import { LevelUpScreen } from "./components/LevelUpScreen";

// 상태 추가
const [showLevelUp, setShowLevelUp] = useState(false);
const [earnedExp, setEarnedExp] = useState(0);

// 경험치 획득 함수
const handleEarnExp = (exp: number) => {
  setEarnedExp(exp);
  setShowLevelUp(true);
};

// 레벨업 완료 핸들러
const handleLevelUpComplete = () => {
  // 새로운 레벨과 경험치 계산
  const totalExp = userProfile.xp + earnedExp;
  const newLevel = userProfile.level + Math.floor(totalExp / 500);
  const newExp = totalExp % 500;

  // 유저 프로필 업데이트
  setUserProfile({
    ...userProfile,
    level: newLevel,
    xp: newExp,
  });

  setShowLevelUp(false);
  setEarnedExp(0);
};
```

### 2. 렌더링

```typescript
// App.tsx - renderContent 함수 맨 마지막에 추가
return (
  <>
    {/* 기존 컨텐츠 */}
    {renderContent()}

    {/* 레벨업 화면 */}
    {showLevelUp && (
      <LevelUpScreen
        currentLevel={userProfile.level}
        currentExp={userProfile.xp}
        earnedExp={earnedExp}
        expPerLevel={500}
        onComplete={handleLevelUpComplete}
      />
    )}
  </>
);
```

### 3. MicroResult에서 호출 예시

```typescript
// MicroResult.tsx 수정
interface MicroResultProps {
  // 기존 props
  onBackToDashboard: () => void;
  onRetry: () => void;
  onEarnExp?: (exp: number) => void;  // 추가
}

export function MicroResult({ 
  topicName, 
  miniCheckScore, 
  problemScore, 
  totalProblems,
  onBackToDashboard,
  onRetry,
  onEarnExp  // 추가
}: MicroResultProps) {
  const totalScore = miniCheckScore + problemScore;
  const percentage = Math.round((totalScore / totalProblems) * 100);

  // 경험치 계산
  useEffect(() => {
    const baseExp = 50;
    const bonusExp = Math.floor((totalScore / totalProblems) * 100);
    const earnedExp = baseExp + bonusExp;
    
    // 경험치 획득 알림
    if (onEarnExp) {
      setTimeout(() => {
        onEarnExp(earnedExp);
      }, 2000); // 결과 화면 표시 후 2초 뒤
    }
  }, []);

  // ... 나머지 코드
}
```

### 4. App.tsx에서 MicroResult 호출 시 prop 전달

```typescript
case "microResult":
  return selectedTopic ? (
    <MicroResult
      topicName={selectedDetailName || selectedTopic.name}
      miniCheckScore={miniCheckScore}
      problemScore={problemSolvingScore}
      totalProblems={9}
      onBackToDashboard={handleBackToMainDashboard}
      onRetry={handleRetryMicro}
      onEarnExp={handleEarnExp}  // 추가
    />
  ) : null;
```

## 경험치 계산 예시

```typescript
// 점수 기반 경험치 계산
function calculateExpFromScore(score: number, totalQuestions: number): number {
  const baseExp = 50; // 기본 경험치
  const scorePercentage = (score / totalQuestions) * 100;
  const bonusExp = Math.floor(scorePercentage); // 정답률 = 보너스 경험치
  
  return baseExp + bonusExp;
}

// 예시:
// 9문제 중 7문제 정답 → 77% → 50 + 77 = 127 XP
// 9문제 중 9문제 정답 → 100% → 50 + 100 = 150 XP
```

## 애니메이션 타임라인

1. **0-2초**: 경험치 바 증가 애니메이션
2. **레벨업 발생 시**: 1.5초간 "LEVEL UP!" 팝업 표시
3. **티어업 발생 시**: 3초간 "TIER UP!" 화려한 팝업 표시
4. **애니메이션 완료 후**: "확인" 버튼 표시

## 주의사항

1. **currentExp는 레벨 내 경험치만 포함**: 
   - 예: Lv.5에서 1250 XP를 가진 경우, currentExp = 1250 % 500 = 250
   
2. **경험치 계산은 호출하는 쪽에서 처리**:
   - LevelUpScreen은 단순히 시각화만 담당
   
3. **유저 프로필 업데이트는 onComplete에서 처리**:
   - 애니메이션 완료 후 실제 데이터 업데이트

## 테스트

`LevelUpScreenDemo` 컴포넌트를 사용하여 다양한 시나리오를 테스트할 수 있습니다:

```typescript
// App.tsx에 임시로 추가하여 테스트
import { LevelUpScreenDemo } from "./components/LevelUpScreenDemo";

// renderContent에서
if (currentView === "test") {
  return <LevelUpScreenDemo />;
}
```

테스트 시나리오:
- 50 XP: 경험치만 증가
- 200 XP: 레벨업 (9 → 10)
- 700 XP: 레벨업 + 티어업 (9 → 10, 브론즈 → 실버)

## 커스터마이징

티어 시스템 수정이 필요한 경우 `LevelUpScreen.tsx`의 `TIERS` 배열을 수정하세요:

```typescript
const TIERS = [
  { 
    name: "브론즈", 
    minLevel: 1, 
    maxLevel: 10, 
    color: "from-amber-700 to-amber-500", 
    emoji: "🥉", 
    bgColor: "from-amber-50 to-orange-50" 
  },
  // ... 추가 티어
];
```
