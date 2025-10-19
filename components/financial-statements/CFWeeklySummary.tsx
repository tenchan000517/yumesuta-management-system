// components/financial-statements/CFWeeklySummary.tsx
'use client';

import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface WeeklyItem {
  weekNumber: number;
  weekLabel: string;
  inflow: number;
  outflow: number;
  netCashFlow: number;
  majorEvents: Array<{
    date: string;
    itemName: string;
    amount: number;
  }> | null;
}

interface CFWeeklySummaryProps {
  data: WeeklyItem[];
}

export function CFWeeklySummary({ data }: CFWeeklySummaryProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        週次サマリーデータがありません
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((week) => {
        const isPositive = week.netCashFlow >= 0;
        const hasEvents = week.majorEvents && week.majorEvents.length > 0;

        return (
          <div
            key={week.weekNumber}
            className={`border-2 rounded-lg p-4 ${
              isPositive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            {/* ヘッダー */}
            <h4 className="font-bold text-gray-900 mb-3">{week.weekLabel}</h4>

            {/* サマリー */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">入金:</span>
                <span className="font-semibold text-green-700 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {week.inflow.toLocaleString()}円
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">出金:</span>
                <span className="font-semibold text-red-700 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  {week.outflow.toLocaleString()}円
                </span>
              </div>
              <div className="pt-2 border-t-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">純増減:</span>
                  <span className={`font-bold text-lg ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                    {week.netCashFlow > 0 ? '+' : ''}{week.netCashFlow.toLocaleString()}円
                  </span>
                </div>
              </div>
            </div>

            {/* 主要イベント */}
            {hasEvents ? (
              <div className="pt-3 border-t border-gray-300">
                <h5 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  主要イベント
                </h5>
                <ul className="space-y-1">
                  {week.majorEvents!.map((event, idx) => (
                    <li key={idx} className="text-xs">
                      <span className="text-gray-600">{event.date}</span>
                      <span className="text-gray-900 ml-2">{event.itemName}</span>
                      <span className={`ml-2 font-semibold ${event.amount > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {event.amount > 0 ? '+' : ''}{event.amount.toLocaleString()}円
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-300">
                <p className="text-xs text-gray-500 italic">主要イベントなし</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
