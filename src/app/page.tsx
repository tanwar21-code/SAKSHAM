import Link from 'next/link';
import { Shield, BookOpen, Target, AlertTriangle, ChevronRight, Zap, Users, Award } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="text-primary" size={24} />
            <span className="font-bold text-lg gradient-text">SAKSHAM</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-xl transition-colors min-h-[44px] flex items-center"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors min-h-[44px] flex items-center"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* Hero Section */}
        <section className="pt-8 pb-6 text-center stagger-children">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            <Zap size={14} />
            Disaster Readiness Platform
          </div>
          <h1 className="text-3xl font-extrabold text-text leading-tight mb-3">
            Be Prepared.<br />
            <span className="gradient-text">Stay Safe.</span><br />
            Save Lives.
          </h1>
          <p className="text-base text-text-muted leading-relaxed mb-6">
            SAKSHAM empowers students with life-saving disaster preparedness knowledge
            through interactive learning and realistic simulations.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/register"
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl text-center hover:bg-primary-dark transition-colors shadow-sm min-h-[48px] flex items-center justify-center"
            >
              Get Started Free
            </Link>
            <Link
              href="/emergency"
              className="w-full py-3.5 bg-emergency text-white font-semibold rounded-xl text-center hover:bg-emergency-dark transition-colors shadow-sm min-h-[48px] flex items-center justify-center gap-2"
            >
              <AlertTriangle size={18} />
              Emergency Mode
            </Link>
          </div>
        </section>

        {/* What is SAKSHAM */}
        <section className="py-6">
          <h2 className="text-xl font-bold text-text mb-4">What is SAKSHAM?</h2>
          <div className="bg-white rounded-2xl border border-border p-4">
            <p className="text-sm text-text-muted leading-relaxed">
              SAKSHAM is a comprehensive disaster readiness and response education system
              designed for schools and institutions. It teaches students how to prepare for,
              respond to, and recover from natural disasters through interactive modules,
              realistic scenario simulations, and personalized readiness assessments.
            </p>
          </div>
        </section>

        {/* Why it matters */}
        <section className="py-6">
          <h2 className="text-xl font-bold text-text mb-4">Why It Matters</h2>
          <div className="space-y-3 stagger-children">
            {[
              { icon: '🌍', title: 'India faces 27+ types of disasters', desc: 'From earthquakes to floods, cyclones to landslides' },
              { icon: '📚', title: '85% students lack preparedness training', desc: 'Schools rarely teach practical disaster response skills' },
              { icon: '⏱️', title: 'First 72 hours are critical', desc: 'Knowing what to do can save your life and others around you' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-4 flex items-start gap-3">
                <span className="text-2xl mt-0.5 shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-text text-sm">{item.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-6">
          <h2 className="text-xl font-bold text-text mb-4">How It Works</h2>
          <div className="space-y-4 stagger-children">
            {[
              { step: '01', icon: <BookOpen size={20} />, title: 'Learn', desc: 'Study disaster preparedness through interactive lessons and visual guides', color: 'bg-blue-50 text-blue-600' },
              { step: '02', icon: <Target size={20} />, title: 'Practice', desc: 'Test your knowledge with quizzes and immersive scenario simulations', color: 'bg-amber-50 text-amber-600' },
              { step: '03', icon: <Award size={20} />, title: 'Track Progress', desc: 'Monitor your SAKSHAM Readiness Score and improve weak areas', color: 'bg-green-50 text-green-600' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-border p-4 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-text-muted">STEP {item.step}</span>
                  </div>
                  <h3 className="font-semibold text-text text-sm">{item.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="text-text-muted mt-2 shrink-0" />
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-6">
          <h2 className="text-xl font-bold text-text mb-4">Key Features</h2>
          <div className="grid grid-cols-2 gap-3 stagger-children">
            {[
              { icon: '📖', title: 'Learning Modules', desc: 'Earthquake, Flood, Fire' },
              { icon: '🎮', title: 'Scenario Simulator', desc: 'Make real-time decisions' },
              { icon: '📊', title: 'Readiness Score', desc: 'Track your preparedness' },
              { icon: '🚨', title: 'Emergency Mode', desc: 'Critical info, one tap' },
              { icon: '👩‍🏫', title: 'Teacher Dashboard', desc: 'Monitor & assign' },
              { icon: '📱', title: 'Works Offline', desc: 'PWA with cached guides' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border p-3 text-center">
                <span className="text-2xl block mb-2">{item.icon}</span>
                <h3 className="font-semibold text-text text-xs">{item.title}</h3>
                <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section className="py-6">
          <h2 className="text-xl font-bold text-text mb-4">For Everyone</h2>
          <div className="space-y-3 stagger-children">
            {[
              { icon: <Users size={20} />, role: 'Students', desc: 'Learn, practice, and track your disaster preparedness', color: 'bg-blue-500' },
              { icon: <BookOpen size={20} />, role: 'Teachers', desc: 'Create quizzes, assign drills, monitor class performance', color: 'bg-green-500' },
              { icon: <Shield size={20} />, role: 'Admins', desc: 'Manage institution safety resources and emergency plans', color: 'bg-purple-500' },
            ].map((item) => (
              <div key={item.role} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${item.color} text-white flex items-center justify-center shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text text-sm">{item.role}</h3>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-8 text-center">
          <div className="bg-gradient-to-br from-primary/10 to-emergency/10 rounded-2xl p-6 border border-primary/20">
            <h2 className="text-lg font-bold text-text mb-2">
              Ready to be prepared?
            </h2>
            <p className="text-sm text-text-muted mb-4">
              Join SAKSHAM and equip yourself with life-saving skills.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors min-h-[48px]"
            >
              Start Learning Now
              <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="text-primary" size={18} />
            <span className="font-bold text-sm gradient-text">SAKSHAM</span>
          </div>
          <p className="text-xs text-text-muted">
            Disaster Readiness & Response Education System
          </p>
          <p className="text-xs text-text-muted mt-1">
            © 2026 SAKSHAM. Built for a safer tomorrow.
          </p>
        </footer>
      </main>
    </div>
  );
}
