'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, Clock, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import CircularProgress from '@/components/ui/CircularProgress';

interface Option { id: number; question_id: number; option_text: string; display_order: number; }
interface Question { id: number; question_text: string; explanation: string; display_order: number; points: number; options: Option[]; }
interface Quiz { id: number; title: string; description: string; passing_score: number; disaster_name: string; icon: string; }
interface Result { question_id: number; selected_option_id: number; is_correct: boolean; correct_option_id: number; }

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [score, setScore] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const startTime = useRef(Date.now());
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    fetch(`/api/student/quizzes/${quizId}`)
      .then(r => r.json())
      .then(d => { setQuiz(d.quiz); setQuestions(d.questions || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [quizId]);

  // Timer
  useEffect(() => {
    if (results) return;
    const interval = setInterval(() => setTimer(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [results]);

  const selectAnswer = (questionId: number, optionId: number) => {
    if (results) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    const answers = Object.entries(selectedAnswers).map(([qId, oId]) => ({
      question_id: Number(qId), selected_option_id: oId,
    }));
    try {
      const res = await fetch(`/api/student/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, time_taken_seconds: timer }),
      });
      const data = await res.json();
      setResults(data.results);
      setScore(data.score);
      if (Array.isArray(data.questions)) {
        setQuestions(prev => prev.map(q => {
          const explained = data.questions.find((x: { id: number; explanation?: string }) => x.id === q.id);
          return { ...q, explanation: explained?.explanation || q.explanation };
        }));
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) {
    return <div className="max-w-lg mx-auto px-4 pt-6"><div className="h-64 skeleton rounded-2xl" /></div>;
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 text-center">
        <p className="text-text-muted">Quiz not found.</p>
        <Button onClick={() => router.push('/student/practice')} className="mt-4">Back</Button>
      </div>
    );
  }

  // Results screen
  if (results && !showReview) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center stagger-children">
        <CircularProgress value={score} size={160} label="Quiz Score" />
        <p className="mt-4 text-lg font-bold text-text">
          {score >= (quiz.passing_score || 70) ? '🎉 Great job!' : '💪 Keep practicing!'}
        </p>
        <p className="text-sm text-text-muted mt-1">
          {results.filter(r => r.is_correct).length}/{questions.length} correct • {formatTime(timer)}
        </p>
        <div className="flex flex-col gap-2 mt-6">
          <Button onClick={() => setShowReview(true)} fullWidth>Review Answers</Button>
          <Button variant="outline" onClick={() => { setResults(null); setSelectedAnswers({}); setCurrentQ(0); startTime.current = Date.now(); }} fullWidth>
            <RotateCcw size={16} /> Try Again
          </Button>
          <Button variant="ghost" onClick={() => router.push('/student/practice')} fullWidth>Back to Practice</Button>
        </div>
      </div>
    );
  }

  // Review screen
  if (results && showReview) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setShowReview(false)} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-text">Review Answers</h1>
        </div>
        <div className="space-y-4 stagger-children">
          {questions.map((q, i) => {
            const result = results.find(r => r.question_id === q.id);
            return (
              <div key={q.id} className="bg-white rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold text-text mb-2">
                  <span className="text-text-muted">Q{i + 1}.</span> {q.question_text}
                </p>
                <div className="space-y-1.5 mb-3">
                  {q.options.map(o => {
                    const isSelected = result?.selected_option_id === o.id;
                    const isCorrect = result?.correct_option_id === o.id;
                    return (
                      <div key={o.id} className={`px-3 py-2 rounded-xl text-sm flex items-center gap-2 ${
                        isCorrect ? 'bg-green-50 border border-green-300' :
                        isSelected && !result?.is_correct ? 'bg-red-50 border border-red-300' :
                        'bg-gray-50 border border-transparent'
                      }`}>
                        {isCorrect && <CheckCircle2 size={16} className="text-success shrink-0" />}
                        {isSelected && !isCorrect && <XCircle size={16} className="text-emergency shrink-0" />}
                        <span className={isCorrect ? 'font-medium text-success' : isSelected ? 'text-emergency' : 'text-text-muted'}>
                          {o.option_text}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Button variant="outline" onClick={() => router.push('/student/practice')} fullWidth className="mt-6">
          Back to Practice
        </Button>
      </div>
    );
  }

  // Quiz screen
  const q = questions[currentQ];
  const allAnswered = questions.every(q => selectedAnswers[q.id] !== undefined);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => router.push('/student/practice')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <p className="text-sm font-bold text-text">{quiz.icon} {quiz.title}</p>
        <div className="flex items-center gap-1 text-text-muted text-sm">
          <Clock size={14} /> {formatTime(timer)}
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
        <span className="text-xs font-medium text-text-muted">{currentQ + 1}/{questions.length}</span>
      </div>

      {/* Question */}
      <div className="animate-fade-in" key={q.id}>
        <p className="text-base font-semibold text-text mb-4 leading-relaxed">{q.question_text}</p>
        <div className="space-y-2">
          {q.options.map(o => (
            <button
              key={o.id}
              onClick={() => selectAnswer(q.id, o.id)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium min-h-[48px] ${
                selectedAnswers[q.id] === o.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-white text-text hover:border-primary/30'
              }`}
            >
              {o.option_text}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6 mb-4">
        {currentQ > 0 && (
          <Button variant="outline" onClick={() => setCurrentQ(currentQ - 1)} className="flex-1">Previous</Button>
        )}
        {currentQ < questions.length - 1 ? (
          <Button onClick={() => setCurrentQ(currentQ + 1)} className="flex-1" disabled={selectedAnswers[q.id] === undefined}>
            Next
          </Button>
        ) : (
          <Button onClick={submitQuiz} className="flex-1" disabled={!allAnswered} loading={submitting}>
            Submit Quiz
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center min-h-[28px] min-w-[28px] transition-all ${
              i === currentQ ? 'bg-primary text-white' :
              selectedAnswers[q.id] !== undefined ? 'bg-primary/20 text-primary' :
              'bg-gray-200 text-text-muted'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
