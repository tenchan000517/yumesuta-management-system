// components/financial-statements/CFDailyCashFlow.tsx
'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DailyCashFlowItem {
  date: string;
  cash: number;
  inflow: number;
  outflow: number;
}

interface CFDailyCashFlowProps {
  data: DailyCashFlowItem[];
}

export function CFDailyCashFlow({ data }: CFDailyCashFlowProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        日次キャッシュフローデータがありません
      </div>
    );
  }

  // 最大・最小残高を計算
  const maxCash = Math.max(...data.map(d => d.cash));
  const minCash = Math.min(...data.map(d => d.cash));

  return (
    <div>
      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">期首残高</p>
          <p className="text-2xl font-bold text-blue-900">
            {data[0].cash.toLocaleString()}円
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">最大残高</p>
          <p className="text-2xl font-bold text-green-900">
            {maxCash.toLocaleString()}円
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 mb-1">最小残高</p>
          <p className="text-2xl font-bold text-red-900">
            {minCash.toLocaleString()}円
          </p>
        </div>
      </div>

      {/* 日次テーブル */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0">
            <tr className="border-b-2 border-gray-300">
              <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">日付</th>
              <th className="py-3 px-4 text-right text-sm font-bold text-gray-700">入金</th>
              <th className="py-3 px-4 text-right text-sm font-bold text-gray-700">出金</th>
              <th className="py-3 px-4 text-right text-sm font-bold text-gray-700">純増減</th>
              <th className="py-3 px-4 text-right text-sm font-bold text-gray-700">現金残高</th>
              <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">バー</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const netChange = item.inflow - item.outflow;
              const isPositive = netChange >= 0;
              const hasActivity = item.inflow > 0 || item.outflow > 0;

              // バーチャートの幅計算（最大残高を100%とする）
              const barWidth = maxCash > 0 ? (item.cash / maxCash) * 100 : 0;

              return (
                <tr
                  key={index}
                  className={`border-b border-gray-200 ${hasActivity ? 'bg-yellow-50' : 'bg-white'}`}
                >
                  <td className="py-2 px-4 text-sm text-gray-900">
                    {item.date.split('/').slice(1).join('/')}
                  </td>
                  <td className="py-2 px-4 text-right text-sm">
                    {item.inflow > 0 ? (
                      <span className="text-green-700 font-semibold flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {item.inflow.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right text-sm">
                    {item.outflow > 0 ? (
                      <span className="text-red-700 font-semibold flex items-center justify-end gap-1">
                        <TrendingDown className="w-3 h-3" />
                        {item.outflow.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className={`py-2 px-4 text-right text-sm font-semibold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                    {netChange > 0 ? '+' : ''}{netChange.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-right text-sm font-bold text-gray-900">
                    {item.cash.toLocaleString()}円
                  </td>
                  <td className="py-2 px-4">
                    <div className="w-full bg-gray-200 rounded h-4">
                      <div
                        className={`h-4 rounded ${item.cash >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
