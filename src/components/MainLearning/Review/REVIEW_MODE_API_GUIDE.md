# 필기 Review 모드 API 사용 가이드

## 📋 개요

필기 Review 모드는 이제 **LearningSession 기반**으로 동작합니다. Micro 모드(개념 → mini → mcq → 오답 → 결과)와 유사하지만, Review 모드는 **MCQ → 오답 → 결과** 순서로 진행됩니다.

**주요 변경사항:**
- ✅ Review 모드도 LearningSession을 사용합니다
- ✅ 세션 시작부터 각 단계까지 모든 API가 LearningSession 기반입니다
- ✅ 문제는 세션 시작 시점에 사전 할당되어 변경되지 않습니다
- ✅ 단계 전이는 `advance` API를 통해 수행합니다
- ⚠️ **반드시 한 문제씩 채점합니다**: `grade-one` API를 사용하여 각 문제를 풀 때마다 즉시 채점 결과를 받습니다

## 🚀 빠른 시작

**핵심 사항:**
1. **세션 시작**: `POST /api/study/session/start` (mode: "REVIEW")
2. **문제 조회**: `GET /api/study/written/review/{rootTopicId}`
3. **한 문제씩 채점**: `POST /api/study/written/mcq/grade-one` ⭐ **반드시 한 문제씩!**
4. **마지막 문제에서만**: 세션 조회 후 `advance` API 호출
5. **다음 단계**: 오답 노트 또는 요약 화면으로 이동

---

## 🔄 Review 모드 단계 순서

```
MCQ → REVIEW_WRONG → SUMMARY
```

**참고:** Micro 모드는 `CONCEPT → MINI → MCQ → REVIEW_WRONG → SUMMARY` 순서이지만, Review 모드는 CONCEPT와 MINI 단계가 없습니다.

---

## 1️⃣ 세션 시작

### 1-1. Review 모드 세션 시작

Review 모드를 시작하려면 `POST /api/study/session/start`를 호출합니다. 단, `mode`에 `"REVIEW"`를 지정해야 합니다.

**엔드포인트:**
```http
POST /api/study/session/start
Content-Type: application/json
```

**요청:**
```typescript
interface StartRequest {
  topicId: number;      // ⚠️ 주의: rootTopicId입니다 (하위 토픽 포함)
  mode: "REVIEW";       // "REVIEW"로 고정
  resume?: boolean;     // true면 최신 IN_PROGRESS 세션 재개
}
```

**응답:**
```typescript
interface StartResponse {
  sessionId: number;    // ⚠️ 이것이 learningSessionId입니다!
  status: string;       // "IN_PROGRESS"
}
```

**예시:**
```typescript
// Review 모드 세션 시작
const startResponse = await fetch('/api/study/session/start', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    topicId: 100,        // rootTopicId (루트 토픽 ID)
    mode: "REVIEW",
    resume: false        // 처음부터 시작
  })
});

const { sessionId, status } = await startResponse.json();
// sessionId === learningSessionId

// ⚠️ 반드시 저장해야 합니다!
localStorage.setItem('reviewLearningSessionId', sessionId.toString());
```

**중요 사항:**
1. **`topicId`는 rootTopicId입니다**: 하위 토픽들을 포함하는 루트 토픽 ID를 전달해야 합니다.
2. **`mode`는 반드시 `"REVIEW"`**: 다른 값이면 Review 모드로 시작되지 않습니다.
3. **반환된 `sessionId`를 저장**: 이후 모든 API 호출에 필요합니다.

### 1-2. 세션 재개 (이어하기)

진행 중인 Review 세션이 있는 경우 `resume: true`로 재개할 수 있습니다.

```typescript
// 진행 중인 세션 재개
const startResponse = await fetch('/api/study/session/start', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    topicId: 100,
    mode: "REVIEW",
    resume: true         // 이어하기
  })
});
```

**동작:**
- `resume: true`인 경우, 동일한 `topicId`와 `mode: "REVIEW"`로 진행 중(`IN_PROGRESS`)인 세션을 찾아 반환합니다.
- 진행 중인 세션이 없으면 새로 생성합니다.
- `resume: false`인 경우, 진행 중인 세션이 있어도 새로운 세션을 생성합니다 (기존 세션은 `DONE`으로 변경됨).

---

## 2️⃣ 세션 조회

### 2-1. 세션 상세 정보 조회

현재 세션의 상태와 각 단계의 진행 상황을 확인할 수 있습니다.

