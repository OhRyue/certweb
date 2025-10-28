// Core data types
export interface Topic {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  tags: string[];
}

// New Subject Structure for Main Learning
export interface Detail {
  id: number;
  name: string;
  conceptId?: string; // Link to Concept for content
  questionIds?: string[]; // Link to Questions
  examType?: "written" | "practical"; // 필기 or 실기
  completed?: boolean; // 학습 완료 여부
}

export interface SubTopic {
  id: number;
  name: string;
  details: Detail[];
}

export interface MainTopic {
  id: number;
  name: string;
  subTopics: SubTopic[];
  icon?: string;
  color?: string;
  reviewCompleted?: boolean;
  // Review는 MainTopic 단위로!
}

export interface Subject {
  id: number;
  name: string;
  category: string; // "정보처리기사", "토익", etc.
  examType: "written" | "practical"; // 필기 or 실기
  mainTopics: MainTopic[];
  icon: string;
  color: string;
}

export interface Question {
  id: string;
  topicId: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  type: "multiple" | "ox" | "typing"; // typing for 실기
  examType?: "written" | "practical"; // 필기 or 실기
  question: string;
  options: string[]; // for multiple/ox
  correctAnswer: number | string; // number for multiple/ox, string for typing
  explanation: string;
}

export interface Concept {
  id: string;
  topicId: string;
  title: string;
  content: string;
  keyPoints: string[];
}

export interface StudyResult {
  id: string;
  type: "micro" | "review" | "category" | "difficulty" | "weakness";
  topicId: string;
  date: Date;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  answers: QuestionAnswer[];
  aiSummary?: string;
}

export interface QuestionAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface UserStats {
  totalStudyTime: number;
  totalQuestions: number;
  correctAnswers: number;
  tagStats: Record<string, TagStat>;
  recentResults: StudyResult[];
}

export interface TagStat {
  tag: string;
  totalQuestions: number;
  correctAnswers: number;
  proficiency: number; // 0-100
  weaknessLevel: number; // 0-100 (higher = weaker)
}

export interface UserSettings {
  timerEnabled: boolean;
  timerDuration: number;
  hintsEnabled: boolean;
  soundEnabled: boolean;
  notifications: {
    dailyReminder: boolean;
    weeklyReport: boolean;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  targetCertification: string;
  studyStreak: number;
  level: number;
  xp: number;
}

export interface ExamSchedule {
  id: string;
  name: string;
  date: Date;
  category: string;
  icon: string;
}

export interface ShopItem {
  id: string;
  name: string;
  category: "hat" | "clothes" | "accessory" | "background" | "special";
  price: number;
  imageUrl?: string; // User will add images later
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  isPurchased: boolean;
}
