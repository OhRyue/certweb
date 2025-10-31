import { Topic, Question, Concept, UserProfile, UserSettings, UserStats, ExamSchedule, ShopItem } from "../types";

export const topics: Topic[] = [
  {
    id: "db-basic",
    name: "데이터베이스 기초",
    category: "정보처리기사",
    icon: "🗄️",
    color: "#3B82F6",
    tags: ["데이터베이스", "SQL", "정규화"],
  },
  {
    id: "network",
    name: "네트워크",
    category: "정보처리기사",
    icon: "🌐",
    color: "#60A5FA",
    tags: ["네트워크", "OSI", "TCP/IP"],
  },
  {
    id: "oop",
    name: "객체지향",
    category: "정보처리기사",
    icon: "💻",
    color: "#38BDF8",
    tags: ["OOP", "디자인패턴", "Java"],
  },
];

export const concepts: Concept[] = [
  {
    id: "c1",
    topicId: "db-basic",
    title: "데이터베이스 정규화",
    content: "정규화는 데이터베이스의 설계를 재구성하는 과정으로, 데이터의 중복을 최소화하고 무결성을 향상시키는 것을 목표로 합니다.",
    keyPoints: [
      "1차 정규형(1NF): 원자값으로 구성",
      "2차 정규형(2NF): 부분 함수 종속 제거",
      "3차 정규형(3NF): 이행 함수 종속 제거",
      "BCNF: 모든 결정자가 후보키",
    ],
  },
  {
    id: "c2",
    topicId: "network",
    title: "OSI 7계층",
    content: "OSI 7계층은 네트워크 통신을 7단계로 나누어 표준화한 모델입니다. 각 계층은 독립적으로 작동하며 상하 계층과만 통신합니다.",
    keyPoints: [
      "물리 계층: 비트 전송",
      "데이터링크 계층: 프레임 전송, MAC 주소",
      "네트워크 계층: 패킷 전송, IP 주소",
      "전송 계층: 세그먼트 전송, TCP/UDP",
    ],
  },
  {
    id: "c3",
    topicId: "oop",
    title: "객체지향 4대 특징",
    content: "객체지향 프로그래밍의 핵심 개념으로 캡슐화, 상속, 다형성, 추상화가 있습니다.",
    keyPoints: [
      "캡슐화: 데이터와 메서드를 하나로 묶음",
      "상속: 기존 클래스의 특성을 재사용",
      "다형성: 같은 인터페이스로 다른 동작",
      "추상화: 공통 특성을 추출",
    ],
  },
];