**엔드포인트:**
```http
GET /api/study/session/{sessionId}
```

**예시:**
```typescript
const sessionResponse = await fetch(`/api/study/session/${learningSessionId}`, {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const session = await sessionResponse.json();
// {
//   sessionId: 123,
//   topicId: 100,
//   mode: "REVIEW",
//   status: "IN_PROGRESS",
//   currentStep: "MCQ",  // 현재 진행 중인 단계
//   steps: [
//     { id: 1, step: "MCQ", state: "IN_PROGRESS", score: null, detailsJson: null },
//     { id: 2, step: "REVIEW_WRONG", state: "READY", score: null, detailsJson: null },
//     { id: 3, step: "SUMMARY", state: "READY", score: null, detailsJson: null }
//   ]
// }
```

**응답 구조:**
```typescript
interface SessionResponse {
  sessionId: number;
  topicId: number;
  mode: "REVIEW";
  status: "IN_PROGRESS" | "DONE";
  currentStep: string | null;  // 현재 진행 중인 단계 코드
  steps: StepItem[];
}

interface StepItem {
  id: number;
  step: "MCQ" | "REVIEW_WRONG" | "SUMMARY";
  state: "READY" | "IN_PROGRESS" | "COMPLETE";
  score: number | null;
  detailsJson: string | null;  // JSON 문자열 (메타데이터)
}
```

**단계 상태 설명:**
- `READY`: 아직 시작하지 않은 단계
- `IN_PROGRESS`: 현재 진행 중인 단계
- `COMPLETE`: 완료된 단계

---

## 3️⃣ MCQ 단계

### 3-1. Review 문제 세트 조회

Review 모드의 MCQ 문제 10개를 조회합니다. 문제는 **세션 시작 시점에 할당**되며, 동일한 세션에서는 항상 같은 문제가 반환됩니다.

**엔드포인트:**
```http
GET /api/study/written/review/{rootTopicId}?sessionId={learningSessionId}
```

**예시:**
```typescript
const reviewSetResponse = await fetch(
  `/api/study/written/review/${rootTopicId}?sessionId=${learningSessionId}`,
  {
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  }
);

const reviewSet = await reviewSetResponse.json();
// {
//   sessionId: 456,  // StudySession ID (내부용, 무시 가능)
//   mode: "REVIEW",
//   step: "REVIEW_MCQ",
//   status: "IN_PROGRESS" | "COMPLETE",
//   nextStep: "REVIEW_WRONG" | null,
//   meta: { ... },
//   payload: {
//     questions: [
//       {
//         id: 1,
//         stem: "문제 내용",
//         choices: [
//           { label: "A", content: "선택지 1" },
//           { label: "B", content: "선택지 2" },
//           ...
//         ],
//         imageUrl: "https://..."
//       },
//       ...
//     ]
//   },
//   learningSessionId: 123  // ⚠️ 이것을 사용해야 합니다!
// }
```

**응답 구조:**
```typescript
interface ReviewSetResponse {
  sessionId: number;           // StudySession ID (내부용)
  mode: "REVIEW";
  step: "REVIEW_MCQ";
  status: "IN_PROGRESS" | "COMPLETE";
  nextStep: "REVIEW_WRONG" | null;
  meta: Record<string, any>;
  payload: {
    questions: ReviewQuestion[];
  };
  learningSessionId: number;   // ⚠️ 이 값을 저장하고 사용하세요!
}

interface ReviewQuestion {
  id: number;
  stem: string;
  choices: Choice[];
  imageUrl: string | null;
}

interface Choice {
  label: string;  // "A", "B", "C", "D"
  content: string;
}
```

**중요 사항:**
1. **문제 개수**: Review 모드는 항상 **10문제**입니다.
2. **문제는 고정**: 세션 시작 시점에 할당되므로, 같은 세션에서는 항상 같은 문제가 반환됩니다.
3. **`learningSessionId` 사용**: 응답의 `learningSessionId`를 이후 API 호출에 사용하세요.

### 3-2. Review 문제 제출 및 채점

**⚠️ 중요: Review 모드는 반드시 한 문제씩 채점합니다.**

문제를 한 개씩 풀 때마다 즉시 채점 결과를 받는 방식입니다. 모든 문제를 풀면 MCQ 단계를 완료하고 다음 단계로 진행합니다.

#### 방법 1: 한 문제씩 즉시 채점 (grade-one) ⭐ 권장

