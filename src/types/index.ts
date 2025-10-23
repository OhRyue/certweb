// Core data types
export interface Topic {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  tags: string[];
}

export interface Question {
  id: string;
  topicId: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  type: "multiple" | "ox";
  question: string;
  options: string[];
  correctAnswer: number;
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
