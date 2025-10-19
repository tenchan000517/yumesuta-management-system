// components/financial-statements/PLDisplay.tsx
'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ProfitAndLoss } from '@/types/financial';

interface PLDisplayProps {
  data: ProfitAndLoss | null;
  loading?: boolean;
}

export function PLDisplay({ data, loading = false }: PLDisplayProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-500 text-center">データがありません</p>
      </div>
    );
  }

  const rows = [
    // セクション1: 売上総利益（粗利）
    { label: '売上高', value: data.revenue, section: 'revenue', indent: 0 },
    { label: '└ 売上原価（経費）', value: data.costOfSales, section: 'cost', indent: 1 },
    { label: '売上総利益（粗利）', value: data.grossProfit, section: 'gross', indent: 0, isBold: true },

    { type: 'divider' }, // セクション区切り

    // セクション2: 営業利益
    { label: '└ 人件費（給与）', value: data.salaryExpenses, section: 'expense', indent: 1 },
    { label: '└ 固定費', value: data.fixedCosts, section: 'expense', indent: 1 },
    { label: '営業利益', value: data.operatingProfit, section: 'operating', indent: 0, isBold: true },

    { type: 'divider' }, // セクション区切り

    // セクション3: 税引後当期純利益
    { label: '税引前当期純利益', value: data.profitBeforeTax, section: 'beforeTax', indent: 0, isBold: true },
    { label: `└ 法人税等（${(data.effectiveTaxRate * 100).toFixed(0)}%）`, value: data.incomeTax, section: 'tax', indent: 1 },
    { label: '税引後当期純利益', value: data.netProfit, section: 'net', indent: 0, isBold: true, isTotal: true },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
        <h3 className="text-lg font-bold text-blue-900">損益計算書（P/L）</h3>
        <p className="text-sm text-blue-700 mt-1">
          {data.fiscalMonth ? `${data.fiscalMonth} 月次` : `${data.fiscalYear} 年次`}
        </p>
      </div>

      {/* テーブル */}
      <div className="p-6">
        <table className="w-full">
          <tbody>
            {rows.map((row, index) => {
              // 区切り線の処理
              if (row.type === 'divider') {
                return (
                  <tr key={index}>
                    <td colSpan={2} className="py-2">
                      <div className="border-t-2 border-gray-300"></div>
                    </td>
                  </tr>
                );
              }

              const isPositive = row.value >= 0;

              // セクション別の色分け
              let bgColor = 'bg-white';
              let textColor = 'text-gray-900';

              if (row.section === 'revenue') {
                bgColor = 'bg-blue-50';
                textColor = 'text-blue-900';
              } else if (row.section === 'cost') {
                bgColor = 'bg-gray-50';
                textColor = 'text-gray-700';
              } else if (row.section === 'gross') {
                bgColor = 'bg-green-50';
                textColor = 'text-green-800';
              } else if (row.section === 'expense') {
                bgColor = 'bg-gray-50';
                textColor = 'text-gray-700';
              } else if (row.section === 'operating') {
                bgColor = isPositive ? 'bg-green-100' : 'bg-red-100';
                textColor = isPositive ? 'text-green-900' : 'text-red-900';
              } else if (row.section === 'beforeTax') {
                bgColor = 'bg-gray-50';
                textColor = 'text-gray-900';
              } else if (row.section === 'tax') {
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-600';
              } else if (row.section === 'net') {
                bgColor = isPositive ? 'bg-green-200' : 'bg-red-200';
                textColor = isPositive ? 'text-green-900' : 'text-red-900';
              }

              return (
                <tr key={index} className={bgColor}>
                  <td className={`py-3 px-4 ${row.isBold ? 'font-bold' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={textColor}>{row.label}</span>
                      {row.isTotal && (
                        <span className="inline-block ml-2">
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`py-3 px-4 text-right ${row.isBold ? 'font-bold' : ''} ${row.isTotal ? 'text-lg' : ''} ${textColor}`}>
                    {row.value.toLocaleString()}円
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* フッター（生成日時） */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            生成日時: {new Date(data.generatedAt).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>
    </div>
  );
}
