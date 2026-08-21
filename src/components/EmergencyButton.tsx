'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

export default function EmergencyButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/emergency')}
      className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full
        bg-emergency text-white shadow-lg
        flex items-center justify-center
        animate-pulse-glow touch-manipulation
        active:scale-95 transition-transform"
      aria-label="Emergency Mode"
    >
      <AlertTriangle size={24} />
    </button>
  );
}
