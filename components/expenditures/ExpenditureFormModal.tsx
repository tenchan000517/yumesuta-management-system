// components/expenditures/ExpenditureFormModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Expenditure } from '@/types/financial';

interface ExpenditureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Expenditure | null;
}

export function ExpenditureFormModal({
  isOpen,
  onClose,
  onSuccess,
  editData = null,
}: ExpenditureFormModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    itemName: '',
    amount: '',
    category: 'expense' as 'expense' | 'salary' | 'fixed_cost',
    paymentMethod: 'company_card' as 'company_card' | 'reimbursement' | 'bank_transfer' | 'cash' | 'invoice',
    reimbursedPerson: '',
    settlementStatus: 'none' as 'unsettled' | 'settled' | 'none',
    settlementDate: '',
    notes: '',
    paymentScheduledDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 編集データがある場合はフォームに反映
  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date,
        itemName: editData.itemName,
        amount: editData.amount.toString(),
        category: editData.category,
        paymentMethod: editData.paymentMethod,
        reimbursedPerson: editData.reimbursedPerson || '',
        settlementStatus: editData.settlementStatus,
        settlementDate: editData.settlementDate || '',
        notes: editData.notes || '',
        paymentScheduledDate: editData.paymentScheduledDate || '',
      });
    } else {
      // 新規作成の場合は初期化
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
      setFormData({
        date: today,
        itemName: '',
        amount: '',
        category: 'expense',
        paymentMethod: 'company_card',
        reimbursedPerson: '',
        settlementStatus: 'none',
        settlementDate: '',
        notes: '',
        paymentScheduledDate: '',
      });
    }
  }, [editData, isOpen]);

  // 支払方法変更時の自動調整
  useEffect(() => {
    if (formData.paymentMethod === 'reimbursement') {
      setFormData((prev) => ({ ...prev, settlementStatus: 'unsettled' }));
    } else {
      setFormData((prev) => ({
        ...prev,
        settlementStatus: 'none',
        reimbursedPerson: '',
        settlementDate: '',
      }));
    }
  }, [formData.paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isFixedCost = editData && editData.id < 0;

      // 固定費（ID < 0）と変動費（ID > 0）でAPIエンドポイントを切り替え
      let url: string;
      let method: string;

      if (isFixedCost) {
        // 固定費の場合
        url = `/api/fixed-costs/${Math.abs(editData!.id)}`;
        method = 'PUT';
      } else if (editData) {
        // 変動費の編集
        url = `/api/expenditures/${editData.id}`;
        method = 'PUT';
      } else {
        // 新規作成
        url = '/api/expenditures/create';
        method = 'POST';
      }

      // リクエストボディを準備（固定費の場合は一部フィールドを変換）
      let requestBody: any;
      if (isFixedCost) {
        // 固定費マスタのフィールドに変換
        requestBody = {
          isActive: true, // 編集時は有効として扱う
          itemName: formData.itemName,
          amount: parseInt(formData.amount, 10),
          paymentMethod: formData.paymentMethod === 'reimbursement' ? 'bank_transfer' : formData.paymentMethod,
          paymentDay: 1, // デフォルト値（フォームに追加する必要がある）
          startMonth: formData.date ? formData.date.substring(0, 7).replace('-', '/') : new Date().toISOString().substring(0, 7).replace('-', '/'),
          notes: formData.notes,
        };
      } else {
        // 変動費のフィールド
        requestBody = {
          ...formData,
          amount: parseInt(formData.amount, 10),
        };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || '保存に失敗しました');
      }
    } catch (err) {
      setError('保存中にエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {editData ? '支出編集' : '新規支出登録'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* 日付 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日付 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="YYYY/MM/DD"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 項目名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              項目名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              placeholder="例: デザイン外注、給与10月分、家賃"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 金額 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              金額（円） <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="1"
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as 'expense' | 'salary' | 'fixed_cost',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="expense">経費</option>
              <option value="salary">給与</option>
              <option value="fixed_cost">固定費</option>
            </select>
          </div>

          {/* 支払方法 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支払方法 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentMethod: e.target.value as typeof formData.paymentMethod,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="company_card">会社カード</option>
              <option value="reimbursement">立替</option>
              <option value="bank_transfer">銀行振込</option>
              <option value="cash">現金</option>
              <option value="invoice">請求書</option>
            </select>
          </div>

          {/* 立替者名（立替の場合のみ） */}
          {formData.paymentMethod === 'reimbursement' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                立替者名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reimbursedPerson}
                onChange={(e) =>
                  setFormData({ ...formData, reimbursedPerson: e.target.value })
                }
                placeholder="例: 田中、佐藤"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {/* 支払予定日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支払予定日（C/F計算用）
            </label>
            <input
              type="text"
              value={formData.paymentScheduledDate}
              onChange={(e) =>
                setFormData({ ...formData, paymentScheduledDate: e.target.value })
              }
              placeholder="YYYY/MM/DD"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 備考 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="補足情報があれば記入してください"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* 送信ボタン */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : editData ? '更新' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
