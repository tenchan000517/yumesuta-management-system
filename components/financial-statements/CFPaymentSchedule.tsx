// components/financial-statements/CFPaymentSchedule.tsx
'use client';

import React from 'react';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface PaymentItem {
  date: string;
  itemName: string;
  amount: number;
  paymentMethod: string;
  category: string;
  isPaid: boolean;
}

interface CFPaymentScheduleProps {
  data: PaymentItem[];
}

export function CFPaymentSchedule({ data }: CFPaymentScheduleProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        支払予定データがありません
      </div>
    );
  }

  // カテゴリの日本語ラベル
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      expense: '経費',
      salary: '給与',
      fixed_cost: '固定費',
      revenue: '売上',
    };
    return labels[category] || category;
  };

  // 支払方法の日本語ラベル
  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      company_card: '会社カード',
      reimbursement: '立替',
      bank_transfer: '銀行振込',
      cash: '現金',
      invoice: '請求書',
    };
    return labels[method] || method;
  };

  // 日付が過去かどうか
  const isPastDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // 日付が1週間以内かどうか
  const isWithinWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const weekLater = new Date(today);
    weekLater.setDate(today.getDate() + 7);
    return date >= today && date <= weekLater;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-300">
            <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">支払予定日</th>
            <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">項目名</th>
            <th className="py-3 px-4 text-right text-sm font-bold text-gray-700">金額</th>
            <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">支払方法</th>
            <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">カテゴリ</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const isInflow = item.amount > 0;
            const isLargeAmount = Math.abs(item.amount) >= 100000;
            const past = isPastDate(item.date);
            const soon = isWithinWeek(item.date);

            let bgColor = 'bg-white';
            if (past) {
              bgColor = 'bg-gray-100';
            } else if (soon && !isInflow) {
              bgColor = 'bg-yellow-50';
            } else if (isInflow) {
              bgColor = 'bg-green-50';
            }

            return (
              <tr key={index} className={`border-b border-gray-200 ${bgColor}`}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className={past ? 'text-gray-500 line-through' : 'text-gray-900'}>
                      {item.date}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-900">
                  {item.itemName}
                </td>
                <td className={`py-3 px-4 text-right ${isLargeAmount ? 'font-bold text-lg' : ''}`}>
                  <div className="flex items-center justify-end gap-2">
                    {isInflow ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={isInflow ? 'text-green-700' : 'text-red-700'}>
                      {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}円
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700 text-sm">
                  {getPaymentMethodLabel(item.paymentMethod)}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-block px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">
                    {getCategoryLabel(item.category)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