export const questions: Question[] = [
  // DB Basic - O/X Questions
  {
    id: "q1",
    topicId: "db-basic",
    tags: ["정규화"],
    difficulty: "easy",
    type: "ox",
    question: "정규화의 목적은 데이터 중복을 최소화하는 것이다.",
    options: ["O", "X"],
    correctAnswer: 0,
    explanation: "정답입니다! 정규화는 데이터 중복을 최소화하고 무결성을 향상시키는 것이 주요 목적입니다.",
  },
  {
    id: "q2",
    topicId: "db-basic",
    tags: ["정규화"],
    difficulty: "easy",
    type: "ox",
    question: "1차 정규형은 모든 속성이 원자값을 가져야 한다.",
    options: ["O", "X"],
    correctAnswer: 0,
    explanation: "맞습니다! 1NF는 모든 속성이 더 이상 분해할 수 없는 원자값으로 구성되어야 합니다.",
  },
  {
    id: "q3",
    topicId: "db-basic",
    tags: ["SQL"],
    difficulty: "easy",
    type: "ox",
    question: "SELECT 문은 데이터를 삭제하는 명령어이다.",
    options: ["O", "X"],
    correctAnswer: 1,
    explanation: "틀렸습니다. SELECT는 데이터를 조회하는 명령어입니다. 삭제는 DELETE를 사용합니다.",
  },
  {
    id: "q4",
    topicId: "db-basic",
    tags: ["데이터베이스"],
    difficulty: "easy",
    type: "ox",
    question: "기본키(Primary Key)는 NULL 값을 가질 수 있다.",
    options: ["O", "X"],
    correctAnswer: 1,
    explanation: "틀렸습니다. 기본키는 NULL 값을 가질 수 없으며, 유일성과 최소성을 만족해야 합니다.",
  },
  // DB Basic - Multiple Choice
  {
    id: "q5",
    topicId: "db-basic",
    tags: ["정규화"],
    difficulty: "medium",
    type: "multiple",
    question: "2차 정규형(2NF)에서 제거해야 하는 것은?",
    options: ["부분 함수 종속", "이행 함수 종속", "완전 함수 종속", "다치 종속"],
    correctAnswer: 0,
    explanation: "2NF는 1NF를 만족하면서 부분 함수 종속을 제거한 형태입니다. 이행 함수 종속은 3NF에서 제거합니다.",
  },
  {
    id: "q6",
    topicId: "db-basic",
    tags: ["SQL"],
    difficulty: "medium",
    type: "multiple",
    question: "다음 중 DDL(Data Definition Language)이 아닌 것은?",
    options: ["CREATE", "ALTER", "SELECT", "DROP"],
    correctAnswer: 2,
    explanation: "SELECT는 DML(Data Manipulation Language)입니다. DDL은 데이터 구조를 정의하는 언어로 CREATE, ALTER, DROP 등이 있습니다.",
  },
  {
    id: "q7",
    topicId: "db-basic",
    tags: ["데이터베이스"],
    difficulty: "hard",
    type: "multiple",
    question: "ACID 속성에 해당하지 않는 것은?",
    options: ["Atomicity", "Consistency", "Isolation", "Distribution"],
    correctAnswer: 3,
    explanation: "ACID는 원자성(Atomicity), 일관성(Consistency), 고립성(Isolation), 지속성(Durability)을 의미합니다.",
  },
  {
    id: "q8",
    topicId: "db-basic",
    tags: ["SQL"],
    difficulty: "medium",
    type: "multiple",
    question: "조인(JOIN)의 종류가 아닌 것은?",
    options: ["INNER JOIN", "OUTER JOIN", "CROSS JOIN", "PARALLEL JOIN"],
    correctAnswer: 3,
    explanation: "PARALLEL JOIN은 존재하지 않습니다. 주요 조인 종류는 INNER, OUTER, CROSS, SELF JOIN 등이 있습니다.",
  },
  {
    id: "q9",
    topicId: "db-basic",
    tags: ["정규화"],
    difficulty: "hard",
    type: "multiple",
    question: "BCNF(Boyce-Codd Normal Form)의 조건은?",
    options: [
      "모든 결정자가 후보키이다",
      "부분 함수 종속이 없다",
      "이행 함수 종속이 없다",
      "다치 종속이 없다",
    ],
    correctAnswer: 0,
    explanation: "BCNF는 3NF를 만족하면서 모든 결정자가 후보키인 정규형입니다.",
  },
  // Network - O/X
  {
    id: "q10",
    topicId: "network",
    tags: ["OSI"],
    difficulty: "easy",
    type: "ox",
    question: "OSI 7계층 모델에서 물리 계층은 비트 단위로 데이터를 전송한다.",
    options: ["O", "X"],
    correctAnswer: 0,
    explanation: "정답입니다! 물리 계층(1계층)은 비트 스트림을 전기 신호로 변환하여 전송합니다.",
  },
  {
    id: "q11",
    topicId: "network",
    tags: ["TCP/IP"],
    difficulty: "easy",
    type: "ox",
    question: "TCP는 비연결형 프로토콜이다.",
    options: ["O", "X"],
    correctAnswer: 1,
    explanation: "틀렸습니다. TCP는 연결형 프로토콜입니다. 비연결형은 UDP입니다.",
  },
  {
    id: "q12",
    topicId: "network",
    tags: ["네트워크"],
    difficulty: "easy",
    type: "ox",
    question: "IP 주소는 네트워크 계층에서 사용된다.",
    options: ["O", "X"],
    correctAnswer: 0,
    explanation: "맞습니다! IP 주소는 OSI 7계층의 네트워크 계층(3계층)에서 사용됩니다.",
  },
  {
    id: "q13",
    topicId: "network",
    tags: ["OSI"],
    difficulty: "medium",
    type: "ox",
    question: "데이터링크 계층의 전송 단위는 패킷이다.",
    options: ["O", "X"],
    correctAnswer: 1,
    explanation: "틀렸습니다. 데이터링크 계층의 전송 단위는 프레임입니다. 패킷은 네트워크 계층의 전송 단위입니다.",
  },
  // Network - Multiple
  {
    id: "q14",
    topicId: "network",
    tags: ["OSI"],
    difficulty: "medium",
    type: "multiple",
    question: "전송 계층의 프로토콜이 아닌 것은?",
    options: ["TCP", "UDP", "ICMP", "SCTP"],
    correctAnswer: 2,
    explanation: "ICMP는 네트워크 계층 프로토콜입니다. TCP, UDP, SCTP는 전송 계층 프로토콜입니다.",
  },
  {
    id: "q15",
    topicId: "network",
    tags: ["TCP/IP"],
    difficulty: "hard",
    type: "multiple",
    question: "TCP의 혼잡 제어 알고리즘이 아닌 것은?",
    options: ["Slow Start", "Fast Retransmit", "Stop and Wait", "Congestion Avoidance"],
    correctAnswer: 2,
    explanation: "Stop and Wait는 흐름 제어 방식입니다. TCP의 혼잡 제어 알고리즘에는 Slow Start, Fast Retransmit, Congestion Avoidance 등이 있습니다.",
  },
  // OOP Questions
  {
    id: "q16",
    topicId: "oop",
    tags: ["OOP"],
    difficulty: "easy",
    type: "ox",
    question: "캡슐화는 데이터와 메서드를 하나로 묶는 것을 의미한다.",
    options: ["O", "X"],
    correctAnswer: 0,
    explanation: "정답입니다! 캡슐화는 관련된 데이터와 메서드를 하나의 단위로 묶고 외부로부터 숨기는 것입니다.",
  },
  {
    id: "q17",
    topicId: "oop",
    tags: ["OOP"],
    difficulty: "medium",
    type: "multiple",
    question: "객체지향의 4대 특징이 아닌 것은?",
    options: ["캡슐화", "상속", "다형성", "순차성"],
    correctAnswer: 3,
    explanation: "순차성은 객체지향의 특징이 아닙니다. 4대 특징은 캡슐화, 상속, 다형성, 추상화입니다.",
  },
  {
    id: "q18",
    topicId: "oop",
    tags: ["디자인패턴"],
    difficulty: "hard",
    type: "multiple",
    question: "싱글톤 패턴의 목적은?",
    options: [
      "클래스의 인스턴스를 하나만 생성",
      "객체 생성을 서브클래스로 위임",
      "인터페이스를 단순화",
      "알고리즘을 캡슐화",
    ],
    correctAnswer: 0,
    explanation: "싱글톤 패턴은 클래스의 인스턴스가 오직 하나만 생성되도록 보장하는 디자인 패턴입니다.",
  },
  {
    id: "q19",
    topicId: "oop",
    tags: ["Java"],
    difficulty: "medium",
    type: "multiple",
    question: "Java에서 다중 상속을 대체하는 방법은?",
    options: ["추상 클래스", "인터페이스", "열거형", "제네릭"],
    correctAnswer: 1,
    explanation: "Java는 클래스의 다중 상속을 지원하지 않지만, 인터페이스를 통해 다중 구현이 가능합니다.",
  },
  {
    id: "q20",
    topicId: "oop",
    tags: ["OOP"],
    difficulty: "medium",
    type: "multiple",
    question: "오버로딩(Overloading)과 오버라이딩(Overriding)의 차이는?",
    options: [
      "오버로딩은 같은 이름의 메서드를 여러 개 정의, 오버라이딩은 상속받은 메서드를 재정의",
      "둘 다 같은 의미이다",
      "오버로딩은 런타임에, 오버라이딩은 컴파일타임에 결정",
      "오버로딩은 상속에서만 가능하다",
    ],
    correctAnswer: 0,
    explanation: "오버로딩은 매개변수가 다른 같은 이름의 메서드를 여러 개 정의하는 것이고, 오버라이딩은 상속받은 메서드를 재정의하는 것입니다.",
  },
];

