import { useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { Navigation } from "./components/Navigation";
import { HomeDashboard } from "./components/HomeDashboard";
import { MainLearningDashboard } from "./components/MainLearning/MainLearningDashboard";
import { ConceptView } from "./components/MainLearning/ConceptView";
import { MiniCheck } from "./components/MainLearning/MiniCheck";
import { ProblemSolving } from "./components/MainLearning/ProblemSolving";
import { MicroResult } from "./components/MainLearning/MicroResult";
import { ReviewMode } from "./components/MainLearning/ReviewMode";
import { SoloPracticeDashboard } from "./components/SoloPractice/SoloPracticeDashboard";
import { CategoryQuiz } from "./components/SoloPractice/CategoryQuiz";
import { DifficultyQuiz } from "./components/SoloPractice/DifficultyQuiz";
import { WeaknessQuiz } from "./components/SoloPractice/WeaknessQuiz";
import { ReportDashboard } from "./components/Report/ReportDashboard";
import { CertInfoDashboard } from "./components/CertInfo/CertInfoDashboard";
import { BattleDashboard } from "./components/Battle/BattleDashboard";
import { OneVsOneBattle } from "./components/Battle/OneVsOneBattle";
import { BattleGame } from "./components/Battle/BattleGame";
import { BattleResult } from "./components/Battle/BattleResult";
import { Tournament } from "./components/Battle/Tournament";
import { TournamentBracket } from "./components/Battle/TournamentBracket";
import { GoldenBell } from "./components/Battle/GoldenBell";
import { GoldenBellGame } from "./components/Battle/GoldenBellGame";
import { CommunityDashboard } from "./components/Community/CommunityDashboard";
import { SettingsDashboard } from "./components/Settings/SettingsDashboard";
import { topics, concepts, questions, userProfile as initialProfile, userSettings as initialSettings } from "./data/mockData";

type View = "home" | "main" | "solo" | "report" | "certinfo" | "battle" | "community" | "settings";
type MainLearningStep = "dashboard" | "concept" | "miniCheck" | "problemSolving" | "microResult" | "review" | "reviewResult";
type SoloStep = "dashboard" | "categoryQuiz" | "difficultyQuiz" | "weaknessQuiz" | "quizInProgress";
type BattleStep = "dashboard" | "oneVsOne" | "battleGame" | "battleResult" | "tournament" | "tournamentBracket" | "goldenBell" | "goldenBellGame";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [userProfile, setUserProfile] = useState(initialProfile);
  const [userSettings, setUserSettings] = useState(initialSettings);

  // Main Learning State
  const [mainLearningStep, setMainLearningStep] = useState<MainLearningStep>("dashboard");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [miniCheckScore, setMiniCheckScore] = useState(0);
  const [problemSolvingScore, setProblemSolvingScore] = useState(0);

  // Solo Practice State
  const [soloStep, setSoloStep] = useState<SoloStep>("dashboard");

  // Battle State
  const [battleStep, setBattleStep] = useState<BattleStep>("dashboard");
  const [selectedOpponent, setSelectedOpponent] = useState({ id: "", name: "" });
  const [battleScore, setBattleScore] = useState({ my: 0, opponent: 0 });
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [selectedGoldenBellId, setSelectedGoldenBellId] = useState("");

  // Helper Functions
  const getTopic = (id: string) => topics.find(t => t.id === id);
  const getConcept = (topicId: string) => concepts.find(c => c.topicId === topicId);
  const getQuestions = (topicId: string, type: "ox" | "multiple") => 
    questions.filter(q => q.topicId === topicId && q.type === type);
  const getAllQuestions = (topicId: string) => questions.filter(q => q.topicId === topicId);

  // Main Learning Handlers
  const handleStartMicro = (topicId: string) => {
    setSelectedTopicId(topicId);
    setMainLearningStep("concept");
  };

  const handleConceptNext = () => {
    setMainLearningStep("miniCheck");
  };

  const handleMiniCheckComplete = (score: number) => {
    setMiniCheckScore(score);
    setMainLearningStep("problemSolving");
  };

  const handleProblemSolvingComplete = (score: number, answers: any[]) => {
    setProblemSolvingScore(score);
    setMainLearningStep("microResult");
  };

  const handleStartReview = (topicId: string) => {
    setSelectedTopicId(topicId);
    setMainLearningStep("review");
  };

  const handleReviewComplete = (score: number, answers: any[]) => {
    setProblemSolvingScore(score);
    setMainLearningStep("reviewResult");
  };

  const handleBackToMainDashboard = () => {
    setMainLearningStep("dashboard");
    setSelectedTopicId("");
    setMiniCheckScore(0);
    setProblemSolvingScore(0);
  };

  const handleRetryMicro = () => {
    setMiniCheckScore(0);
    setProblemSolvingScore(0);
    setMainLearningStep("concept");
  };

  // Solo Practice Handlers
  const handleStartCategoryQuiz = () => {
    setSoloStep("categoryQuiz");
  };

  const handleStartDifficultyQuiz = () => {
    setSoloStep("difficultyQuiz");
  };

  const handleStartWeaknessQuiz = () => {
    setSoloStep("weaknessQuiz");
  };

  const handleCategoryQuizStart = (tags: string[], count: number) => {
    // TODO: Start quiz with selected tags and count
    alert(`선택한 태그: ${tags.join(", ")}\n문제 수: ${count}`);
    setSoloStep("quizInProgress");
  };

  const handleBackToSoloDashboard = () => {
    setSoloStep("dashboard");
  };

  // Battle Handlers
  const handleStart1v1 = () => {
    setBattleStep("oneVsOne");
  };

  const handleStartTournament = () => {
    setBattleStep("tournament");
  };

  const handleStartGoldenBell = () => {
    setBattleStep("goldenBell");
  };

  const handleBattleStart = (opponentId: string, category: string, difficulty: string) => {
    // Find opponent name
    const opponents = [
      { id: "u1", name: "코딩마스터" },
      { id: "u2", name: "알고킹" },
      { id: "u3", name: "DB전문가" },
      { id: "u4", name: "네트워크천재" },
      { id: "u5", name: "OOP마스터" },
    ];
    const opponent = opponents.find(o => o.id === opponentId) || { id: opponentId, name: "상대" };
    setSelectedOpponent(opponent);
    setBattleStep("battleGame");
  };

  const handleBattleComplete = (myScore: number, opponentScore: number) => {
    setBattleScore({ my: myScore, opponent: opponentScore });
    setBattleStep("battleResult");
  };

  const handleBattleRematch = () => {
    setBattleStep("battleGame");
  };

  const handleTournamentJoin = (tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
    setBattleStep("tournamentBracket");
  };

  const handleTournamentMatch = () => {
    // Simulate tournament match (using battle game)
    const opponent = { id: "t1", name: "DB전문가" };
    setSelectedOpponent(opponent);
    setBattleStep("battleGame");
  };

  const handleGoldenBellJoin = (sessionId: string) => {
    setSelectedGoldenBellId(sessionId);
    setBattleStep("goldenBellGame");
  };

  const handleGoldenBellComplete = (survived: boolean, rank: number) => {
    alert(survived ? `축하합니다! ${rank}위로 골든벨 우승! 🏆` : `${rank}위에서 탈락하셨습니다.`);
    setBattleStep("goldenBell");
  };

  const handleBackToBattleDashboard = () => {
    setBattleStep("dashboard");
    setSelectedOpponent({ id: "", name: "" });
    setBattleScore({ my: 0, opponent: 0 });
  };

  // Community Handlers
  const handleViewRanking = (type: string) => {
    alert(`${type} 랭킹을 표시합니다`);
  };

  // Report Handlers
  const handleViewResultDetails = (resultId: string) => {
    alert(`결과 상세: ${resultId}`);
  };

  // Settings Handlers
  const handleUpdateProfile = (profile: any) => {
    setUserProfile(profile);
  };

  const handleUpdateSettings = (settings: any) => {
    setUserSettings(settings);
  };

  // Render Current View
  const renderContent = () => {
    if (currentView === "home") {
      return (
        <HomeDashboard 
          userProfile={userProfile} 
          onNavigate={(view) => setCurrentView(view as View)}
        />
      );
    }

    if (currentView === "main") {
      const selectedTopic = getTopic(selectedTopicId);
      const concept = getConcept(selectedTopicId);
      const oxQuestions = getQuestions(selectedTopicId, "ox");
      const multipleQuestions = getQuestions(selectedTopicId, "multiple");
      const allQuestions = getAllQuestions(selectedTopicId);

      switch (mainLearningStep) {
        case "concept":
          return concept && selectedTopic ? (
            <ConceptView
              concept={concept}
              topicName={selectedTopic.name}
              onNext={handleConceptNext}
            />
          ) : null;

        case "miniCheck":
          return selectedTopic && oxQuestions.length > 0 ? (
            <MiniCheck
              questions={oxQuestions}
              topicName={selectedTopic.name}
              onComplete={handleMiniCheckComplete}
            />
          ) : null;

        case "problemSolving":
          return selectedTopic && multipleQuestions.length > 0 ? (
            <ProblemSolving
              questions={multipleQuestions.slice(0, 5)}
              topicName={selectedTopic.name}
              onComplete={handleProblemSolvingComplete}
            />
          ) : null;

        case "microResult":
          return selectedTopic ? (
            <MicroResult
              topicName={selectedTopic.name}
              miniCheckScore={miniCheckScore}
              problemScore={problemSolvingScore}
              totalProblems={9}
              onBackToDashboard={handleBackToMainDashboard}
              onRetry={handleRetryMicro}
            />
          ) : null;

        case "review":
          return selectedTopic && allQuestions.length > 0 ? (
            <ReviewMode
              questions={allQuestions.slice(0, 20)}
              topicName={selectedTopic.name}
              onComplete={handleReviewComplete}
            />
          ) : null;

        case "reviewResult":
          return selectedTopic ? (
            <MicroResult
              topicName={selectedTopic.name}
              miniCheckScore={0}
              problemScore={problemSolvingScore}
              totalProblems={20}
              onBackToDashboard={handleBackToMainDashboard}
              onRetry={() => setMainLearningStep("review")}
            />
          ) : null;

        default:
          return (
            <MainLearningDashboard
              topics={topics}
              onStartMicro={handleStartMicro}
              onStartReview={handleStartReview}
            />
          );
      }
    }

    if (currentView === "solo") {
      switch (soloStep) {
        case "categoryQuiz":
          return (
            <CategoryQuiz
              onStart={handleCategoryQuizStart}
              onBack={handleBackToSoloDashboard}
            />
          );

        case "difficultyQuiz":
          return (
            <DifficultyQuiz
              onStart={(difficulty, count) => {
                alert(`난이도: ${difficulty}\n문제 수: ${count}`);
                setSoloStep("quizInProgress");
              }}
              onBack={handleBackToSoloDashboard}
            />
          );

        case "weaknessQuiz":
          return (
            <WeaknessQuiz
              onStart={(weakTags, count) => {
                alert(`약점 태그: ${weakTags.join(", ")}\n문제 수: ${count}`);
                setSoloStep("quizInProgress");
              }}
              onBack={handleBackToSoloDashboard}
            />
          );

        default:
          return (
            <SoloPracticeDashboard
              onStartCategoryQuiz={handleStartCategoryQuiz}
              onStartDifficultyQuiz={handleStartDifficultyQuiz}
              onStartWeaknessQuiz={handleStartWeaknessQuiz}
            />
          );
      }
    }

    if (currentView === "report") {
      return <ReportDashboard onViewDetails={handleViewResultDetails} />;
    }

    if (currentView === "certinfo") {
      return <CertInfoDashboard />;
    }

    if (currentView === "battle") {
      const multipleQuestions = questions.filter(q => q.type === "multiple").slice(0, 10);

      switch (battleStep) {
        case "oneVsOne":
          return (
            <OneVsOneBattle
              onStart={handleBattleStart}
              onBack={handleBackToBattleDashboard}
            />
          );

        case "battleGame":
          return multipleQuestions.length > 0 ? (
            <BattleGame
              questions={multipleQuestions}
              opponentName={selectedOpponent.name}
              onComplete={handleBattleComplete}
              onExit={handleBackToBattleDashboard}
            />
          ) : null;

        case "battleResult":
          return (
            <BattleResult
              myScore={battleScore.my}
              opponentScore={battleScore.opponent}
              opponentName={selectedOpponent.name}
              onRematch={handleBattleRematch}
              onBackToDashboard={handleBackToBattleDashboard}
            />
          );

        case "tournament":
          return (
            <Tournament
              onJoin={handleTournamentJoin}
              onBack={handleBackToBattleDashboard}
            />
          );

        case "tournamentBracket":
          return (
            <TournamentBracket
              tournamentId={selectedTournamentId}
              onStartMatch={handleTournamentMatch}
              onBack={() => setBattleStep("tournament")}
            />
          );

        case "goldenBell":
          return (
            <GoldenBell
              onJoin={handleGoldenBellJoin}
              onBack={handleBackToBattleDashboard}
            />
          );

        case "goldenBellGame":
          return (
            <GoldenBellGame
              sessionId={selectedGoldenBellId}
              onComplete={handleGoldenBellComplete}
              onExit={() => setBattleStep("goldenBell")}
            />
          );

        default:
          return (
            <BattleDashboard
              onStart1v1={handleStart1v1}
              onStartTournament={handleStartTournament}
              onStartGoldenBell={handleStartGoldenBell}
            />
          );
      }
    }

    if (currentView === "community") {
      return <CommunityDashboard onViewRanking={handleViewRanking} />;
    }

    if (currentView === "settings") {
      return (
        <SettingsDashboard
          userProfile={userProfile}
          userSettings={userSettings}
          onUpdateProfile={handleUpdateProfile}
          onUpdateSettings={handleUpdateSettings}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <Navigation
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view as View);
          setMainLearningStep("dashboard");
          setSoloStep("dashboard");
          setBattleStep("dashboard");
        }}
        userProfile={userProfile}
      />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
      <Toaster />
    </div>
  );
}