각 문제를 풀 때마다 즉시 채점 결과를 받습니다.

**엔드포인트:**
```http
POST /api/study/written/mcq/grade-one?sessionId={learningSessionId}
Content-Type: application/json
```

**요청:**
```typescript
interface McqGradeOneRequest {
  topicId: number;     // rootTopicId
  questionId: number;  // 문제 ID
  label: string;       // 사용자가 선택한 답 ("A", "B", "C", "D")
}
```

**응답:**
```typescript
interface McqGradeOneResponse {
  correct: boolean;        // 정답 여부
  correctLabel: string;    // 정답 라벨 ("A", "B", "C", "D")
  explanation: string;     // DB 기본 해설
  aiExplanation: string;   // 빈 문자열 (grade-one API는 AI 해설을 제공하지 않음)
}
```

**참고:** `grade-one` API는 AI 해설을 제공하지 않습니다. AI 해설이 필요한 경우 오답 노트(REVIEW_WRONG) 단계에서 확인할 수 있습니다.

**예시:**
```typescript
// 문제를 한 개씩 풀 때마다 호출
const questions = reviewSet.payload.questions; // 10문제
let answeredCount = 0;

for (let i = 0; i < questions.length; i++) {
  const question = questions[i];
  const userAnswer = getUserAnswer(question.id); // 사용자가 선택한 답 (예: "A")
  
  // 한 문제씩 즉시 채점
  const gradeResponse = await fetch(
    `/api/study/written/mcq/grade-one?sessionId=${learningSessionId}`,
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify({
        topicId: rootTopicId,
        questionId: question.id,
        label: userAnswer
      })
    }
  );
  
  const gradeResult = await gradeResponse.json();
  // {
  //   correct: true,
  //   correctLabel: "A",
  //   explanation: "DB 기본 해설...",
  //   aiExplanation: ""  // grade-one API는 AI 해설을 제공하지 않음 (항상 빈 문자열)
  // }
  
  // 채점 결과를 화면에 표시
  displayGradeResult(question.id, gradeResult);
  
  answeredCount++;
  const isLastQuestion = (i === questions.length - 1);
  
  // 마지막 문제(10번째)에서만 세션 조회 및 advance 호출
  if (isLastQuestion) {
    // 세션 상태 조회하여 메타데이터 가져오기
    const sessionResponse = await fetch(
      `/api/study/session/${learningSessionId}`,
      { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
    );
    const session = await sessionResponse.json();
    
    // MCQ 단계의 메타데이터 추출
    const mcqStep = session.steps.find(s => s.step === "MCQ");
    const metadata = JSON.parse(mcqStep.detailsJson || "{}");
    
    // advance 호출하여 MCQ 단계 완료
    const advanceResponse = await fetch('/api/study/session/advance', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify({
        sessionId: learningSessionId,
        step: "MCQ",
        score: metadata.scorePct || 0,
        detailsJson: mcqStep.detailsJson
      })
    });
    
    const advanceResult = await advanceResponse.json();
    // {
    //   sessionId: 123,
    //   status: "IN_PROGRESS",
    //   movedTo: "REVIEW_WRONG" | "SUMMARY"  // 오답이 없으면 SUMMARY로 건너뜀
    // }
    
    // 다음 단계로 이동
    if (advanceResult.movedTo === "REVIEW_WRONG") {
      navigate('/review/wrong-notes');
    } else if (advanceResult.movedTo === "SUMMARY") {
      navigate('/review/summary');
    }
  }
}
```

**중요 사항:**
1. **각 문제마다 `grade-one` API 호출**: 문제를 풀 때마다 즉시 채점 결과를 받습니다.
2. **메타데이터 자동 누적**: 백엔드에서 자동으로 메타데이터를 누적 관리합니다.
3. **로컬에서 문제 개수 관리**: 프론트엔드는 문제 개수(10개)를 알고 있으므로, 로컬에서 카운트를 관리하면 됩니다.
4. **마지막 문제에서만 세션 조회**: 모든 문제를 풀었을 때만 세션을 조회하여 메타데이터를 가져옵니다. 매번 조회할 필요 없습니다.
5. **마지막 문제에서만 advance 호출**: 모든 문제를 풀었을 때만 `advance` API를 호출합니다.