export const userProfile: UserProfile = {
  id: "user1",
  name: "공부왕",
  avatar: "👨‍💻",
  targetCertification: "정보처리기사",
  studyStreak: 7,
  level: 5,
  xp: 1250,
};

export const userSettings: UserSettings = {
  timerEnabled: true,
  timerDuration: 60,
  hintsEnabled: true,
  soundEnabled: true,
  notifications: {
    dailyReminder: true,
    weeklyReport: true,
  },
};

export const initialUserStats: UserStats = {
  totalStudyTime: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  tagStats: {},
  recentResults: [],
};

export const examSchedules: ExamSchedule[] = [
  {
    id: "exam1",
    name: "정보처리기사 실기",
    date: new Date("2025-06-15"),
    category: "정보처리기사",
    icon: "💻",
  },
  {
    id: "exam2",
    name: "토익 정기시험",
    date: new Date("2025-05-10"),
    category: "토익",
    icon: "🇺🇸",
  },
  {
    id: "exam3",
    name: "재무회계 자격증",
    date: new Date("2025-07-20"),
    category: "재무회계",
    icon: "💰",
  },
  {
    id: "exam4",
    name: "법률 자격증",
    date: new Date("2025-08-05"),
    category: "법률",
    icon: "⚖️",
  },
];

