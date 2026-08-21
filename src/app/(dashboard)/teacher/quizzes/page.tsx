'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Send } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface QuizItem {
  id: number; title: string; description: string; passing_score: number;
  is_published: boolean; disaster_name: string; question_count: number; assignment_count: number;
}
interface Disaster { id: number; name: string; icon: string; }
interface ClassItem { id: number; class_name: string; section: string; }

interface DraftQuestion {
  question_text: string;
  explanation: string;
  options: { option_text: string; is_correct: boolean }[];
}

const emptyQuestion = (): DraftQuestion => ({
  question_text: '',
  explanation: '',
  options: [
    { option_text: '', is_correct: true },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
  ],
});

export default function TeacherQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [assignQuizId, setAssignQuizId] = useState<number | null>(null);
  const [assignClassId, setAssignClassId] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ disaster_id: '', title: '', description: '', passing_score: '70' });
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);

  const load = () => {
    Promise.all([
      fetch('/api/teacher/quizzes').then(r => r.json()),
      fetch('/api/teacher/classes').then(r => r.json()),
    ]).then(([q, c]) => {
      setQuizzes(q.quizzes || []);
      setDisasters(q.disasters || []);
      setClasses(c.classes || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/teacher/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        disaster_id: Number(form.disaster_id),
        title: form.title,
        description: form.description,
        passing_score: Number(form.passing_score) || 70,
        is_published: true,
        questions,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setShowCreate(false);
      setForm({ disaster_id: '', title: '', description: '', passing_score: '70' });
      setQuestions([emptyQuestion()]);
      load();
    }
  };

  const assignQuiz = async () => {
    if (!assignQuizId || !assignClassId) return;
    setSaving(true);
    await fetch('/api/teacher/quizzes/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: assignQuizId, class_id: Number(assignClassId) }),
    });
    setSaving(false);
    setAssignQuizId(null);
    setAssignClassId('');
    load();
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/teacher')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-text">Quizzes</h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="p-2 rounded-xl bg-primary text-white min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {quizzes.map(q => (
            <Card key={q.id}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">{q.title}</p>
                  <p className="text-xs text-text-muted">{q.disaster_name} • {q.question_count} questions</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={q.is_published ? 'success' : 'neutral'}>{q.is_published ? 'Published' : 'Draft'}</Badge>
                    <Badge variant="info">{q.assignment_count} assigned</Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAssignQuizId(q.id)} className="!min-h-[40px] !px-3 !text-xs">
                  <Send size={14} /> Assign
                </Button>
              </div>
            </Card>
          ))}
          {quizzes.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-sm text-text-muted">No quizzes yet. Create one or run the seed script.</p>
            </Card>
          )}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Quiz">
        <form onSubmit={createQuiz} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Disaster *</label>
            <select required value={form.disaster_id} onChange={e => setForm({ ...form, disaster_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-white">
              <option value="">Select</option>
              {disasters.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
            </select>
          </div>
          <Input label="Title *" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <Input label="Passing score" type="number" value={form.passing_score} onChange={e => setForm({ ...form, passing_score: e.target.value })} />

          {questions.map((q, qi) => (
            <div key={qi} className="border border-border rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-text-muted">Question {qi + 1}</p>
              <Textarea label="Question text" required rows={2} value={q.question_text} onChange={e => {
                const next = [...questions]; next[qi].question_text = e.target.value; setQuestions(next);
              }} />
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input type="radio" name={`correct-${qi}`} checked={opt.is_correct} onChange={() => {
                    const next = [...questions];
                    next[qi].options = next[qi].options.map((o, i) => ({ ...o, is_correct: i === oi }));
                    setQuestions(next);
                  }} />
                  <input className="flex-1 px-3 py-2 rounded-lg border border-border text-sm" placeholder={`Option ${oi + 1}`} value={opt.option_text} onChange={e => {
                    const next = [...questions]; next[qi].options[oi].option_text = e.target.value; setQuestions(next);
                  }} required />
                </div>
              ))}
              <Input label="Explanation" value={q.explanation} onChange={e => {
                const next = [...questions]; next[qi].explanation = e.target.value; setQuestions(next);
              }} />
            </div>
          ))}
          <Button type="button" variant="outline" fullWidth onClick={() => setQuestions([...questions, emptyQuestion()])}>Add question</Button>
          <Button type="submit" fullWidth loading={saving}>Create Quiz</Button>
        </form>
      </Modal>

      <Modal isOpen={assignQuizId !== null} onClose={() => setAssignQuizId(null)} title="Assign to class">
        <div className="space-y-3">
          <select value={assignClassId} onChange={e => setAssignClassId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-white">
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name} - {c.section}</option>)}
          </select>
          {classes.length === 0 && <p className="text-xs text-text-muted">No classes assigned to you yet.</p>}
          <Button fullWidth loading={saving} onClick={assignQuiz} disabled={!assignClassId}>Assign Quiz</Button>
        </div>
      </Modal>
    </div>
  );
}