**❌ 비효율적인 방법 (매번 세션 조회):**
```typescript
// ❌ 매번 세션을 조회하는 것은 불필요한 API 호출
for (const question of questions) {
  await gradeOneMcq(learningSessionId, { ... });
  
  // 매번 조회 - 불필요!
  const session = await getSession(learningSessionId);
  // ...
}
```

**✅ 효율적인 방법 (마지막에만 조회):**
```typescript
// ✅ 로컬에서 카운트 관리, 마지막 문제에서만 세션 조회
const questions = [...]; // 10문제
let answeredCount = 0;

for (let i = 0; i < questions.length; i++) {
  await gradeOneMcq(learningSessionId, { ... });
  answeredCount++;
  
  // 마지막 문제에서만 조회
  if (i === questions.length - 1) {
    const session = await getSession(learningSessionId);
    // advance 호출
  }
}
```

#### 방법 2: 여러 문제 한 번에 제출 (submit) - 선택 사항

여러 문제를 한 번에 제출하는 방식도 지원됩니다. 하지만 **권장하지 않습니다**. 한 문제씩 채점하는 방식을 사용하세요.

**엔드포인트:**
```http
POST /api/study/written/review/submit?sessionId={learningSessionId}
Content-Type: application/json
```

**요청:**
```typescript
interface ReviewSubmitRequest {
  topicId: number;     // rootTopicId
  answers: McqAnswer[];
}

interface McqAnswer {
  questionId: number;
  label: string;       // "A", "B", "C", "D"
}
```

**예시:**
```typescript
const submitResponse = await fetch(
  `/api/study/written/review/submit?sessionId=${learningSessionId}`,
  {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      topicId: rootTopicId,
      answers: [
        { questionId: 1, label: "A" },
        { questionId: 2, label: "B" },
        { questionId: 3, label: "C" },
        // ... 10개 모두
      ]
    })
  }
);

const submitResult = await submitResponse.json();
// {
//   sessionId: 456,
//   mode: "REVIEW",
//   step: "REVIEW_MCQ",
//   status: "IN_PROGRESS" | "COMPLETE",
//   nextStep: "REVIEW_WRONG" | null,
//   payload: {
//     total: 10,
//     correct: 7,
//     items: [
//       {
//         questionId: 1,
//         isCorrect: true,
//         correctLabel: "A",
//         dbExplanation: "해설...",
//         aiExplanation: "AI 해설..."  // 오답인 경우만
//       },
//       ...
//     ],
//     wrongQuestionIds: [2, 5, 8]
//   },
//   learningSessionId: 123
// }
```

**응답 구조:**
```typescript
interface ReviewSubmitResponse {
  sessionId: number;
  mode: "REVIEW";
  step: "REVIEW_MCQ";
  status: "IN_PROGRESS" | "COMPLETE";
  nextStep: "REVIEW_WRONG" | null;
  payload: {
    total: number;              // 전체 문제 수 (10)
    correct: number;            // 정답 개수
    items: McqSubmitItem[];
    wrongQuestionIds: number[]; // 오답 문제 ID 목록
  };
  learningSessionId: number;
}

interface McqSubmitItem {
  questionId: number;
  isCorrect: boolean;
  correctLabel: string;
  dbExplanation: string;
  aiExplanation: string;        // 오답인 경우 AI 해설
}
```

**중요 사항:**
1. **모든 문제 제출 필요**: 10문제 모두 제출해야 합니다.
2. **`status` 확인**: `"COMPLETE"`가 되면 모든 문제를 제출한 것입니다.
3. **`nextStep` 확인**: 다음 단계가 `"REVIEW_WRONG"`인지 확인하세요.

**참고:** 여러 문제를 한 번에 제출하는 방식도 가능하지만, UX상 한 문제씩 즉시 채점하는 방식이 더 좋습니다.

### 3-3. MCQ 단계 완료 및 다음 단계로 전환

**한 문제씩 채점 방식을 사용하는 경우:**

모든 문제를 한 문제씩 풀고 채점한 후, 마지막 문제에서 `advance` API를 호출하여 MCQ 단계를 완료하고 다음 단계로 진행합니다.

**엔드포인트:**
```http
POST /api/study/session/advance
Content-Type: application/json
```

**요청:**
```typescript
interface AdvanceRequest {
  sessionId: number;      // learningSessionId
  step: "MCQ";
  score: number;          // 정답률 (0-100)
  detailsJson: string;    // 메타데이터 JSON 문자열
}
```

**한 문제씩 채점 방식 사용 시:**

