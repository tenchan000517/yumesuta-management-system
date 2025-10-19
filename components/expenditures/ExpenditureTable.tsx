// components/expenditures/ExpenditureTable.tsx
'use client';

import React from 'react';
import { Edit, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import type { Expenditure } from '@/types/financial';
import { CategoryLabels, PaymentMethodLabels, SettlementStatusLabels } from '@/types/financial';

interface ExpenditureTableProps {
  expenditures: Expenditure[];
  loading?: boolean;
  onEdit: (expenditure: Expenditure) => void;
  onDelete: (id: number) => void;
  onSettle: (id: number) => void;
}

export function ExpenditureTable({
  expenditures,
  loading = false,
  onEdit,
  onDelete,
  onSettle,
}: ExpenditureTableProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (expenditures.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">表示する支出データがありません</p>
      </div>
    );
  }

  // カテゴリ別の背景色
  const getCategoryBadgeColor = (category: Expenditure['category']) => {
    switch (category) {
      case 'expense':
        return 'bg-blue-100 text-blue-800';
      case 'salary':
        return 'bg-green-100 text-green-800';
      case 'fixed_cost':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 清算ステータス別の背景色
  const getSettlementBadgeColor = (status: Expenditure['settlementStatus']) => {
    switch (status) {
      case 'unsettled':
        return 'bg-yellow-100 text-yellow-800';
      case 'settled':
        return 'bg-green-100 text-green-800';
      case 'none':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                日付
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                項目名
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                金額
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                カテゴリ
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                支払方法
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                立替者
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                清算
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                支払予定日
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenditures.map((expenditure) => (
              <tr key={expenditure.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {expenditure.date}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="max-w-xs">
                    <div className="font-medium">{expenditure.itemName}</div>
                    {expenditure.notes && (
                      <div className="text-xs text-gray-500 mt-1">{expenditure.notes}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold whitespace-nowrap">
                  {expenditure.amount.toLocaleString()}円
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(expenditure.category)}`}
                  >
                    {CategoryLabels[expenditure.category]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {PaymentMethodLabels[expenditure.paymentMethod]}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {expenditure.reimbursedPerson || '-'}
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getSettlementBadgeColor(expenditure.settlementStatus)}`}
                  >
                    {SettlementStatusLabels[expenditure.settlementStatus]}
                  </span>
                  {expenditure.settlementDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      {expenditure.settlementDate}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {expenditure.paymentScheduledDate || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {/* 清算ボタン（立替のみ、固定費以外） */}
                    {expenditure.id > 0 &&
                      expenditure.paymentMethod === 'reimbursement' &&
                      expenditure.settlementStatus === 'unsettled' && (
                        <button
                          onClick={() => onSettle(expenditure.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="清算済みにする"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    {/* 編集ボタン（全支出で表示） */}
                    <button
                      onClick={() => onEdit(expenditure)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="編集"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {/* 削除ボタン（全支出で表示） */}
                    <button
                      onClick={() => onDelete(expenditure.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
