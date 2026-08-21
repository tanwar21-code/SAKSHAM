'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/Input';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface SafetyPlan {
  evacuation_instructions: string; assembly_point: string;
  emergency_exit_information: string; first_aid_location: string;
  additional_information: string;
}

export default function SafetyPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<SafetyPlan>({ evacuation_instructions: '', assembly_point: '', emergency_exit_information: '', first_aid_location: '', additional_information: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/safety-plan').then(r => r.json()).then(d => { if (d.plan) setPlan(d.plan); }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/admin/safety-plan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="max-w-lg mx-auto px-4 pt-6"><div className="h-64 skeleton rounded-2xl" /></div>;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/admin')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold text-text flex items-center gap-2"><Shield size={20} className="text-success" /> Safety Plan</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <Card>
          <Textarea label="Evacuation Instructions" placeholder="Step-by-step evacuation procedure..." value={plan.evacuation_instructions || ''} onChange={e => setPlan({...plan, evacuation_instructions: e.target.value})} rows={4} />
        </Card>
        <Card>
          <Input label="Assembly Point" placeholder="e.g. Main ground, Gate No. 2" value={plan.assembly_point || ''} onChange={e => setPlan({...plan, assembly_point: e.target.value})} />
        </Card>
        <Card>
          <Textarea label="Emergency Exit Information" placeholder="List of emergency exits..." value={plan.emergency_exit_information || ''} onChange={e => setPlan({...plan, emergency_exit_information: e.target.value})} rows={3} />
        </Card>
        <Card>
          <Input label="First Aid Location" placeholder="e.g. Room 105, Ground Floor" value={plan.first_aid_location || ''} onChange={e => setPlan({...plan, first_aid_location: e.target.value})} />
        </Card>
        <Card>
          <Textarea label="Additional Information" placeholder="Any other safety information..." value={plan.additional_information || ''} onChange={e => setPlan({...plan, additional_information: e.target.value})} rows={3} />
        </Card>

        <Button type="submit" fullWidth loading={saving} size="lg">
          <Save size={16} /> {saved ? '✓ Saved!' : 'Save Safety Plan'}
        </Button>
      </form>
    </div>
  );
}