export const shopItems: ShopItem[] = [
  // Hats
  {
    id: "hat1",
    name: "졸업 모자 🎓",
    category: "hat",
    price: 500,
    description: "학식이 넘치는 졸업 모자",
    rarity: "common",
    isPurchased: false,
  },
  {
    id: "hat2",
    name: "왕관 👑",
    category: "hat",
    price: 2000,
    description: "1등의 상징, 황금 왕관",
    rarity: "epic",
    isPurchased: false,
  },
  {
    id: "hat3",
    name: "마법사 모자 🧙",
    category: "hat",
    price: 1500,
    description: "마법처럼 점수가 오르는 모자",
    rarity: "rare",
    isPurchased: false,
  },
  // Clothes
  {
    id: "clothes1",
    name: "정장 👔",
    category: "clothes",
    price: 800,
    description: "면접도 자격증도 완벽!",
    rarity: "common",
    isPurchased: false,
  },
  {
    id: "clothes2",
    name: "슈퍼히어로 망토 🦸",
    category: "clothes",
    price: 2500,
    description: "학습의 히어로!",
    rarity: "legendary",
    isPurchased: false,
  },
  {
    id: "clothes3",
    name: "캐주얼 티셔츠 👕",
    category: "clothes",
    price: 300,
    description: "편안한 학습 스타일",
    rarity: "common",
    isPurchased: false,
  },
  // Accessories
  {
    id: "acc1",
    name: "안경 👓",
    category: "accessory",
    price: 600,
    description: "지식인의 필수품",
    rarity: "common",
    isPurchased: false,
  },
  {
    id: "acc2",
    name: "목걸이 📿",
    category: "accessory",
    price: 1200,
    description: "행운을 부르는 목걸이",
    rarity: "rare",
    isPurchased: false,
  },
  {
    id: "acc3",
    name: "트로피 🏆",
    category: "accessory",
    price: 3000,
    description: "최고의 영광!",
    rarity: "legendary",
    isPurchased: false,
  },
  // Backgrounds
  {
    id: "bg1",
    name: "도서관 배경 📚",
    category: "background",
    price: 1000,
    description: "집중력이 높아지는 도서관",
    rarity: "rare",
    isPurchased: false,
  },
  {
    id: "bg2",
    name: "우주 배경 🌌",
    category: "background",
    price: 1800,
    description: "무한한 가능성의 우주",
    rarity: "epic",
    isPurchased: false,
  },
  {
    id: "bg3",
    name: "해변 배경 🏖️",
    category: "background",
    price: 1500,
    description: "여유로운 학습 분위기",
    rarity: "rare",
    isPurchased: false,
  },
  // Special
  {
    id: "special1",
    name: "경험치 부스터 ⚡",
    category: "special",
    price: 5000,
    description: "7일간 경험치 2배!",
    rarity: "legendary",
    isPurchased: false,
  },
  {
    id: "special2",
    name: "럭키 참 🍀",
    category: "special",
    price: 3500,
    description: "정답률 증가 효과",
    rarity: "epic",
    isPurchased: false,
  },
];