위의 "방법 1: 한 문제씩 즉시 채점" 예시 코드를 참고하세요. 마지막 문제를 채점한 후 세션을 조회하여 메타데이터를 가져오고, `advance` API를 호출하면 됩니다.

**여러 문제를 한 번에 제출하는 방식을 사용하는 경우 (비권장):**

```typescript
// 1. 문제 제출
const submitResult = await reviewSubmit(learningSessionId, {
  topicId: rootTopicId,
  answers: [...]
});

// 2. 모든 문제를 풀었을 때만 advance 호출
if (submitResult.status === "COMPLETE") {
  const metadata = {
    total: submitResult.payload.total,
    correct: submitResult.payload.correct,
    wrongQuestionIds: submitResult.payload.wrongQuestionIds
  };
  
  const score = (submitResult.payload.correct / submitResult.payload.total) * 100;
  
  const advanceResponse = await fetch('/api/study/session/advance', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      sessionId: learningSessionId,
      step: "MCQ",
      score: score,
      detailsJson: JSON.stringify(metadata)
    })
  });
  
  const advanceResult = await advanceResponse.json();
  // {
  //   sessionId: 123,
  //   status: "IN_PROGRESS",
  //   movedTo: "REVIEW_WRONG" | "SUMMARY"  // 오답이 없으면 SUMMARY로 건너뜀
  // }
  
  // 3. 다음 단계로 이동
  if (advanceResult.movedTo === "REVIEW_WRONG") {
    // 오답 노트 화면으로 이동
    navigate('/review/wrong-notes');
  } else if (advanceResult.movedTo === "SUMMARY") {
    // 요약 화면으로 이동
    navigate('/review/summary');
  }
}
```

**응답 구조:**
```typescript
interface AdvanceResponse {
  sessionId: number;
  status: "IN_PROGRESS" | "DONE";
  movedTo: "REVIEW_WRONG" | "SUMMARY" | "END";
}
```

**중요 사항:**
1. **오답이 없으면 자동으로 SUMMARY로 이동**: 백엔드에서 자동으로 처리하므로, 프론트엔드에서는 `movedTo` 값만 확인하면 됩니다.
2. **모든 문제 완료 검증**: 백엔드에서 모든 문제를 풀었는지 검증합니다. 미완료 시 에러가 발생합니다.
3. **`movedTo` 필드 확인**: 다음 단계로 이동할 때는 `movedTo` 값을 사용하세요.

---

## 4️⃣ REVIEW_WRONG 단계 (오답 노트)

### 4-1. 오답 문제 조회

MCQ 단계에서 틀린 문제들을 조회합니다.

**엔드포인트:**
```http
GET /api/study/wrong-recap/written/learning-session?learningSessionId={learningSessionId}
```

**예시:**
```typescript
const wrongRecapResponse = await fetch(
  `/api/study/wrong-recap/written/learning-session?learningSessionId=${learningSessionId}`,
  {
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  }
);

const wrongRecap = await wrongRecapResponse.json();
// {
//   items: [
//     {
//       questionId: 2,
//       type: "MCQ",
//       stem: "문제 내용",
//       userAnswerJson: '{"answer":"B","correct":false,"score":0}',
//       correctAnswer: "A",
//       solution: "해설...",
//       imageUrl: "https://...",
//       aiExplanation: null,
//       aiExplanationFailed: null
//     },
//     ...
//   ]
// }
```

**응답 구조:**
```typescript
interface WrongRecapResponse {
  items: WrongRecapItem[];
}

interface WrongRecapItem {
  questionId: number;
  type: "MCQ";
  stem: string;
  userAnswerJson: string;      // JSON 문자열
  correctAnswer: string;
  solution: string;
  imageUrl: string | null;
  aiExplanation: string | null;
  aiExplanationFailed: boolean | null;
}
```

**중요 사항:**
1. **오답이 없으면 빈 배열**: `items`가 빈 배열(`[]`)이면 오답이 없는 것입니다 (이 경우 REVIEW_WRONG 단계가 건너뛰어집니다).
2. **순서**: 문제는 틀린 순서대로 정렬되어 반환됩니다.

### 4-2. REVIEW_WRONG 단계 완료

오답 노트를 확인한 후, `advance` API를 호출하여 REVIEW_WRONG 단계를 완료하고 SUMMARY 단계로 이동합니다.

