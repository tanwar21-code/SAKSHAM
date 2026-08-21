'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, Shield, Phone, LogOut, ChevronRight } from 'lucide-react';
import Card from '@/components/ui/Card';

interface Institution {
  id: number; institution_name: string; institution_email: string;
  head_name: string; primary_contact: string; expected_student_count: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/institution')
      .then(r => r.json())
      .then(d => {
        setInstitution(d.institution);
        setStudentCount(d.studentCount || 0);
        setTeacherCount(d.teacherCount || 0);
      })
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
        {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl mb-3" />)}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 stagger-children">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-text-muted">Admin Dashboard</p>
          <h1 className="text-xl font-bold text-text">{institution?.institution_name || 'Institution'}</h1>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-gray-100 text-text-muted min-h-[44px] min-w-[44px] flex items-center justify-center">
          <LogOut size={20} />
        </button>
      </div>

      {/* Institution Info */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Building2 size={20} className="text-primary" />
          <h2 className="text-sm font-bold text-text">Institution Information</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Email</span><span className="font-medium text-text">{institution?.institution_email}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Head</span><span className="font-medium text-text">{institution?.head_name}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Contact</span><span className="font-medium text-text">{institution?.primary_contact}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Expected students</span><span className="font-medium text-text">{institution?.expected_student_count}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Registered students</span><span className="font-medium text-text">{studentCount}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Teachers</span><span className="font-medium text-text">{teacherCount}</span></div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Card onClick={() => router.push('/admin/resources')} interactive>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Phone size={20} className="text-emergency" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">Emergency Resources</p>
              <p className="text-xs text-text-muted">Manage contacts & resources</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </div>
        </Card>
        <Card onClick={() => router.push('/admin/safety-plan')} interactive>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Shield size={20} className="text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">Safety Plan</p>
              <p className="text-xs text-text-muted">Evacuation, assembly points</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={20} className="text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">Campus snapshot</p>
              <p className="text-xs text-text-muted">{teacherCount} teachers · {studentCount} students registered</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
