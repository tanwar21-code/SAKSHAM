'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';

interface Lesson {
  id: number; title: string; lesson_type: string;
  content: string; display_order: number;
}

interface ModuleData {
  module: { id: number; title: string; disaster_name: string; icon: string };
  lessons: Lesson[];
  progress: { progress_percentage: number; completed: boolean };
  relatedQuiz: { id: number; title: string } | null;
}

export default function LessonViewer() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;
  const [data, setData] = useState<ModuleData | null>(null);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/student/modules/${moduleId}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [moduleId]);

  const updateProgress = async (lessonIndex: number) => {
    if (!data) return;
    const total = data.lessons.length;
    const progressPct = Math.round(((lessonIndex + 1) / total) * 100);
    const completed = lessonIndex >= total - 1;

    await fetch(`/api/student/modules/${moduleId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress_percentage: progressPct, completed }),
    });
  };

  const goToLesson = (index: number) => {
    setCurrentLesson(index);
    updateProgress(index);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="h-8 skeleton rounded-xl mb-4 w-3/4" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!data || !data.lessons.length) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 text-center">
        <p className="text-text-muted">No lessons found for this module.</p>
        <Button onClick={() => router.push('/student/learn')} className="mt-4">Back to Modules</Button>
      </div>
    );
  }

  const lesson = data.lessons[currentLesson];
  const isLast = currentLesson === data.lessons.length - 1;
  const isFirst = currentLesson === 0;
  const progress = ((currentLesson + 1) / data.lessons.length) * 100;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.push('/student/learn')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted">{data.module.icon} {data.module.disaster_name}</p>
          <h1 className="text-base font-bold text-text truncate">{data.module.title}</h1>
        </div>
        <span className="text-xs font-medium text-text-muted">
          {currentLesson + 1}/{data.lessons.length}
        </span>
      </div>
      <ProgressBar value={progress} size="sm" className="mb-6" />

      {/* Lesson Content */}
      <div className="animate-fade-in">
        <div className="bg-white rounded-2xl border border-border p-5 mb-4">
          <h2 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
            {lesson.title}
          </h2>
          <div
            className="prose prose-sm max-w-none text-text-muted leading-relaxed
              [&_h3]:text-text [&_h3]:font-bold [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-2
              [&_h4]:text-text [&_h4]:font-semibold [&_h4]:text-sm [&_h4]:mt-3 [&_h4]:mb-1
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
              [&_li]:text-sm
              [&_p]:text-sm [&_p]:mb-2
              [&_strong]:text-text
              [&_.do]:bg-green-50 [&_.do]:border-l-4 [&_.do]:border-green-500 [&_.do]:p-3 [&_.do]:rounded-r-lg [&_.do]:my-2
              [&_.dont]:bg-red-50 [&_.dont]:border-l-4 [&_.dont]:border-red-500 [&_.dont]:p-3 [&_.dont]:rounded-r-lg [&_.dont]:my-2"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mb-6">
        {!isFirst && (
          <Button variant="outline" onClick={() => goToLesson(currentLesson - 1)} className="flex-1">
            <ArrowLeft size={16} />
            Previous
          </Button>
        )}
        {!isLast ? (
          <Button onClick={() => goToLesson(currentLesson + 1)} className="flex-1">
            Next
            <ArrowRight size={16} />
          </Button>
        ) : (
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 justify-center text-success mb-2">
              <CheckCircle2 size={20} />
              <span className="text-sm font-semibold">Module Complete!</span>
            </div>
            {data.relatedQuiz && (
              <Button onClick={() => router.push(`/student/quiz/${data.relatedQuiz!.id}`)} fullWidth>
                Take Quiz: {data.relatedQuiz.title}
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/student/learn')} fullWidth>
              Back to Modules
            </Button>
          </div>
        )}
      </div>

      {/* Lesson dots */}
      <div className="flex justify-center gap-1.5 mb-4">
        {data.lessons.map((_, i) => (
          <button
            key={i}
            onClick={() => goToLesson(i)}
            className={`w-2 h-2 rounded-full transition-all min-h-[20px] min-w-[20px] flex items-center justify-center ${
              i === currentLesson ? 'bg-primary scale-125' : i <= currentLesson ? 'bg-primary/40' : 'bg-gray-300'
            }`}
          >
            <span className="sr-only">Lesson {i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
