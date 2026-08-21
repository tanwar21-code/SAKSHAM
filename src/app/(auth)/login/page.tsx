'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, User, BookOpen, Building2, Eye, EyeOff } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import InstitutionSearch from '@/components/InstitutionSearch';

type LoginRole = 'student' | 'teacher' | 'admin';

const roleTabs: { role: LoginRole; label: string; icon: React.ReactNode }[] = [
  { role: 'student', label: 'Student', icon: <User size={16} /> },
  { role: 'teacher', label: 'Teacher', icon: <BookOpen size={16} /> },
  { role: 'admin', label: 'Admin', icon: <Building2 size={16} /> },
];

const placeholders: Record<LoginRole, string> = {
  student: 'Enter your Roll Number',
  teacher: 'Email or Mobile Number',
  admin: 'Institution Name, Email, or Contact',
};

const identifierLabels: Record<LoginRole, string> = {
  student: 'Roll Number',
  teacher: 'Email or Mobile Number',
  admin: 'Institution Identifier',
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
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
      <div className="pt-8 pb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <Shield className="text-primary" size={28} />
          <span className="text-xl font-bold gradient-text">SAKSHAM</span>
        </Link>
        <h1 className="text-2xl font-bold text-text">Welcome back</h1>
        <p className="text-sm text-text-muted mt-1">Sign in to continue your journey</p>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 pb-8">
        {/* Role Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {roleTabs.map((tab) => (
            <button
              key={tab.role}
              onClick={() => { setRole(tab.role); setError(''); setIdentifier(''); }}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'admin' ? (
            <InstitutionSearch
              value={identifier}
              onSelect={(inst) => setIdentifier(inst.institution_name)}
              onQueryChange={setIdentifier}
            />
          ) : (
            <Input
              label={identifierLabels[role]}
              placeholder={placeholders[role]}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete={role === 'student' ? 'username' : 'email'}
            />
          )}

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-text-muted p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-emergency text-sm p-3 rounded-xl border border-red-200 animate-shake">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading} size="lg">
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-muted">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
