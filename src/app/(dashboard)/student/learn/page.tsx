'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, ChevronRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';

interface Module {
  id: number; title: string; description: string;
  difficulty: string; estimated_minutes: number;
  disaster_name: string; icon: string;
  progress_percentage: number | null; completed: boolean;
}

export default function LearnPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/modules')
      .then(res => res.json())
      .then(data => setModules(data.modules || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Group by disaster
  const grouped = modules.reduce<Record<string, { icon: string; modules: Module[] }>>((acc, mod) => {
    if (!acc[mod.disaster_name]) acc[mod.disaster_name] = { icon: mod.icon, modules: [] };
    acc[mod.disaster_name].modules.push(mod);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl skeleton mb-3" />)}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/student')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text">Learning Modules</h1>
      </div>

      {Object.entries(grouped).map(([disasterName, { icon, modules: mods }]) => (
        <div key={disasterName} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{icon}</span>
            <h2 className="text-base font-bold text-text">{disasterName}</h2>
          </div>
          <div className="space-y-2 stagger-children">
            {mods.map(mod => (
              <Card key={mod.id} onClick={() => router.push(`/student/learn/${mod.id}`)} interactive>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text mb-0.5">{mod.title}</p>
                    <p className="text-xs text-text-muted line-clamp-2 mb-2">{mod.description}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Clock size={10} /> {mod.estimated_minutes} min
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        mod.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                        mod.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {mod.difficulty}
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={mod.progress_percentage || 0} size="sm" showLabel />
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-text-muted mt-1 shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {modules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-text-muted">No learning modules available yet.</p>
        </div>
      )}
    </div>
  );
}
