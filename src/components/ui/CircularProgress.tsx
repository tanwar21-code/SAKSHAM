'use client';
import React, { useEffect, useState } from 'react';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

function getColor(value: number): string {
  if (value >= 80) return '#10B981';
  if (value >= 60) return '#F59E0B';
  return '#EF4444';
}

function getLevel(value: number): string {
  if (value >= 80) return 'Prepared';
  if (value >= 60) return 'Improving';
  return 'Needs Practice';
}

export default function CircularProgress({
  value,
  size = 140,
  strokeWidth = 10,
  className = '',
  label = 'Readiness Score',
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;
  const color = getColor(value);
  const level = getLevel(value);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-circle"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {Math.round(animatedValue)}%
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-text-muted mt-2">{label}</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color }}>
        {level}
      </p>
    </div>
  );
}
