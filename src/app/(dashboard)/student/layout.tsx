import BottomNav from '@/components/BottomNav';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="pb-nav">{children}</div>
      <BottomNav role="student" />
    </div>
  );
}