**예시:**
```typescript
const advanceResponse = await fetch('/api/study/session/advance', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    sessionId: learningSessionId,
    step: "REVIEW_WRONG",
    score: null,
    detailsJson: null
  })
});

const advanceResult = await advanceResponse.json();
// {
//   sessionId: 123,
//   status: "IN_PROGRESS",
//   movedTo: "SUMMARY"
// }

// SUMMARY 화면으로 이동
navigate('/review/summary');
```

---

## 5️⃣ SUMMARY 단계 (요약)

### 5-1. Review 요약 조회

Review 모드의 학습 결과를 요약하여 반환합니다.

**엔드포인트:**
```http
GET /api/study/written/review/summary?rootTopicId={rootTopicId}&sessionId={learningSessionId}
```

**예시:**
```typescript
const summaryResponse = await fetch(
  `/api/study/written/review/summary?rootTopicId=${rootTopicId}&sessionId=${learningSessionId}`,
  {
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
  }
);

const summary = await summaryResponse.json();
// {
//   sessionId: 456,
//   mode: "REVIEW",
//   step: "REVIEW_SUMMARY",
//   status: "COMPLETE",
//   nextStep: null,
//   payload: {
//     miniTotal: 0,        // Review 모드에는 MINI 없음
//     miniCorrect: 0,
//     miniPassed: false,
//     mcqTotal: 10,
//     mcqCorrect: 7,
//     summaryText: "AI가 생성한 요약 텍스트...",
//     completed: true
//   },
//   learningSessionId: 123
// }
```

**응답 구조:**
```typescript
interface ReviewSummaryResponse {
  sessionId: number;
  mode: "REVIEW";
  step: "REVIEW_SUMMARY";
  status: "COMPLETE";
  nextStep: null;
  payload: {
    miniTotal: number;      // Review 모드에서는 항상 0
    miniCorrect: number;    // Review 모드에서는 항상 0
    miniPassed: boolean;    // Review 모드에서는 항상 false
    mcqTotal: number;       // MCQ 문제 수 (10)
    mcqCorrect: number;     // MCQ 정답 수
    summaryText: string;    // AI가 생성한 요약 텍스트
    completed: boolean;     // 완료 여부
  };
  learningSessionId: number;
}
```

**중요 사항:**
1. **MINI 관련 필드는 무시**: Review 모드에는 MINI 단계가 없으므로 `miniTotal`, `miniCorrect`, `miniPassed`는 항상 0 또는 false입니다.
2. **`summaryText`**: AI가 생성한 학습 요약 텍스트입니다.

### 5-2. SUMMARY 단계 완료

요약을 확인한 후, `advance` API를 호출하여 Review 세션을 완료합니다.

**예시:**
```typescript
const advanceResponse = await fetch('/api/study/session/advance', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    sessionId: learningSessionId,
    step: "SUMMARY",
    score: null,
    detailsJson: null
  })
});

const advanceResult = await advanceResponse.json();
// {
//   sessionId: 123,
//   status: "DONE",
//   movedTo: "END"
// }

if (advanceResult.movedTo === "END" && advanceResult.status === "DONE") {
  // 세션 완료 → 저장된 ID 삭제
  localStorage.removeItem('reviewLearningSessionId');
  
  // 완료 화면으로 이동
  navigate('/review/complete');
}
```

---

## 📝 전체 플로우 예시

### TypeScript/React 예시

