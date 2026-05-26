import { MAX_QUESTIONS } from './lib/mcq';
import { useMcqTest } from './hooks/useMcqTest';
import { AppShell } from './components/AppShell';
import { Panel } from './components/Panel';
import { ErrorState, IntroScreen, LoadingState, ResultScreen, TestScreen } from './components/QuizScreens';

export default function App() {
  const quiz = useMcqTest();

  if (quiz.phase === 'loading') {
    return (
      <AppShell>
        <Panel title="Loading test">
          <LoadingState />
        </Panel>
      </AppShell>
    );
  }

  if (quiz.phase === 'error') {
    return (
      <AppShell>
        <Panel title="Configuration Error" subtitle="The MCQ data file could not be loaded">
          <ErrorState error={quiz.error} />
        </Panel>
      </AppShell>
    );
  }

  if (quiz.phase === 'intro') {
    return (
      <AppShell>
        <IntroScreen
          title={quiz.testData?.title || 'MCQ Test Platform'}
          description={quiz.testData?.description || 'Choose the best answer for each question and review detailed explanations at the end.'}
          questionCount={quiz.questions.length}
          maxQuestions={MAX_QUESTIONS}
          onStart={quiz.startTest}
        />
      </AppShell>
    );
  }

  if (quiz.phase === 'result') {
    return (
      <AppShell>
        <ResultScreen scoreData={quiz.scoreData} onRetake={quiz.startTest} onGoToStart={quiz.goToStart} />
      </AppShell>
    );
  }

  if (!quiz.currentQuestion) {
    return null;
  }

  return (
    <AppShell>
      <TestScreen
        questions={quiz.questions}
        currentIndex={quiz.currentIndex}
        currentQuestion={quiz.currentQuestion}
        selectedOptionKey={quiz.selectedOptionKey}
        progress={quiz.progress}
        attemptedCount={quiz.attemptedCount}
        onSelect={quiz.handleSelect}
        onPrevious={quiz.goPrevious}
        onNext={quiz.goNext}
        onFinish={quiz.finishTest}
      />
    </AppShell>
  );
}
