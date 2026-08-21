'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Send } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface ScenarioItem { id: number; title: string; description: string; difficulty: string; is_published: boolean; disaster_name: string; step_count: number; }
interface Disaster { id: number; name: string; icon: string; }
interface ClassItem { id: number; class_name: string; section: string; }
interface DraftStep {
  situation_text: string;
  options: { option_text: string; is_best_choice: boolean; feedback: string; score: number }[];
}

const emptyStep = (): DraftStep => ({
  situation_text: '',
  options: [
    { option_text: '', is_best_choice: true, feedback: 'Best choice.', score: 10 },
    { option_text: '', is_best_choice: false, feedback: 'Not the safest option.', score: 3 },
    { option_text: '', is_best_choice: false, feedback: 'Risky in this situation.', score: 2 },
  ],
});

export default function TeacherScenariosPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [assignId, setAssignId] = useState<number | null>(null);
  const [assignClassId, setAssignClassId] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ disaster_id: '', title: '', description: '', difficulty: 'beginner' });
  const [steps, setSteps] = useState<DraftStep[]>([emptyStep()]);

  const load = () => {
    Promise.all([
      fetch('/api/teacher/scenarios').then(r => r.json()),
      fetch('/api/teacher/classes').then(r => r.json()),
    ]).then(([s, c]) => {
      setScenarios(s.scenarios || []);
      setDisasters(s.disasters || []);
      setClasses(c.classes || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/teacher/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, disaster_id: Number(form.disaster_id), is_published: true, steps }),
    });
    setSaving(false);
    if (res.ok) {
      setShowCreate(false);
      setForm({ disaster_id: '', title: '', description: '', difficulty: 'beginner' });
      setSteps([emptyStep()]);
      load();
    }
  };

  const assign = async () => {
    if (!assignId || !assignClassId) return;
    setSaving(true);
    await fetch('/api/teacher/scenarios/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: assignId, class_id: Number(assignClassId) }),
    });
    setSaving(false);
    setAssignId(null);
    load();
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/teacher')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-text">Scenarios</h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="p-2 rounded-xl bg-primary text-white min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {scenarios.map(s => (
            <Card key={s.id}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text">{s.title}</p>
                  <p className="text-xs text-text-muted">{s.disaster_name} • {s.step_count} steps</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={s.difficulty === 'beginner' ? 'success' : 'warning'}>{s.difficulty}</Badge>
                    <Badge variant={s.is_published ? 'info' : 'neutral'}>{s.is_published ? 'Published' : 'Draft'}</Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAssignId(s.id)} className="!min-h-[40px] !px-3 !text-xs">
                  <Send size={14} /> Assign
                </Button>
              </div>
            </Card>
          ))}
          {scenarios.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-4xl mb-3">🎮</p>
              <p className="text-sm text-text-muted">No scenarios yet.</p>
            </Card>
          )}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Scenario">
        <form onSubmit={createScenario} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <select required value={form.disaster_id} onChange={e => setForm({ ...form, disaster_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-white">
            <option value="">Select disaster</option>
            {disasters.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
          </select>
          <Input label="Title *" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border bg-white">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          {steps.map((step, si) => (
            <div key={si} className="border border-border rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-text-muted">Step {si + 1}</p>
              <Textarea label="Situation" required rows={3} value={step.situation_text} onChange={e => {
                const next = [...steps]; next[si].situation_text = e.target.value; setSteps(next);
              }} />
              {step.options.map((opt, oi) => (
                <div key={oi} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input type="radio" name={`best-${si}`} checked={opt.is_best_choice} onChange={() => {
                      const next = [...steps];
                      next[si].options = next[si].options.map((o, i) => ({ ...o, is_best_choice: i === oi, score: i === oi ? 10 : 3 }));
                      setSteps(next);
                    }} />
                    <input className="flex-1 px-3 py-2 rounded-lg border border-border text-sm" placeholder={`Choice ${oi + 1}`} required value={opt.option_text} onChange={e => {
                      const next = [...steps]; next[si].options[oi].option_text = e.target.value; setSteps(next);
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
          <Button type="button" variant="outline" fullWidth onClick={() => setSteps([...steps, emptyStep()])}>Add step</Button>
          <Button type="submit" fullWidth loading={saving}>Create Scenario</Button>
        </form>
      </Modal>

      <Modal isOpen={assignId !== null} onClose={() => setAssignId(null)} title="Assign to class">
        <div className="space-y-3">
          <select value={assignClassId} onChange={e => setAssignClassId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-white">
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name} - {c.section}</option>)}
          </select>
          <Button fullWidth loading={saving} onClick={assign} disabled={!assignClassId}>Assign Scenario</Button>
        </div>
      </Modal>
    </div>
  );
}
