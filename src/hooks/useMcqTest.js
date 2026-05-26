import { useEffect, useMemo, useRef, useState } from 'react';
import { MCQ_FILE_PATH, PHASES, validateMcqData } from '../lib/mcq';
import { sendTestResultEmail } from '../lib/resultEmail';

export function useMcqTest() {
  const [phase, setPhase] = useState(PHASES.loading);
  const [testData, setTestData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const hasReportedResultRef = useRef(false);

  useEffect(() => {
    async function loadMcqFile() {
      try {
        const response = await fetch(MCQ_FILE_PATH, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Could not load ${MCQ_FILE_PATH}. Please place your JSON file in /public as mcq-data.json.`);
        }

        const data = await response.json();
        const validData = validateMcqData(data);
        setTestData(validData);
        setPhase(PHASES.intro);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load test file.');
        setPhase(PHASES.error);
      }
    }

    loadMcqFile();
  }, []);

  const questions = testData?.questions || [];
  const currentQuestion = questions[currentIndex];
  const selectedOptionKey = currentQuestion ? answers[currentQuestion.id] || null : null;

  const scoreData = useMemo(() => {
    if (!questions.length) return { correct: 0, total: 0, details: [] };

    const details = questions.map((question) => {
      const selectedKey = answers[question.id] || null;
      const isCorrect = selectedKey === question.correctOptionKey;
      return { ...question, selectedKey, isCorrect };
    });

    const correct = details.filter((detail) => detail.isCorrect).length;
    return { correct, total: questions.length, details };
  }, [answers, questions]);

  const attemptedCount = Object.keys(answers).length;
  const progress = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const startTest = () => {
    setCurrentIndex(0);
    setAnswers({});
    hasReportedResultRef.current = false;
    setPhase(PHASES.test);
  };

  const finishTest = () => {
    if (!hasReportedResultRef.current) {
      hasReportedResultRef.current = true;

      void sendTestResultEmail({
        recipientEmail: 'ranjeetyadav31638@gmail.com',
        testTitle: testData?.title || 'MCQ Test Platform',
        testDescription: testData?.description || '',
        timestamp: new Date().toISOString(),
        scoreData,
        attemptedCount,
        questions: scoreData.details.map((question) => ({
          id: question.id,
          question: question.question,
          selectedKey: question.selectedKey,
          correctOptionKey: question.correctOptionKey,
          isCorrect: question.isCorrect
        }))
      });
    }

    setPhase(PHASES.result);
  };
  const goToStart = () => setPhase(PHASES.intro);
  const goPrevious = () => setCurrentIndex((previousIndex) => Math.max(0, previousIndex - 1));
  const goNext = () => setCurrentIndex((previousIndex) => Math.min(previousIndex + 1, questions.length - 1));

  const handleSelect = (questionId, optionKey) => {
    setAnswers((previousAnswers) => ({ ...previousAnswers, [questionId]: optionKey }));
  };

  return {
    phase,
    testData,
    questions,
    currentIndex,
    currentQuestion,
    selectedOptionKey,
    scoreData,
    attemptedCount,
    progress,
    error,
    startTest,
    finishTest,
    goToStart,
    goPrevious,
    goNext,
    handleSelect
  };
}