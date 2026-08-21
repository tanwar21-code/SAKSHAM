'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Target, AlertTriangle, User } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface BottomNavProps {
  role: 'student' | 'teacher' | 'admin';
}

const studentNav: NavItem[] = [
  { label: 'Home', icon: <Home size={22} />, href: '/student' },
  { label: 'Learn', icon: <BookOpen size={22} />, href: '/student/learn' },
  { label: 'Practice', icon: <Target size={22} />, href: '/student/practice' },
  { label: 'Resources', icon: <AlertTriangle size={22} />, href: '/student/resources' },
  { label: 'Profile', icon: <User size={22} />, href: '/student/profile' },
];

const teacherNav: NavItem[] = [
  { label: 'Home', icon: <Home size={22} />, href: '/teacher' },
  { label: 'Classes', icon: <BookOpen size={22} />, href: '/teacher/classes' },
  { label: 'Quizzes', icon: <Target size={22} />, href: '/teacher/quizzes' },
  { label: 'Scenarios', icon: <User size={22} />, href: '/teacher/scenarios' },
  { label: 'Emergency', icon: <AlertTriangle size={22} />, href: '/emergency' },
];

const adminNav: NavItem[] = [
  { label: 'Home', icon: <Home size={22} />, href: '/admin' },
  { label: 'Resources', icon: <BookOpen size={22} />, href: '/admin/resources' },
  { label: 'Safety', icon: <Target size={22} />, href: '/admin/safety-plan' },
  { label: 'Emergency', icon: <AlertTriangle size={22} />, href: '/emergency' },
];

const navMap = { student: studentNav, teacher: teacherNav, admin: adminNav };

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navMap[role];
  const hideNav = pathname.startsWith('/student/quiz/') || pathname.startsWith('/student/scenario/');
  if (hideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== `/${role}` && pathname.startsWith(item.href));
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`
                flex flex-col items-center justify-center gap-0.5
                w-16 h-full transition-colors duration-200
                min-h-[48px] touch-manipulation
                ${isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text'
                }
              `}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      {/* Safe area spacer */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
