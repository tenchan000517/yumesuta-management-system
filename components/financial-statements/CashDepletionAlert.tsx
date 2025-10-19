// components/financial-statements/CashDepletionAlert.tsx
'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import type { CashDepletionWarning } from '@/types/financial';

interface CashDepletionAlertProps {
  warning: CashDepletionWarning;
}

export function CashDepletionAlert({ warning }: CashDepletionAlertProps) {
  // 警告レベルに応じたスタイルとアイコンを設定
  const getSeverityConfig = () => {
    switch (warning.severity) {
      case 'danger':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          Icon: AlertTriangle,
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          Icon: AlertCircle,
        };
      case 'caution':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          Icon: Info,
        };
      case 'safe':
      default:
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          Icon: CheckCircle,
        };
    }
  };

  const { bgColor, borderColor, textColor, iconColor, Icon } = getSeverityConfig();

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-6`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor} mb-1`}>
            {warning.willDeplete ? '現金枯渇予測' : '現金状況'}
          </h3>
          <p className={`text-sm ${textColor}`}>{warning.message}</p>

          {warning.willDeplete && warning.depletionMonth && (
            <div className={`mt-2 pt-2 border-t ${borderColor}`}>
              <div className="text-sm">
                <span className={`font-medium ${textColor}`}>枯渇予定月: </span>
                <span className={`${textColor}`}>{warning.depletionMonth}</span>
                {warning.monthsUntilDepletion !== undefined && (
                  <span className={`ml-2 ${textColor}`}>
                    （残り{warning.monthsUntilDepletion}ヶ月）
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
