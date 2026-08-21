'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, User, BookOpen, Building2, Eye, EyeOff } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import InstitutionSearch from '@/components/InstitutionSearch';

type RegisterRole = 'student' | 'teacher' | 'admin';

const roleTabs: { role: RegisterRole; label: string; icon: React.ReactNode }[] = [
  { role: 'admin', label: 'Institution', icon: <Building2 size={16} /> },
  { role: 'student', label: 'Student', icon: <User size={16} /> },
  { role: 'teacher', label: 'Teacher', icon: <BookOpen size={16} /> },
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<RegisterRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin fields
  const [institutionName, setInstitutionName] = useState('');
  const [institutionEmail, setInstitutionEmail] = useState('');
  const [headName, setHeadName] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');
  const [alternateContact, setAlternateContact] = useState('');
  const [expectedStudentCount, setExpectedStudentCount] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Student fields
  const [studentInstitutionId, setStudentInstitutionId] = useState<number | null>(null);
  const [studentInstitutionName, setStudentInstitutionName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentMobile, setStudentMobile] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Teacher fields
  const [teacherInstitutionId, setTeacherInstitutionId] = useState<number | null>(null);
  const [teacherInstitutionName, setTeacherInstitutionName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherMobile, setTeacherMobile] = useState('');
  const [teacherAlternate, setTeacherAlternate] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let url = '';
      let body = {};

      if (role === 'admin') {
        url = '/api/auth/register/institution';
        body = {
          institution_name: institutionName,
          institution_email: institutionEmail,
          head_name: headName,
          primary_contact: primaryContact,
          alternate_contact: alternateContact,
          expected_student_count: parseInt(expectedStudentCount) || 0,
          password: adminPassword,
        };
      } else if (role === 'student') {
        if (!studentInstitutionId) {
          setError('Please select your institution');
          setLoading(false);
          return;
        }
        url = '/api/auth/register/student';
        body = {
          institution_id: studentInstitutionId,
          roll_number: rollNumber,
          full_name: studentName,
          father_name: fatherName,
          mother_name: motherName,
          email: studentEmail,
          mobile_number: studentMobile,
          parent_mobile_number: parentMobile,
          password: studentPassword,
        };
      } else {
        if (!teacherInstitutionId) {
          setError('Please select your institution');
          setLoading(false);
          return;
        }
        url = '/api/auth/register/teacher';
        body = {
          institution_id: teacherInstitutionId,
          full_name: teacherName,
          primary_email: teacherEmail,
          primary_mobile: teacherMobile,
          alternate_contact: teacherAlternate,
          password: teacherPassword,
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      router.push(data.redirect);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="pt-8 pb-4 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <Shield className="text-primary" size={28} />
          <span className="text-xl font-bold gradient-text">SAKSHAM</span>
        </Link>
        <h1 className="text-2xl font-bold text-text">Create Account</h1>
        <p className="text-sm text-text-muted mt-1">Join the disaster preparedness community</p>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 pb-8">
        {/* Role Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          {roleTabs.map((tab) => (
            <button
              key={tab.role}
              onClick={() => { setRole(tab.role); setError(''); }}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg
                text-sm font-semibold transition-all duration-200 min-h-[44px]
                ${role === tab.role
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-text-muted hover:text-text'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* ===== ADMIN FORM ===== */}
          {role === 'admin' && (
            <>
              <Input label="Institution Name *" placeholder="e.g. Delhi Public School" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} required />
              <Input label="Institution Email *" type="email" placeholder="admin@school.edu.in" value={institutionEmail} onChange={(e) => setInstitutionEmail(e.target.value)} required />
              <Input label="Head of Institution *" placeholder="Full name of the head" value={headName} onChange={(e) => setHeadName(e.target.value)} required />
              <Input label="Primary Contact *" type="tel" placeholder="10-digit mobile number" value={primaryContact} onChange={(e) => setPrimaryContact(e.target.value)} required />
              <Input label="Alternate Contact" type="tel" placeholder="Optional" value={alternateContact} onChange={(e) => setAlternateContact(e.target.value)} />
              <Input label="Expected Student Count" type="number" placeholder="Approximate number of students" value={expectedStudentCount} onChange={(e) => setExpectedStudentCount(e.target.value)} />
              <div className="relative">
                <Input label="Password *" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-text-muted p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </>
          )}

          {/* ===== STUDENT FORM ===== */}
          {role === 'student' && (
            <>
              <InstitutionSearch
                value={studentInstitutionName}
                onSelect={(inst) => {
                  setStudentInstitutionId(inst.id);
                  setStudentInstitutionName(inst.institution_name);
                }}
                error={!studentInstitutionId && error.includes('institution') ? error : undefined}
              />
              <Input label="Roll Number *" placeholder="Your institutional roll number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required />
              <Input label="Full Name *" placeholder="Your full name" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
              <Input label="Father's Name" placeholder="Father's name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
              <Input label="Mother's Name" placeholder="Mother's name" value={motherName} onChange={(e) => setMotherName(e.target.value)} />
              <Input label="Email" type="email" placeholder="Your email (optional)" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} />
              <Input label="Mobile Number" type="tel" placeholder="Your mobile (optional)" value={studentMobile} onChange={(e) => setStudentMobile(e.target.value)} />
              <Input label="Parent Mobile Number" type="tel" placeholder="Parent's mobile (optional)" value={parentMobile} onChange={(e) => setParentMobile(e.target.value)} />
              <div className="relative">
                <Input label="Password *" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-text-muted p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </>
          )}

          {/* ===== TEACHER FORM ===== */}
          {role === 'teacher' && (
            <>
              <InstitutionSearch
                value={teacherInstitutionName}
                onSelect={(inst) => {
                  setTeacherInstitutionId(inst.id);
                  setTeacherInstitutionName(inst.institution_name);
                }}
                error={!teacherInstitutionId && error.includes('institution') ? error : undefined}
              />
              <Input label="Full Name *" placeholder="Your full name" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} required />
              <Input label="Email *" type="email" placeholder="Your email address" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} required />
              <Input label="Mobile Number *" type="tel" placeholder="10-digit mobile number" value={teacherMobile} onChange={(e) => setTeacherMobile(e.target.value)} required />
              <Input label="Alternate Contact" type="tel" placeholder="Optional" value={teacherAlternate} onChange={(e) => setTeacherAlternate(e.target.value)} />
              <div className="relative">
                <Input label="Password *" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-text-muted p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 text-emergency text-sm p-3 rounded-xl border border-red-200 animate-shake">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading} size="lg">
            {role === 'admin' ? 'Register Institution' : `Register as ${role === 'student' ? 'Student' : 'Teacher'}`}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
