// components/workflow/ProgressBar.tsx
'use client';

import React from 'react';
import type { Milestone } from '@/types/workflow';

interface ProgressBarProps {
  milestones: Milestone[];
  currentStep: number;
  completedSteps: number[];
}

export function ProgressBar({ milestones, currentStep, completedSteps }: ProgressBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200 py-4 px-8 transition-all">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {milestones.map((milestone, index) => (
            <React.Fragment key={milestone.stepNumber}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  completedSteps.includes(milestone.stepNumber)
                    ? 'bg-green-500 text-white'
                    : currentStep === milestone.stepNumber
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {completedSteps.includes(milestone.stepNumber) ? '✓' : milestone.stepNumber}
                </div>
                <span className="text-xs font-semibold text-gray-700 hidden md:block">
                  {milestone.label}
                </span>
              </div>
              {index < milestones.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  completedSteps.includes(milestone.stepNumber)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
