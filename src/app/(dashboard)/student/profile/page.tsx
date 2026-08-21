'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award, BookOpen, Target, Trophy, LogOut, User } from 'lucide-react';
import Card from '@/components/ui/Card';
import CircularProgress from '@/components/ui/CircularProgress';
import Button from '@/components/ui/Button';

interface Profile {
  full_name: string; email: string; roll_number: string;
  institution_name: string; class_name: string;
}
interface Readiness {
  knowledge_score: number; scenario_score: number;
  quiz_score: number; drill_score: number;
  overall_score: number; readiness_level: string;
}

export default function StudentProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/student/profile').then(r => r.json()),
      fetch('/api/student/readiness').then(r => r.json()),
    ]).then(([p, r]) => {
      setProfile(p.profile); setReadiness(r.readiness);
    }).finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/'); router.refresh();
  };

  if (loading) return <div className="max-w-lg mx-auto px-4 pt-6"><div className="h-64 skeleton rounded-2xl" /></div>;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 stagger-children">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/student')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text">My Profile</h1>
      </div>

      {/* Avatar */}
      <div className="text-center mb-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <User size={32} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold text-text">{profile?.full_name}</h2>
        <p className="text-sm text-text-muted">{profile?.email}</p>
      </div>

      {/* Info */}
      <Card className="mb-4">
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Roll Number</span><span className="font-medium text-text">{profile?.roll_number || 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Institution</span><span className="font-medium text-text">{profile?.institution_name || 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Class</span><span className="font-medium text-text">{profile?.class_name || 'N/A'}</span></div>
        </div>
      </Card>

      {/* Readiness Breakdown */}
      {readiness && (
        <Card className="mb-4">
          <h3 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
            <Award size={16} className="text-primary" /> Readiness Breakdown
          </h3>
          <CircularProgress value={readiness.overall_score} size={100} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              { label: 'Knowledge', score: readiness.knowledge_score, icon: BookOpen, color: '#3B82F6' },
              { label: 'Scenarios', score: readiness.scenario_score, icon: Target, color: '#8B5CF6' },
              { label: 'Quizzes', score: readiness.quiz_score, icon: Trophy, color: '#F59E0B' },
              { label: 'Drills', score: readiness.drill_score, icon: Award, color: '#10B981' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <item.icon size={16} style={{ color: item.color }} />
                <div className="flex-1">
                  <p className="text-xs text-text-muted">{item.label}</p>
                  <p className="text-sm font-bold" style={{ color: item.color }}>{item.score}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Button onClick={handleLogout} variant="outline" fullWidth className="!border-emergency !text-emergency">
        <LogOut size={16} /> Logout
      </Button>
    </div>
  );
}
