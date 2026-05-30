import { useEffect, useMemo, useRef, useState } from 'react';
import { MCQ_FILE_PATH, PHASES, validateMcqData } from '../lib/mcq';
import { sendTestActivityEmail } from '../lib/resultEmail';

export function useMcqTest() {
  const [phase, setPhase] = useState(PHASES.loading);
  const [testData, setTestData] = useState(null);
  const [defaultTestData, setDefaultTestData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [activeSource, setActiveSource] = useState('default');
  const hasReportedResultRef = useRef(false);

  const resetQuizState = () => {
    setCurrentIndex(0);
    setAnswers({});
    hasReportedResultRef.current = false;
  };

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
        setDefaultTestData(validData);
        setActiveSource('default');
        setPhase(PHASES.intro);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load test file.');
        setPhase(PHASES.error);
      }
    }

    loadMcqFile();
  }, []);

  const loadUploadedFile = async (file) => {
    if (!file) return;

    setUploadMessage('');

    try {
      const fileText = await file.text();
      const parsedData = JSON.parse(fileText);
      const validData = validateMcqData(parsedData);

      setTestData(validData);
      setActiveSource(file.name);
      resetQuizState();
      setPhase(PHASES.intro);
      setUploadMessage(`Loaded ${file.name}. Your uploaded quiz is ready.`);
    } catch (caughtError) {
      if (defaultTestData) {
        setTestData(defaultTestData);
        setActiveSource('default');
      }

      setUploadMessage(caughtError instanceof Error ? caughtError.message : 'Unable to read the uploaded JSON file. Falling back to the default quiz.');
      resetQuizState();
      setPhase(PHASES.intro);
    }
  };

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
    resetQuizState();

    void sendTestActivityEmail({
      eventType: 'started',
      recipientEmail: 'ranjeetyadav31638@gmail.com',
      testTitle: testData?.title || 'MCQ Test Platform',
      testDescription: testData?.description || '',
      timestamp: new Date().toISOString(),
      questions: questions.map((question) => ({
        id: question.id,
        question: question.question,
        explanation: question.explanation
      }))
    });

    setPhase(PHASES.test);
  };

  const finishTest = () => {
    if (!hasReportedResultRef.current) {
      hasReportedResultRef.current = true;

      void sendTestActivityEmail({
        eventType: 'submitted',
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
    uploadMessage,
    activeSource,
    startTest,
    loadUploadedFile,
    finishTest,
    goToStart,
    goPrevious,
    goNext,
    handleSelect
  };
}