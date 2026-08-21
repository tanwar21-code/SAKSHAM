'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trophy, Target, ChevronRight, Siren } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface Quiz {
  id: number; title: string; description: string; passing_score: number;
  disaster_name: string; icon: string; question_count: number;
  attempts: number; best_score: number | null;
}

interface Scenario {
  id: number; title: string; description: string; difficulty: string;
  disaster_name: string; icon: string; step_count: number;
  attempts: number; best_score: number | null;
}

interface Drill {
  id: number; title: string; instructions: string; scheduled_at: string;
  disaster_name: string; icon: string; class_name: string; section: string;
  participated: boolean;
}

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') || 'quiz') as 'quiz' | 'scenario' | 'drill';
  const [tab, setTab] = useState<'quiz' | 'scenario' | 'drill'>(initialTab);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      fetch('/api/student/quizzes').then(r => r.json()),
      fetch('/api/student/scenarios').then(r => r.json()),
      fetch('/api/student/drills').then(r => r.json()),
    ]).then(([qData, sData, dData]) => {
      setQuizzes(qData.quizzes || []);
      setScenarios(sData.scenarios || []);
      setDrills(dData.drills || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const joinDrill = async (id: number) => {
    await fetch(`/api/student/drills/${id}/participate`, { method: 'POST' });
    load();
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl skeleton mb-3" />)}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/student')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text">Practice</h1>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        {([
          { id: 'quiz' as const, label: 'Quizzes', icon: <Trophy size={14} /> },
          { id: 'scenario' as const, label: 'Scenarios', icon: <Target size={14} /> },
          { id: 'drill' as const, label: 'Drills', icon: <Siren size={14} /> },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] ${
              tab === t.id ? 'bg-white text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'quiz' && (
        <div className="space-y-2 stagger-children">
          {quizzes.map(q => (
            <Card key={q.id} onClick={() => router.push(`/student/quiz/${q.id}`)} interactive>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{q.icon || '📝'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">{q.title}</p>
                  <p className="text-xs text-text-muted">{q.disaster_name} • {q.question_count} questions</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {q.best_score !== null && (
                      <Badge variant={q.best_score >= q.passing_score ? 'success' : 'warning'}>Best: {q.best_score}%</Badge>
                    )}
                    {q.attempts > 0 && <Badge variant="neutral">{q.attempts} attempt{q.attempts > 1 ? 's' : ''}</Badge>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted mt-2" />
              </div>
            </Card>
          ))}
          {quizzes.length === 0 && <div className="text-center py-12"><p className="text-4xl mb-3">📝</p><p className="text-text-muted">No quizzes available yet.</p></div>}
        </div>
      )}

      {tab === 'scenario' && (
        <div className="space-y-2 stagger-children">
          {scenarios.map(s => (
            <Card key={s.id} onClick={() => router.push(`/student/scenario/${s.id}`)} interactive>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{s.icon || '🎮'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">{s.title}</p>
                  <p className="text-xs text-text-muted">{s.disaster_name} • {s.step_count} decisions</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant={s.difficulty === 'beginner' ? 'success' : s.difficulty === 'intermediate' ? 'warning' : 'danger'}>{s.difficulty}</Badge>
                    {s.best_score !== null && <Badge variant={s.best_score >= 70 ? 'success' : 'warning'}>Best: {s.best_score}%</Badge>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted mt-2" />
              </div>
            </Card>
          ))}
          {scenarios.length === 0 && <div className="text-center py-12"><p className="text-4xl mb-3">🎮</p><p className="text-text-muted">No scenarios available yet.</p></div>}
        </div>
      )}

      {tab === 'drill' && (
        <div className="space-y-2 stagger-children">
          {drills.map(d => (
            <Card key={d.id}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{d.icon || '🚨'}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{d.title}</p>
                  <p className="text-xs text-text-muted">{d.disaster_name} • {d.class_name}-{d.section}</p>
                  {d.instructions && <p className="text-xs text-text-muted mt-1">{d.instructions}</p>}
                  {d.participated ? (
                    <Badge variant="success" className="mt-2">Participated</Badge>
                  ) : (
                    <Button size="sm" className="mt-2 !min-h-[40px]" onClick={() => joinDrill(d.id)}>Mark participation</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {drills.length === 0 && <div className="text-center py-12"><p className="text-4xl mb-3">🚨</p><p className="text-text-muted">No class drills assigned yet.</p></div>}
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 pt-6"><div className="h-24 skeleton rounded-2xl" /></div>}>
      <PracticeContent />
    </Suspense>
  );
}
