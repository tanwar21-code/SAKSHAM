'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Phone, Link as LinkIcon, FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface Resource { id: number; resource_type: string; title: string; content: string; phone_number: string; url: string; display_order: number; institution_id: number | null; }

export default function AdminResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ resource_type: 'phone', title: '', content: '', phone_number: '', url: '', display_order: '0' });
  const [saving, setSaving] = useState(false);

  const loadResources = () => {
    fetch('/api/admin/emergency-resources').then(r => r.json()).then(d => setResources(d.resources || [])).finally(() => setLoading(false));
  };

  useEffect(() => { loadResources(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/admin/emergency-resources', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, display_order: parseInt(form.display_order) || 0 }),
    });
    setSaving(false); setShowAdd(false);
    setForm({ resource_type: 'phone', title: '', content: '', phone_number: '', url: '', display_order: '0' });
    loadResources();
  };

  const getIcon = (type: string) => {
    if (type === 'phone') return <Phone size={16} className="text-emergency" />;
    if (type === 'link') return <LinkIcon size={16} className="text-secondary" />;
    return <FileText size={16} className="text-text-muted" />;
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="p-2 rounded-xl hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-bold text-text">Emergency Resources</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="p-2 rounded-xl bg-primary text-white min-h-[44px] min-w-[44px] flex items-center justify-center"><Plus size={20} /></button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-2 stagger-children">
          {resources.map(r => (
            <Card key={r.id}>
              <div className="flex items-center gap-3">
                {getIcon(r.resource_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">{r.title}</p>
                  {r.phone_number && <p className="text-xs text-text-muted">📞 {r.phone_number}</p>}
                  {r.content && <p className="text-xs text-text-muted line-clamp-1">{r.content}</p>}
                </div>
                <Badge variant={r.institution_id ? 'info' : 'neutral'}>
                  {r.institution_id ? 'Custom' : 'Global'}
                </Badge>
              </div>
            </Card>
          ))}
          {resources.length === 0 && <p className="text-center text-text-muted py-8">No resources yet. Add your first one!</p>}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Emergency Resource">
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Resource Type</label>
            <select value={form.resource_type} onChange={e => setForm({...form, resource_type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="phone">Phone Number</option>
              <option value="link">Web Link</option>
              <option value="text">Text Information</option>
              <option value="guide">Disaster Guide</option>
            </select>
          </div>
          <Input label="Title *" placeholder="e.g. Police Emergency" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          {form.resource_type === 'phone' && <Input label="Phone Number" type="tel" placeholder="e.g. 100" value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} />}
          {form.resource_type === 'link' && <Input label="URL" type="url" placeholder="https://..." value={form.url} onChange={e => setForm({...form, url: e.target.value})} />}
          <Input label="Description" placeholder="Additional details" value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
          <Input label="Display Order" type="number" value={form.display_order} onChange={e => setForm({...form, display_order: e.target.value})} />
          <Button type="submit" fullWidth loading={saving}>Add Resource</Button>
        </form>
      </Modal>
    </div>
  );
}
