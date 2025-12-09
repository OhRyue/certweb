// Core data types
export interface Topic {
  id: string
  name: string
  category: string
  icon: string
  color: string
  tags: string[]
}

// New Subject Structure for Main Learning
export interface Detail {
  id: number
  name: string
  conceptId?: string // Link to Concept for content
  questionIds?: string[] // Link to Questions
  examType?: "written" | "practical" // 필기 or 실기
}

export interface SubTopic {
  id: number
  name: string
  completed: boolean // 학습 완료 여부 관리
  details: Detail[]
}

export interface MainTopic {
  id: number
  name: string
  subTopics: SubTopic[]
  icon?: string
  color?: string
  reviewCompleted?: boolean // Review 완료 여부 관리
}

export interface Subject {
  id: number
  name: string
  category: string // "정보처리기사", "토익", etc.
  examType: "written" | "practical" // 필기 or 실기
  mainTopics: MainTopic[]
  icon: string
  color: string
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface QuestionTag {
  code: string;
  labelKo: string;
  labelEn?: string;
  description?: string;
  domain: string;
  orderNo: number;
}

export interface Question {
  id: string
  topicId: string
  tags: string[] | QuestionTag[] // 문자열 배열 또는 태그 객체 배열
  difficulty: "easy" | "medium" | "hard"
  type: "multiple" | "ox" | "typing" // typing for 실기
  examType?: "written" | "practical" // 필기 or 실기
  question: string
  options: QuestionOption[];
  correctAnswer: number | string // number for multiple/ox, string for typing
  explanation: string
  imageUrl?: string // 실기 문제용 이미지 URL
  timeLimitSec?: number // 문제별 시간 제한 (초)
  roomQuestionId?: number // 방 문제 ID (답안 제출용)
  roundNo?: number // 라운드 번호 (답안 제출용)
  phase?: "MAIN" | "REVIVAL" // 단계 (답안 제출용)
}

export interface Concept {
  id: string
  topicId: string
  title: string
  content: string
  keyPoints: string[]
}

export interface StudyResult {
  id: string
  type: "micro" | "review" | "category" | "difficulty" | "weakness"
  topicId: string
  date: Date
  totalQuestions: number
  correctAnswers: number
  score: number
  timeSpent: number
  answers: QuestionAnswer[]
  aiSummary?: string
}

export interface QuestionAnswer {
  questionId: string
  selectedAnswer: number
  isCorrect: boolean
  timeSpent: number
}

export interface UserStats {
  totalStudyTime: number
  totalQuestions: number
  correctAnswers: number
  tagStats: Record<string, TagStat>
  recentResults: StudyResult[]
}

export interface TagStat {
  tag: string
  totalQuestions: number
  correctAnswers: number
  proficiency: number // 0-100
  weaknessLevel: number // 0-100 (higher = weaker)
}

export interface UserSettings {
  timerEnabled: boolean
  timerDuration: number
  hintsEnabled: boolean
  soundEnabled: boolean
  notifications: {
    dailyReminder: boolean
    weeklyReport: boolean
  }
}

export interface UserProfile {
  id: string
  name: string
  avatar: string
  targetCertification: string
  studyStreak: number
  level: number
  xp: number
}

export interface ExamSchedule {
  id: string
  name: string
  date: Date
  category: string
  icon: string
}

export interface ShopItem {
  id: string
  name: string
  category: "hat" | "clothes" | "accessory" | "background" | "special"
  price: number
  imageUrl?: string // User will add images later
  description: string
  rarity: "common" | "rare" | "epic" | "legendary"
  isPurchased: boolean
}

// 상점 API 타입
export interface StoreCatalogItem {
  itemId: number
  name: string
  description: string
  price: number
  owned: boolean
  limitPerUser: number
  active: boolean
  skinId?: number
}

export interface StoreCatalogUser {
  userId: string
  pointBalance: number
  ownedItemCount: number
}

export interface StoreCatalogResponse {
  user: StoreCatalogUser
  items: StoreCatalogItem[]
  generatedAt: string
}

// 보유 스킨 인벤토리 타입
export interface InventoryItem {
  id: number
  userId: string
  itemId: number
  ownedAt: string
}

// Golden Bell Game Types
export interface GoldenBellCharacter {
  id: number;
  name: string;
  status: "normal" | "correct" | "wrong" | "eliminated";
  gridPosition: { row: number; col: number };
  answer?: string; // Character's answer
  showAnswer?: boolean; // Show answer bubble
  nickname?: string | null; // 참가자 닉네임
  skinId?: number; // 스킨 ID
  userId?: string; // 사용자 ID
}

export interface CanvasEffect {
  id: string;
  type: "radial-light" | "particles" | "spotlight";
  timestamp: number;
  position?: { x: number; y: number };
  data?: any;
}

// Activity API Types
export interface RecentActivity {
  activityId: number;
  activityGroup: string;
  mainType: string;
  assistType: string;
  battleType: string;
  mode: string;
  displayText: string;
  startedAt: string;
  finishedAt: string;
}

export interface ActivityDetail {
  activityId: number;
  activityGroup: string;
  mainType: string;
  assistType: string;
  battleType: string;
  mode: string;
  topicName?: string;
  weaknessTagName?: string;
  difficulty?: string;
  accuracyPct?: number;
  finalRank?: number;
  xpGained?: number;
  performedAt: string;
}

export interface ActivityListResponse {
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  content: ActivityDetail[];
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
  };
  last: boolean;
  empty: boolean;
}

export interface ActivityQuestion {
  order: number;
  questionId: number;
  questionType: string;
  stem: string;
  myAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
  timeTakenMs: number;
  score: number;
}

export interface ActivityDetailHeader {
  activityId: number;
  activityGroup: string;
  mainType: string;
  assistType: string | null;
  battleType: string | null;
  mode: string;
  topicName: string | null;
  weaknessTagName: string | null;
  difficulty: string | null;
  performedAt: string;
  questionCount: number;
  correctCount: number;
  accuracyPct: number;
  finalRank: number | null;
  xpGained: number;
}

export interface ActivityDetailResponse {
  header: ActivityDetailHeader;
  questions: ActivityQuestion[];
}