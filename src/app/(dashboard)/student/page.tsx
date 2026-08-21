'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Target, AlertTriangle, ChevronRight, Trophy, Flame, Award, LogOut } from 'lucide-react';
import CircularProgress from '@/components/ui/CircularProgress';
import ProgressBar from '@/components/ui/ProgressBar';
import Card from '@/components/ui/Card';

interface DashboardData {
  summary: {
    full_name: string;
    readiness_score: number;
    knowledge_score: number;
    scenario_score: number;
    quiz_score: number;
    drill_score: number;
    readiness_level: string;
    total_modules: number;
    completed_modules: number;
    quizzes_completed: number;
    scenarios_completed: number;
  };
  recentModules: Array<{
    id: number;
    title: string;
    disaster_name: string;
    icon: string;
    progress_percentage: number | null;
    completed: boolean;
  }>;
  weakAreas: Array<{ area: string; avg_score: number }>;
  quizCount: number;
  drillCount: number;
  scenarioCount: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-text-muted">Welcome back,</p>
          <h1 className="text-xl font-bold text-text">{s?.full_name || 'Student'} 👋</h1>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-gray-100 text-text-muted min-h-[44px] min-w-[44px] flex items-center justify-center" title="Logout">
          <LogOut size={20} />
        </button>
      </div>

      {/* Readiness Score */}
      <Card className="text-center mb-4">
        <CircularProgress value={s?.readiness_score || 0} />
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
          {[
            { label: 'Knowledge', value: s?.knowledge_score || 0, color: '#3B82F6' },
            { label: 'Scenarios', value: s?.scenario_score || 0, color: '#8B5CF6' },
            { label: 'Quizzes', value: s?.quiz_score || 0, color: '#F59E0B' },
            { label: 'Drills', value: s?.drill_score || 0, color: '#10B981' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-lg font-bold" style={{ color: item.color }}>
                {item.value}%
              </div>
              <div className="text-[10px] text-text-muted">{item.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Continue Learning */}
      {data && data.recentModules.length > 0 && (
        <div className="mb-4">
          <h2 className="text-base font-bold text-text mb-2 flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            Continue Learning
          </h2>
          <div className="space-y-2">
            {data.recentModules.slice(0, 3).map(mod => (
              <Card key={mod.id} onClick={() => router.push(`/student/learn/${mod.id}`)} interactive>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mod.icon || '📚'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{mod.title}</p>
                    <p className="text-xs text-text-muted">{mod.disaster_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12">
                      <ProgressBar value={mod.progress_percentage || 0} size="sm" />
                    </div>
                    <ChevronRight size={16} className="text-text-muted" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-text mb-2">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          <Card onClick={() => router.push('/student/practice?tab=quiz')} interactive className="text-center">
            <Trophy size={22} className="text-primary mx-auto mb-1" />
            <p className="text-xs font-semibold">Take Quiz</p>
          </Card>
          <Card onClick={() => router.push('/student/practice?tab=scenario')} interactive className="text-center">
            <Target size={22} className="text-purple-500 mx-auto mb-1" />
            <p className="text-xs font-semibold">Practice Drill</p>
          </Card>
          <Card onClick={() => router.push('/emergency')} interactive className="text-center !border-red-200 !bg-red-50">
            <AlertTriangle size={22} className="text-emergency mx-auto mb-1" />
            <p className="text-xs font-semibold text-emergency">Emergency</p>
          </Card>
        </div>
      </div>

      {/* Progress Stats */}
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
          <Flame size={16} className="text-primary" />
          Your Progress
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-blue-600">{s?.completed_modules || 0}/{s?.total_modules || 0}</p>
            <p className="text-[10px] text-text-muted">Modules Completed</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-amber-600">{data?.quizCount || 0}</p>
            <p className="text-[10px] text-text-muted">Quizzes Taken</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-purple-600">{data?.scenarioCount || 0}</p>
            <p className="text-[10px] text-text-muted">Scenarios Done</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-600">{data?.drillCount || 0}</p>
            <p className="text-[10px] text-text-muted">Drills Participated</p>
          </div>
        </div>
      </Card>

      {/* Areas to Improve */}
      {data && data.weakAreas.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
            <Award size={16} className="text-warning" />
            Areas to Improve
          </h3>
          <div className="space-y-2">
            {data.weakAreas.map((area, i) => (
              <div key={i} className="flex items-center gap-3 bg-amber-50 rounded-xl px-3 py-2">
                <AlertTriangle size={14} className="text-warning shrink-0" />
                <span className="text-sm text-text flex-1">{area.area}</span>
                <span className="text-xs font-semibold text-warning">{Math.round(area.avg_score)}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
