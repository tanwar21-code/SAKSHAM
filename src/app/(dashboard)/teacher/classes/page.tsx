'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Users, Plus } from 'lucide-react';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface Student { student_id: number; full_name: string; roll_number: string; readiness_score: number; readiness_level: string; }
interface ClassItem { id: number; class_name: string; section: string; student_count: number; average_readiness: number; }
interface Disaster { id: number; name: string; }

function ClassesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('id');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrill, setShowDrill] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drill, setDrill] = useState({ title: '', disaster_id: '', instructions: '' });

  useEffect(() => {
    if (!classId) {
      fetch('/api/teacher/classes').then(r => r.json()).then(d => setClasses(d.classes || [])).finally(() => setLoading(false));
      return;
    }
    Promise.all([
      fetch(`/api/teacher/classes/${classId}/students`).then(r => r.json()),
      fetch('/api/teacher/quizzes').then(r => r.json()),
    ]).then(([s, q]) => {
      setStudents(s.students || []);
      setDisasters(q.disasters || []);
    }).finally(() => setLoading(false));
  }, [classId]);

  const createDrill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    setSaving(true);
    await fetch('/api/teacher/drills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_id: Number(classId),
        disaster_id: Number(drill.disaster_id),
        title: drill.title,
        instructions: drill.instructions,
      }),
    });
    setSaving(false);
    setShowDrill(false);
    setDrill({ title: '', disaster_id: '', instructions: '' });
  };

  if (!classId) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/teacher')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-text">Your Classes</h1>
        </div>
        {loading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {classes.map(c => (
              <Card key={c.id} interactive onClick={() => router.push(`/teacher/classes?id=${c.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{c.class_name} - {c.section}</p>
                    <p className="text-xs text-text-muted">{c.student_count} students</p>
                  </div>
                  <p className="text-sm font-bold">{Math.round(c.average_readiness || 0)}%</p>
                </div>
              </Card>
            ))}
            {classes.length === 0 && <p className="text-center text-text-muted py-8">No classes assigned yet.</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/teacher/classes')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <Users size={20} className="text-secondary" /> Class Students
          </h1>
        </div>
        <button onClick={() => setShowDrill(true)} className="p-2 rounded-xl bg-primary text-white min-h-[44px] min-w-[44px] flex items-center justify-center" title="Assign drill">
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-2 stagger-children">
          {students.map(s => (
            <Card key={s.student_id}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {s.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{s.full_name}</p>
                  <p className="text-xs text-text-muted">Roll: {s.roll_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-bold text-text">{s.readiness_score || 0}%</p>
                    <ProgressBar value={s.readiness_score || 0} size="sm" className="w-14" />
                  </div>
                  <Badge variant={
                    s.readiness_level === 'Prepared' ? 'success' :
                    s.readiness_level === 'Improving' ? 'warning' : 'danger'
                  }>
                    {s.readiness_level || 'N/A'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
          {students.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-muted">No students found in this class.</p>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showDrill} onClose={() => setShowDrill(false)} title="Assign Drill">
        <form onSubmit={createDrill} className="space-y-3">
          <Input label="Title *" required value={drill.title} onChange={e => setDrill({ ...drill, title: e.target.value })} placeholder="Earthquake classroom drill" />
          <select required value={drill.disaster_id} onChange={e => setDrill({ ...drill, disaster_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-white">
            <option value="">Select disaster</option>
            {disasters.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <Textarea label="Instructions" rows={3} value={drill.instructions} onChange={e => setDrill({ ...drill, instructions: e.target.value })} />
          <Button type="submit" fullWidth loading={saving}>Create Drill</Button>
        </form>
      </Modal>
    </div>
  );
}

export default function ClassesPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 pt-6"><div className="h-24 skeleton rounded-2xl" /></div>}>
      <ClassesContent />
    </Suspense>
  );
}
