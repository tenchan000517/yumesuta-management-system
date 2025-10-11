// components/workflow/StepCard.tsx
'use client';

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { WorkflowStep, StepStatus } from '@/types/workflow';

interface StepCardProps {
  step: WorkflowStep;
  status: StepStatus;
  onClick: () => void;
}

export function StepCard({ step, status, onClick }: StepCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all border-2 ${
        status === 'completed'
          ? 'bg-green-50 border-green-200'
          : status === 'in_progress'
          ? 'bg-blue-50 border-blue-500'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {status === 'completed' ? (
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        ) : status === 'in_progress' ? (
          <Circle className="w-6 h-6 text-blue-600 fill-blue-600" />
        ) : (
          <Circle className="w-6 h-6 text-gray-400" />
        )}
        <span className={`text-xs font-bold ${
          status === 'completed' ? 'text-green-600' :
          status === 'in_progress' ? 'text-blue-600' :
          'text-gray-500'
        }`}>
          {status === 'completed' ? '完了' : status === 'in_progress' ? '進行中' : '未着手'}
        </span>
      </div>
      <h3 className={`text-sm font-bold ${
        status === 'pending' ? 'text-gray-700' : 'text-gray-900'
      }`}>
        {step.stepNumber}. {step.title}
      </h3>
    </div>
  );
}
