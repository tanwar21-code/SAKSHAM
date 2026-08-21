'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BarChart3, BookOpen, Target, LogOut, ChevronRight, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';

interface ClassSummary { class_id: number; class_name: string; section: string; student_count: number; average_readiness: number; }
interface Activity { full_name: string; quiz_title: string; score: number; completed_at: string; }
interface QuizItem { id: number; title: string; is_published: boolean; disaster_name: string; question_count: number; }
interface AreaScore { area: string; avg_score: number; }

interface DashboardData {
  classes: ClassSummary[];
  totalStudents: number;
  avgReadiness: number;
  recentActivity: Activity[];
  myQuizzes: QuizItem[];
  teacherName: string;
  strongestArea: AreaScore | null;
  weakestArea: AreaScore | null;
  needsImprovement: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teacher/dashboard')
      .then(r => r.json())
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
        {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl skeleton mb-3" />)}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-text-muted">Teacher Dashboard</p>
          <h1 className="text-xl font-bold text-text">{data?.teacherName || 'Teacher'} 👩‍🏫</h1>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-gray-100 text-text-muted min-h-[44px] min-w-[44px] flex items-center justify-center">
          <LogOut size={20} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="text-center">
          <Users size={22} className="text-secondary mx-auto mb-1" />
          <p className="text-2xl font-bold text-text">{data?.totalStudents || 0}</p>
          <p className="text-[10px] text-text-muted">Total Students</p>
        </Card>
        <Card className="text-center">
          <BarChart3 size={22} className="text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-text">{data?.avgReadiness || 0}%</p>
          <p className="text-[10px] text-text-muted">Avg Readiness</p>
        </Card>
      </div>

      {/* Classes */}
      {data && data.classes.length > 0 && (
        <div className="mb-4">
          <h2 className="text-base font-bold text-text mb-2">Your Classes</h2>
          <div className="space-y-2">
            {data.classes.map(c => (
              <Card key={c.class_id} onClick={() => router.push(`/teacher/classes?id=${c.class_id}`)} interactive>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">{c.class_name} - {c.section}</p>
                    <p className="text-xs text-text-muted">{c.student_count} students</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-text">{Math.round(c.average_readiness || 0)}%</p>
                      <ProgressBar value={c.average_readiness || 0} size="sm" className="w-16" />
                    </div>
                    <ChevronRight size={16} className="text-text-muted" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(data?.strongestArea || data?.weakestArea) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card>
            <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Strongest Area</p>
            <p className="text-sm font-semibold text-success">✓ {data.strongestArea?.area || '—'}</p>
          </Card>
          <Card>
            <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Weakest Area</p>
            <p className="text-sm font-semibold text-warning">⚠ {data.weakestArea?.area || '—'}</p>
          </Card>
        </div>
      )}
      {data && data.needsImprovement > 0 && (
        <Card className="mb-4 !bg-amber-50 !border-amber-200">
          <p className="text-sm text-text">{data.needsImprovement} student{data.needsImprovement === 1 ? '' : 's'} need improvement</p>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card onClick={() => router.push('/teacher/quizzes')} interactive className="text-center">
          <BookOpen size={22} className="text-primary mx-auto mb-1" />
          <p className="text-xs font-semibold">Manage Quizzes</p>
          <p className="text-[10px] text-text-muted">{data?.myQuizzes?.length || 0} created</p>
        </Card>
        <Card onClick={() => router.push('/teacher/scenarios')} interactive className="text-center">
          <Target size={22} className="text-purple-500 mx-auto mb-1" />
          <p className="text-xs font-semibold">Manage Scenarios</p>
        </Card>
      </div>

      {/* Recent Activity */}
      {data && data.recentActivity.length > 0 && (
        <div className="mb-4">
          <h2 className="text-base font-bold text-text mb-2">Recent Activity</h2>
          <Card padding="sm">
            <div className="space-y-2">
              {data.recentActivity.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                  <Clock size={14} className="text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text truncate">
                      <span className="font-semibold">{a.full_name}</span> completed {a.quiz_title}
                    </p>
                  </div>
                  <Badge variant={a.score >= 70 ? 'success' : 'warning'}>{a.score}%</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