export const mockRankingData = [
  { rank: 1, name: "코딩마스터", avatar: "👑", score: 9850, level: 15 },
  { rank: 2, name: "알고킹", avatar: "🦄", score: 9200, level: 14 },
  { rank: 3, name: "공부왕", avatar: "👨‍💻", score: 8750, level: 5, isCurrentUser: true },
  { rank: 4, name: "DB전문가", avatar: "🗄️", score: 8500, level: 13 },
  { rank: 5, name: "네트워크천재", avatar: "🌐", score: 8200, level: 12 },
];

export const categoryProgress = [
  { category: "정보처리기사", icon: "💻", progress: 65, topics: 12, completed: 8, color: "#3B82F6" },
  { category: "토익", icon: "🇺🇸", progress: 30, topics: 10, completed: 3, color: "#60A5FA" },
  { category: "재무회계", icon: "💰", progress: 45, topics: 8, completed: 4, color: "#38BDF8" },
  { category: "법률", icon: "⚖️", progress: 20, topics: 15, completed: 3, color: "#06B6D4" },
];

// Subject Structure for Main Learning
import { Subject } from "../types";
export const subjects: Subject[] = [
  // 정보처리기사 필기 - 응용 SW 엔지니어링
  {
    id: 1,
    name: "응용 SW 엔지니어링",
    category: "정보처리기사",
    examType: "written",
    icon: "🔧",
    color: "#3B82F6",
    mainTopics: [
      {
        id: 1,
        name: "요구사항 분석",
        icon: "📋",
        reviewCompleted: true,
        color: "#3B82F6",
        subTopics: [
          {
            id: 1,
            name: "요구사항 정의",
            completed: true,
            details: [
              { id: 1, name: "요구사항 명세서 작성", conceptId: "c1" },
              { id: 2, name: "요구사항 변경 관리", conceptId: "c1" },
              { id: 3, name: "요구사항 검토 및 승인", conceptId: "c1" }
            ]
          },
          {
            id: 2,
            name: "분석 모델링",
            completed: false,
            details: [
              { id: 4, name: "데이터 흐름도(DFD)", conceptId: "c1" },
              { id: 5, name: "ER 다이어그램(ERD)", conceptId: "c1" },
              { id: 6, name: "UML 모델링", conceptId: "c1" }
            ]
          }
        ]
      },
      {
        id: 2,
        name: "화면 구현",
        icon: "🎨",
        reviewCompleted: true,
        color: "#60A5FA",
        subTopics: [
          {
            id: 3,
            name: "UI 설계",
            completed: false,
            details: [
              { id: 7, name: "UI 흐름 설계", conceptId: "c2" },
              { id: 8, name: "UI 표준 및 가이드 정의", conceptId: "c2" },
              { id: 9, name: "화면 레이아웃 설계", conceptId: "c2" }
            ]
          },
          {
            id: 4,
            name: "UI 구현",
            completed: false,
            details: [
              { id: 10, name: "HTML/CSS 구현", conceptId: "c2" },
              { id: 11, name: "JavaScript 이벤트 처리", conceptId: "c2" },
              { id: 12, name: "React 기반 SPA 구현", conceptId: "c2" }
            ]
          }
        ]
      }
    ]
  },
  // 정보처리기사 필기 - 데이터베이스
  {
    id: 2,
    name: "데이터베이스",
    category: "정보처리기사",
    examType: "written",
    icon: "🗄️",
    color: "#38BDF8",
    mainTopics: [
      {
        id: 3,
        name: "데이터베이스 설계",
        icon: "🏗️",
        reviewCompleted: false,
        color: "#38BDF8",
        subTopics: [
          {
            id: 5,
            name: "논리적 설계",
            completed: false,
            details: [
              { id: 13, name: "개념적 데이터 모델링", conceptId: "c1" },
              { id: 14, name: "논리적 데이터 모델링", conceptId: "c1" },
              { id: 15, name: "정규화 1NF-3NF", conceptId: "c1" }
            ]
          },
          {
            id: 6,
            name: "물리적 설계",
            completed: false,
            details: [
              { id: 16, name: "테이블 생성 및 제약조건", conceptId: "c1" },
              { id: 17, name: "인덱스 설계", conceptId: "c1" },
              { id: 18, name: "파티셔닝 전략", conceptId: "c1" }
            ]
          }
        ]
      },
      {
        id: 4,
        name: "SQL 활용",
        icon: "💾",
        reviewCompleted: false,
        color: "#7DD3FC",
        subTopics: [
          {
            id: 7,
            name: "기본 SQL",
            completed: false,
            details: [
              { id: 19, name: "DDL 작성", conceptId: "c1" },
              { id: 20, name: "DML 작성", conceptId: "c1" },
              { id: 21, name: "DCL 및 TCL", conceptId: "c1" }
            ]
          },
          {
            id: 8,
            name: "고급 SQL",
            completed: false,
            details: [
              { id: 22, name: "조인 및 서브쿼리", conceptId: "c1" },
              { id: 23, name: "집합 연산 및 그룹화", conceptId: "c1" },
              { id: 24, name: "윈도우 함수", conceptId: "c1" }
            ]
          }
        ]
      }
    ]
  },
  // 정보처리기사 필기 - 네트워크
  {
    id: 3,
    name: "네트워크",
    category: "정보처리기사",
    examType: "written",
    icon: "🌐",
    color: "#06B6D4",
    mainTopics: [
      {
        id: 5,
        name: "OSI 7계층",
        icon: "📡",
        reviewCompleted: false,
        color: "#06B6D4",
        subTopics: [
          {
            id: 9,
            name: "하위 계층",
            completed: false,
            details: [
              { id: 25, name: "물리 계층", conceptId: "c2" },
              { id: 26, name: "데이터링크 계층", conceptId: "c2" },
              { id: 27, name: "네트워크 계층", conceptId: "c2" }
            ]
          },
          {
            id: 10,
            name: "상위 계층",
            completed: false,
            details: [
              { id: 28, name: "전송 계층", conceptId: "c2" },
              { id: 29, name: "세션/표현 계층", conceptId: "c2" },
              { id: 30, name: "응용 계층", conceptId: "c2" }
            ]
          }
        ]
      },
      {
        id: 6,
        name: "프로토콜",
        icon: "🔌",
        reviewCompleted: false,
        color: "#22D3EE",
        subTopics: [
          {
            id: 11,
            name: "전송 프로토콜",
            completed: false,
            details: [
              { id: 31, name: "TCP 프로토콜", conceptId: "c2" },
              { id: 32, name: "UDP 프로토콜", conceptId: "c2" },
              { id: 33, name: "IP 프로토콜", conceptId: "c2" }
            ]
          },
          {
            id: 12,
            name: "응용 프로토콜",
            completed: false,
            details: [
              { id: 34, name: "HTTP/HTTPS", conceptId: "c2" },
              { id: 35, name: "웹 소켓", conceptId: "c2" },
              { id: 36, name: "DNS/FTP", conceptId: "c2" }
            ]
          }
        ]
      }
    ]
  },
  // 토익 필기
  {
    id: 4,
    name: "토익 문법",
    category: "토익",
    examType: "written",
    icon: "🇺🇸",
    color: "#6366F1",
    mainTopics: [
      {
        id: 7,
        name: "동사",
        icon: "📝",
        color: "#6366F1",
        subTopics: [
          {
            id: 13,
            name: "시제",
            completed: false,
            details: [
              { id: 37, name: "현재/과거/미래 시제", conceptId: "c3" },
              { id: 38, name: "완료 시제", conceptId: "c3" },
              { id: 39, name: "진행 시제", conceptId: "c3" }
            ]
          },
          {
            id: 14,
            name: "태",
            completed: false,
            details: [
              { id: 40, name: "능동태와 수동태", conceptId: "c3" },
              { id: 41, name: "시제별 수동태", conceptId: "c3" },
              { id: 42, name: "주의해야 할 수동태", conceptId: "c3" }
            ]
          }
        ]
      },
      {
        id: 8,
        name: "명사와 관사",
        icon: "📚",
        color: "#818CF8",
        subTopics: [
          {
            id: 15,
            name: "명사",
            completed: false,
            details: [
              { id: 43, name: "가산명사와 불가산명사", conceptId: "c3" },
              { id: 44, name: "단수와 복수", conceptId: "c3" },
              { id: 45, name: "소유격", conceptId: "c3" }
            ]
          },
          {
            id: 16,
            name: "관사",
            completed: false,
            details: [
              { id: 46, name: "a/an 용법", conceptId: "c3" },
              { id: 47, name: "the 용법", conceptId: "c3" },
              { id: 48, name: "관사 생략", conceptId: "c3" }
            ]
          }
        ]
      }
    ]
  },
  // 정보처리기사 실기 - 프로그래밍 실습
  {
    id: 101,
    name: "프로그래밍 실습",
    category: "정보처리기사",
    examType: "practical",
    icon: "⌨️",
    color: "#F59E0B",
    mainTopics: [
      {
        id: 101,
        name: "알고리즘 구현",
        icon: "🔢",
        reviewCompleted: true,
        color: "#F59E0B",
        subTopics: [
          {
            id: 101,
            name: "정렬 알고리즘",
            completed: true,
            details: [
              { id: 1001, name: "버블 정렬 구현", conceptId: "c1" },
              { id: 1002, name: "퀵 정렬 구현", conceptId: "c1" },
              { id: 1003, name: "병합 정렬 구현", conceptId: "c1" }
            ]
          },
          {
            id: 102,
            name: "검색 알고리즘",
            completed: true,
            details: [
              { id: 1004, name: "이진 탐색 구현", conceptId: "c1" },
              { id: 1005, name: "DFS 구현", conceptId: "c1" },
              { id: 1006, name: "BFS 구현", conceptId: "c1" }
            ]
          }
        ]
      },
      {
        id: 102,
        name: "데이터 구조 구현",
        icon: "📦",
        reviewCompleted: true,
        color: "#FB923C",
        subTopics: [
          {
            id: 103,
            name: "선형 구조",
            completed: false,
            details: [
              { id: 1007, name: "스택 구현", conceptId: "c1" },
              { id: 1008, name: "큐 구현", conceptId: "c1" },
              { id: 1009, name: "링크드 리스트 구현", conceptId: "c1" }
            ]
          },
          {
            id: 104,
            name: "비선형 구조",
            completed: false,
            details: [
              { id: 1010, name: "이진 트리 구현", conceptId: "c1" },
              { id: 1011, name: "그래프 구현", conceptId: "c1" },
              { id: 1012, name: "해시 테이블 구현", conceptId: "c1" }
            ]
          }
        ]
      }
    ]
  },
  // 정보처리기사 실기 - SQL 작성
  {
    id: 102,
    name: "SQL 작성",
    category: "정보처리기사",
    examType: "practical",
    icon: "💾",
    color: "#EA580C",
    mainTopics: [
      {
        id: 103,
        name: "DDL 실습",
        icon: "🛠️",
        reviewCompleted: false,
        color: "#EA580C",
        subTopics: [
          {
            id: 105,
            name: "테이블 관리",
            completed: false,
            details: [
              { id: 1013, name: "CREATE TABLE 작성", conceptId: "c1" },
              { id: 1014, name: "ALTER TABLE 작성", conceptId: "c1" },
              { id: 1015, name: "DROP TABLE 작성", conceptId: "c1" }
            ]
          },
          {
            id: 106,
            name: "제약조건",
            completed: false,
            details: [
              { id: 1016, name: "PRIMARY KEY 설정", conceptId: "c1" },
              { id: 1017, name: "FOREIGN KEY 설정", conceptId: "c1" },
              { id: 1018, name: "CHECK 제약조건", conceptId: "c1" }
            ]
          }
        ]
      },
      {
        id: 104,
        name: "DML 실습",
        icon: "✏️",
        reviewCompleted: false,
        color: "#F97316",
        subTopics: [
          {
            id: 107,
            name: "데이터 조작",
            completed: false,
            details: [
              { id: 1019, name: "복잡한 SELECT 쿼리", conceptId: "c1" },
              { id: 1020, name: "JOIN 활용", conceptId: "c1" },
              { id: 1021, name: "서브쿼리 작성", conceptId: "c1" }
            ]
          },
          {
            id: 108,
            name: "집계 함수",
            completed: false,
            details: [
              { id: 1022, name: "GROUP BY 활용", conceptId: "c1" },
              { id: 1023, name: "HAVING 조건", conceptId: "c1" },
              { id: 1024, name: "윈도우 함수", conceptId: "c1" }
            ]
          }
        ]
      }
    ]
  },
  // 정보처리기사 실기 - 프로그램 설계
  {
    id: 103,
    name: "프로그램 설계",
    category: "정보처리기사",
    examType: "practical",
    icon: "🎨",
    color: "#C2410C",
    mainTopics: [
      {
        id: 105,
        name: "객체지향 설계",
        icon: "🧩",
        reviewCompleted: false,
        color: "#C2410C",
        subTopics: [
          {
            id: 109,
            name: "클래스 설계",
            completed: false,
            details: [
              { id: 1025, name: "클래스 다이어그램 작성", conceptId: "c3" },
              { id: 1026, name: "상속 구조 설계", conceptId: "c3" },
              { id: 1027, name: "인터페이스 설계", conceptId: "c3" }
            ]
          },
          {
            id: 110,
            name: "디자인 패턴",
            completed: false,
            details: [
              { id: 1028, name: "싱글톤 패턴 구현", conceptId: "c3" },
              { id: 1029, name: "팩토리 패턴 구현", conceptId: "c3" },
              { id: 1030, name: "옵저버 패턴 구현", conceptId: "c3" }
            ]
          }
        ]
      },
      {
        id: 106,
        name: "시스템 설계",
        icon: "🏗️",
        reviewCompleted: false,
        color: "#9A3412",
        subTopics: [
          {
            id: 111,
            name: "아키텍처 설계",
            completed: false,
            details: [
              { id: 1031, name: "MVC 패턴 설계", conceptId: "c3" },
              { id: 1032, name: "계층형 아키텍처", conceptId: "c3" },
              { id: 1033, name: "마이크로서비스 설계", conceptId: "c3" }
            ]
          },
          {
            id: 112,
            name: "API 설계",
            completed: false,
            details: [
              { id: 1034, name: "RESTful API 설계", conceptId: "c3" },
              { id: 1035, name: "요청/응답 설계", conceptId: "c3" },
              { id: 1036, name: "에러 핸들링 설계", conceptId: "c3" },
              { id: 1036, name: "에러 핸들링 설계", conceptId: "c3" }
            ]
          }
        ]
      }
    ]
  }
]

