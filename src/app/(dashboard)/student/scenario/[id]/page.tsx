'use client';
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle2, XCircle, RotateCcw, Target } from 'lucide-react';
import Button from '@/components/ui/Button';
import CircularProgress from '@/components/ui/CircularProgress';

interface ScenarioInfo { id: number; title: string; description: string; disaster_name: string; icon: string; }
interface Step { id: number; scenario_id: number; step_number: number; situation_text: string; }
interface Option { id: number; option_text: string; display_order: number; }
interface FinalResult { score: number; decisions_made: number; correct_decisions: number; total_steps: number; time_taken_seconds: number; }

type Phase = 'intro' | 'playing' | 'feedback' | 'result';

export default function ScenarioPage() {
  const router = useRouter();
  const params = useParams();
  const scenarioId = params.id as string;

  const [phase, setPhase] = useState<Phase>('intro');
  const [scenario, setScenario] = useState<ScenarioInfo | null>(null);
  const [attemptId, setAttemptId] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepNumber, setStepNumber] = useState(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isBestChoice, setIsBestChoice] = useState(false);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [decisionStart, setDecisionStart] = useState(Date.now());

  const startScenario = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/scenarios/${scenarioId}/start`, { method: 'POST' });
      const data = await res.json();
      setScenario(data.scenario);
      setAttemptId(data.attemptId);
      setCurrentStep(data.currentStep);
      setOptions(data.options);
      setTotalSteps(data.totalSteps);
      setStepNumber(1);
      setPhase('playing');
      setDecisionStart(Date.now());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const makeDecision = async (optionId: number) => {
    setSelectedOption(optionId);
    setLoading(true);
    const decisionTime = Math.round((Date.now() - decisionStart) / 1000);

    try {
      const res = await fetch(`/api/student/scenarios/${scenarioId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attemptId,
          step_id: currentStep?.id,
          selected_option_id: optionId,
          decision_time_seconds: decisionTime,
        }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
      setIsBestChoice(data.isBestChoice);

      if (data.isLastStep) {
        setFinalResult(data.finalResult);
        setPhase('feedback');
        setTimeout(() => setPhase('result'), 2800);
      } else {
        setPhase('feedback');
        setTimeout(() => {
          setCurrentStep(data.nextStep);
          setOptions(data.nextOptions);
          setStepNumber(prev => prev + 1);
          setSelectedOption(null);
          setPhase('playing');
          setDecisionStart(Date.now());
        }, 3000);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="min-h-screen scenario-bg flex flex-col">
        <div className="max-w-lg mx-auto px-4 pt-6 flex-1 flex flex-col">
          <button onClick={() => router.push('/student/practice?tab=scenario')} className="p-2 rounded-xl hover:bg-white/10 text-white self-start min-h-[44px] min-w-[44px] flex items-center justify-center mb-8">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center text-center text-white stagger-children">
            <div className="text-5xl mb-4">🎮</div>
            <h1 className="text-2xl font-bold mb-2">Scenario Simulator</h1>
            <p className="text-sm text-gray-300 mb-6 max-w-xs">
              You&apos;ll be placed in a realistic disaster situation. Make decisions step by step to test your preparedness.
            </p>
            <Button onClick={startScenario} loading={loading} size="lg" className="!bg-primary !text-white">
              <Target size={18} /> Start Scenario
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Playing / Feedback
  if (phase === 'playing' || phase === 'feedback') {
    return (
      <div className="min-h-screen scenario-bg flex flex-col">
        <div className="max-w-lg mx-auto px-4 pt-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white">
              <span className="text-xl">{scenario?.icon}</span>
              <span className="text-sm font-medium">{scenario?.disaster_name}</span>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={12} /> Step {stepNumber}/{totalSteps}
            </div>
          </div>

          {/* Progress */}
          <div className="h-1 bg-white/20 rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(stepNumber / totalSteps) * 100}%` }} />
          </div>

          {/* Situation */}
          <div className="flex-1 animate-fade-in" key={currentStep?.id}>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emergency animate-pulse" />
                <span className="text-xs font-semibold text-emergency uppercase tracking-wide">
                  {scenario?.disaster_name} — Scenario
                </span>
              </div>
              <p className="text-white text-base leading-relaxed">{currentStep?.situation_text}</p>
            </div>

            {/* Feedback overlay */}
            {phase === 'feedback' && (
              <div className={`rounded-2xl p-4 mb-4 animate-fade-in flex items-start gap-3 ${
                isBestChoice ? 'bg-green-500/20 border border-green-400/30' : 'bg-amber-500/20 border border-amber-400/30'
              }`}>
                {isBestChoice ? (
                  <CheckCircle2 size={20} className="text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isBestChoice ? 'text-green-300' : 'text-amber-300'}`}>
                    {isBestChoice ? 'Great decision!' : 'Could be better'}
                  </p>
                  <p className="text-xs text-gray-300">{feedback}</p>
                </div>
              </div>
            )}

            {/* Options */}
            {phase === 'playing' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">What do you do?</p>
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => !loading && makeDecision(opt.id)}
                    disabled={loading}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 min-h-[48px] ${
                      selectedOption === opt.id
                        ? 'border-primary bg-primary/20 text-white'
                        : 'border-white/20 bg-white/5 text-gray-200 hover:border-white/40 hover:bg-white/10'
                    } disabled:opacity-50`}
                  >
                    {opt.option_text}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Result screen
  if (phase === 'result' && finalResult) {
    return (
      <div className="min-h-screen scenario-bg flex flex-col">
        <div className="max-w-lg mx-auto px-4 pt-10 flex-1 text-center stagger-children">
          <CircularProgress value={finalResult.score} size={160} label="Scenario Score" className="[&_*]:!text-white [&_.text-text-muted]:!text-gray-400" />

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
              <p className="text-lg font-bold text-white">{finalResult.correct_decisions}/{finalResult.total_steps}</p>
              <p className="text-[10px] text-gray-400">Decision Accuracy</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
              <p className="text-lg font-bold text-white">{finalResult.time_taken_seconds}s</p>
              <p className="text-[10px] text-gray-400">Total Time</p>
            </div>
          </div>

          <div className={`mt-4 rounded-xl p-3 text-sm font-semibold ${
            finalResult.score >= 80 ? 'bg-green-500/20 text-green-300' :
            finalResult.score >= 60 ? 'bg-amber-500/20 text-amber-300' :
            'bg-red-500/20 text-red-300'
          }`}>
            {finalResult.score >= 80 ? '🏆 Excellent preparedness!' :
             finalResult.score >= 60 ? '💪 Good effort, keep practicing!' :
             '📚 More practice needed. Review the learning modules.'}
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <Button onClick={() => { setPhase('intro'); setFinalResult(null); }} fullWidth>
              <RotateCcw size={16} /> Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push('/student/practice?tab=scenario')} fullWidth className="!border-white/30 !text-white hover:!bg-white/10">
              Back to Scenarios
            </Button>
            <Button variant="ghost" onClick={() => router.push('/student')} fullWidth className="!text-gray-400 hover:!text-white">
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