```typescript
// Review 모드 전체 플로우
async function startReviewMode(rootTopicId: number) {
  // 1. 세션 시작
  const startResponse = await fetch('/api/study/session/start', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      topicId: rootTopicId,
      mode: "REVIEW",
      resume: false
    })
  });
  const { sessionId } = await startResponse.json();
  localStorage.setItem('reviewLearningSessionId', sessionId.toString());
  
  // 2. 문제 세트 조회
  const reviewSetResponse = await fetch(
    `/api/study/written/review/${rootTopicId}?sessionId=${sessionId}`,
    { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
  );
  const reviewSet = await reviewSetResponse.json();
  const questions = reviewSet.payload.questions; // 10문제
  
  // 3. 한 문제씩 채점
  let answeredCount = 0;
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const userAnswer = getUserAnswer(question.id); // 사용자가 선택한 답
    
    // 한 문제씩 즉시 채점
    const gradeResponse = await fetch(
      `/api/study/written/mcq/grade-one?sessionId=${sessionId}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN'
        },
        body: JSON.stringify({
          topicId: rootTopicId,
          questionId: question.id,
          label: userAnswer
        })
      }
    );
    const gradeResult = await gradeResponse.json();
    
    // 채점 결과 표시
    displayGradeResult(question.id, gradeResult);
    
    answeredCount++;
    const isLastQuestion = (i === questions.length - 1);
    
    // 마지막 문제(10번째)에서만 세션 조회 및 advance 호출
    if (isLastQuestion) {
      // 세션 상태 조회하여 메타데이터 가져오기
      const sessionResponse = await fetch(
        `/api/study/session/${sessionId}`,
        { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
      );
      const session = await sessionResponse.json();
      
      // MCQ 단계의 메타데이터 추출
      const mcqStep = session.steps.find(s => s.step === "MCQ");
      
      // advance 호출하여 MCQ 단계 완료
      const advanceResponse = await fetch('/api/study/session/advance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN'
        },
        body: JSON.stringify({
          sessionId,
          step: "MCQ",
          score: mcqStep.score || 0,
          detailsJson: mcqStep.detailsJson
        })
      });
      const advanceResult = await advanceResponse.json();
      
      // 다음 단계로 이동
      if (advanceResult.movedTo === "REVIEW_WRONG") {
        // 오답 노트 화면
        await showWrongNotes(sessionId);
      } else if (advanceResult.movedTo === "SUMMARY") {
        // 요약 화면
        await showSummary(rootTopicId, sessionId);
      }
    }
  }
}

async function showWrongNotes(learningSessionId: number) {
  // 오답 문제 조회
  const wrongRecapResponse = await fetch(
    `/api/study/wrong-recap/written/learning-session?learningSessionId=${learningSessionId}`,
    { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
  );
  const wrongRecap = await wrongRecapResponse.json();
  
  // 오답 노트 화면 표시
  displayWrongNotes(wrongRecap.items);
  
  // 사용자가 "다음" 버튼 클릭 시
  const advanceResponse = await fetch('/api/study/session/advance', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      sessionId: learningSessionId,
      step: "REVIEW_WRONG",
      score: null,
      detailsJson: null
    })
  });
  const advanceResult = await advanceResponse.json();
  
  if (advanceResult.movedTo === "SUMMARY") {
    // 요약 화면으로 이동
    await showSummary(/* ... */);
  }
}

async function showSummary(rootTopicId: number, learningSessionId: number) {
  // 요약 조회
  const summaryResponse = await fetch(
    `/api/study/written/review/summary?rootTopicId=${rootTopicId}&sessionId=${learningSessionId}`,
    { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }
  );
  const summary = await summaryResponse.json();
  
  // 요약 화면 표시
  displaySummary(summary.payload);
  
  // 사용자가 "완료" 버튼 클릭 시
  const advanceResponse = await fetch('/api/study/session/advance', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      sessionId: learningSessionId,
      step: "SUMMARY",
      score: null,
      detailsJson: null
    })
  });
  const advanceResult = await advanceResponse.json();
  
  if (advanceResult.movedTo === "END" && advanceResult.status === "DONE") {
    // 세션 완료
    localStorage.removeItem('reviewLearningSessionId');
    navigate('/review/complete');
  }
}
```

---

## ⚠️ 주의사항

### 1. learningSessionId 저장

**중요:** `POST /api/study/session/start`를 호출하면 반환되는 `sessionId`를 **반드시 저장**해야 합니다.

```typescript
// 저장
localStorage.setItem('reviewLearningSessionId', sessionId.toString());

// 조회
const learningSessionId = localStorage.getItem('reviewLearningSessionId');

