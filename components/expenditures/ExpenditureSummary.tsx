// components/expenditures/ExpenditureSummary.tsx
'use client';

import React from 'react';
import { TrendingUp, Wallet, AlertCircle } from 'lucide-react';
import type { ExpenditureSummary } from '@/types/financial';

interface ExpenditureSummaryProps {
  summary: ExpenditureSummary | null;
  loading?: boolean;
}

export function ExpenditureSummaryCard({ summary, loading = false }: ExpenditureSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const cards = [
    {
      title: '合計支出',
      value: summary.total.toLocaleString(),
      icon: Wallet,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      title: '経費',
      value: summary.expense.toLocaleString(),
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    {
      title: '給与',
      value: summary.salary.toLocaleString(),
      icon: Wallet,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      title: '固定費',
      value: summary.fixedCost.toLocaleString(),
      icon: TrendingUp,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200',
    },
  ];

  return (
    <div className="mb-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`bg-white border ${card.borderColor} rounded-lg p-6 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">{card.title}</span>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <card.icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${card.textColor}`}>
              {card.value}円
            </div>
          </div>
        ))}
      </div>

      {/* 未清算立替金の警告カード */}
      {summary.unsettledCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              未清算の立替金があります
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              {summary.unsettledCount}件、合計 {summary.unsettledAmount.toLocaleString()}円 の立替金が未清算です。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