// 삭제 (세션 완료 시)
localStorage.removeItem('reviewLearningSessionId');
```

### 2. 세션 복원 (페이지 새로고침 대응)

```typescript
// 컴포넌트 마운트 시 저장된 세션 ID 확인
useEffect(() => {
  const savedSessionId = localStorage.getItem('reviewLearningSessionId');
  
  if (savedSessionId) {
    // 세션 상태 확인
    fetch(`/api/study/session/${savedSessionId}`)
      .then(res => res.json())
      .then(session => {
        if (session.status === "IN_PROGRESS") {
          // 진행 중인 세션이 있으면 이어서 진행
          setLearningSessionId(Number(savedSessionId));
        } else {
          // 완료된 세션이면 새로 시작
          localStorage.removeItem('reviewLearningSessionId');
        }
      });
  }
}, []);
```

### 3. 문제는 세션 시작 시점에 고정

**중요:** 문제는 세션 시작 시점에 할당되며, 이후 변경되지 않습니다. 같은 세션에서 `GET /api/study/written/review/{rootTopicId}`를 여러 번 호출해도 항상 같은 문제가 반환됩니다.

### 4. 오답 자동 건너뛰기

**프론트엔드에서 오답 여부를 확인할 필요 없음:**
- 백엔드가 자동으로 처리합니다.
- 오답이 없으면 `advance` 호출 시 `REVIEW_WRONG`을 건너뛰고 `SUMMARY`로 이동합니다.
- 프론트엔드는 `advance` 응답의 `movedTo` 필드를 따라가면 됩니다.

### 5. 완료 조건 검증

`advance` API는 다음 조건을 검증합니다:
- **MCQ**: 10문제 모두 풀어야 함

**모든 문제를 풀지 않았는데 `advance`를 호출하면 에러가 발생합니다:**
```json
{
  "status": 400,
  "message": "MCQ 단계의 모든 문제를 풀어야 합니다. (완료: 7/10)"
}
```

### 6. 에러 처리

`advance` API 호출 시 다음 에러가 발생할 수 있습니다:

**단계가 진행 가능한 상태가 아닐 때:**
```json
{
  "status": 400,
  "message": "단계가 진행 가능한 상태가 아닙니다. 현재 상태: COMPLETE"
}
```

**모든 문제를 풀지 않았을 때:**
```json
{
  "status": 400,
  "message": "MCQ 단계의 모든 문제를 풀어야 합니다. (완료: 7/10)"
}
```

**세션 소유자가 아닐 때:**
```json
{
  "status": 403,
  "message": "세션 소유자가 아닙니다."
}
```

---

## 📊 API 요약

### 세션 관리

| 엔드포인트 | Method | 설명 |
|-----------|--------|------|
| `/api/study/session/start` | POST | Review 모드 세션 시작 |
| `/api/study/session/{sessionId}` | GET | 세션 상세 조회 |
| `/api/study/session/advance` | POST | 단계 전이 |

### Review 단계별 API

| 단계 | 엔드포인트 | Method | 설명 |
|------|-----------|--------|------|
| MCQ | `/api/study/written/review/{rootTopicId}` | GET | 문제 세트 조회 |
| MCQ | `/api/study/written/mcq/grade-one` | POST | ⭐ 한 문제씩 즉시 채점 (권장) |
| MCQ | `/api/study/written/review/submit` | POST | 여러 문제 한 번에 제출 (비권장) |
| REVIEW_WRONG | `/api/study/wrong-recap/written/learning-session` | GET | 오답 문제 조회 |
| SUMMARY | `/api/study/written/review/summary` | GET | 요약 조회 |

**참고:** `grade-one` API는 Review 모드와 Micro 모드 모두에서 사용할 수 있습니다. 세션 모드를 자동으로 감지하여 적절히 처리합니다.

---

## 🔍 체크리스트

Review 모드 구현 시 다음 사항을 확인하세요:

- [ ] **세션 시작 시 `learningSessionId` 저장 (localStorage 권장)**
- [ ] **페이지 새로고침 시 저장된 세션 ID로 세션 복원**
- [ ] **세션 완료 시 저장된 ID 삭제**
- [ ] ⭐ **한 문제씩 채점: 각 문제를 풀 때마다 `grade-one` API 호출**
- [ ] ⭐ **마지막 문제에서만 세션 조회 및 `advance` API 호출 (성능 최적화)**
- [ ] `review/submit` 호출 후 모든 문제 완료 시 `advance` API 호출 추가 (비권장)
- [ ] REVIEW_WRONG 화면 종료 시 `advance` API 호출 추가
- [ ] SUMMARY 화면 종료 시 `advance` API 호출 추가
- [ ] 오답 여부 확인 로직 제거 (백엔드가 자동 처리)
- [ ] 단계 전이 조건부 로직 제거 (백엔드가 자동 처리)
- [ ] `advance` 응답의 `movedTo` 필드를 사용하여 다음 화면으로 이동
- [ ] 에러 처리 추가 (완료 조건 미충족, 상태 오류 등)

---

## 📞 문의사항

마이그레이션 중 문제가 발생하거나 질문이 있으시면 백엔드 팀에 문의해주세요.

---

**작성일:** 2025-01-27  
**버전:** 1.0  
**작성자:** Backend Team

