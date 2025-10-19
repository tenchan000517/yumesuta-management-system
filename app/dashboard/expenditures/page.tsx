// app/dashboard/expenditures/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Plus, Upload, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ExpenditureSummaryCard } from '@/components/expenditures/ExpenditureSummary';
import { ExpenditureTable } from '@/components/expenditures/ExpenditureTable';
import { ExpenditureFormModal } from '@/components/expenditures/ExpenditureFormModal';
import { CSVImportModal } from '@/components/expenditures/CSVImportModal';
import type { Expenditure, ExpenditureSummary } from '@/types/financial';

export default function ExpendituresPage() {
  const router = useRouter();

  // 状態管理
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [summary, setSummary] = useState<ExpenditureSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // フィルター
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  // モーダル状態
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [editData, setEditData] = useState<Expenditure | null>(null);

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchExpenditures();
    fetchSummary();
  }, [selectedYear, selectedMonth]);

  // 支出データ取得
  const fetchExpenditures = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/expenditures/list?year=${selectedYear}&month=${selectedMonth}`
      );
      const result = await response.json();
      if (result.success) {
        setExpenditures(result.data || []);
        updateLastUpdatedTime();
      } else {
        console.error('支出データ取得エラー:', result.error);
      }
    } catch (error) {
      console.error('支出データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // サマリー取得
  const fetchSummary = async () => {
    try {
      const response = await fetch(
        `/api/expenditures/summary?year=${selectedYear}&month=${selectedMonth}`
      );
      const result = await response.json();
      if (result.success) {
        setSummary(result.data);
      } else {
        console.error('サマリー取得エラー:', result.error);
      }
    } catch (error) {
      console.error('サマリー取得エラー:', error);
    }
  };

  // 最終更新時刻を更新
  const updateLastUpdatedTime = () => {
    const now = new Date();
    setLastUpdated(
      `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`
    );
  };

  // 更新ボタン
  const handleRefresh = () => {
    fetchExpenditures();
    fetchSummary();
  };

  // 新規登録
  const handleCreate = () => {
    setEditData(null);
    setIsFormModalOpen(true);
  };

  // 編集
  const handleEdit = (expenditure: Expenditure) => {
    setEditData(expenditure);
    setIsFormModalOpen(true);
  };

  // 削除
  const handleDelete = async (id: number) => {
    const isFixedCost = id < 0;
    const confirmMessage = isFixedCost
      ? 'この固定費を無効化してもよろしいですか？'
      : 'この支出データを削除してもよろしいですか？';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // 固定費（ID < 0）と変動費（ID > 0）でAPIエンドポイントを切り替え
      const endpoint = isFixedCost
        ? `/api/fixed-costs/${Math.abs(id)}`
        : `/api/expenditures/${id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        alert(isFixedCost ? '固定費を無効化しました' : '削除しました');
        handleRefresh();
      } else {
        alert(`削除に失敗しました: ${result.error}`);
      }
    } catch (error) {
      alert('削除中にエラーが発生しました');
      console.error(error);
    }
  };

  // 清算
  const handleSettle = async (id: number) => {
    if (!confirm('この立替金を清算済みにしますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/expenditures/${id}/settle`, {
        method: 'PUT',
      });
      const result = await response.json();
      if (result.success) {
        alert('清算済みにしました');
        handleRefresh();
      } else {
        alert(`清算に失敗しました: ${result.error}`);
      }
    } catch (error) {
      alert('清算中にエラーが発生しました');
      console.error(error);
    }
  };

  // フォーム送信成功
  const handleFormSuccess = () => {
    handleRefresh();
  };

  // CSVインポート成功
  const handleCSVSuccess = () => {
    handleRefresh();
  };

  // 年選択肢（過去3年 + 今年 + 未来2年）
  const years = Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - 3 + i);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">戻る</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Wallet className="w-8 h-8 text-blue-600" />
                支出管理
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                経費・給与・固定費の支出を管理します
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCSVModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
            >
              <Upload className="w-5 h-5" />
              <span className="font-semibold">CSV一括登録</span>
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">新規登録</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-semibold">更新</span>
            </button>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-6">最終更新: {lastUpdated}</p>
        )}

        {/* 年月フィルター */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">表示期間:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month}月
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* サマリーカード */}
        <ExpenditureSummaryCard summary={summary} loading={loading} />

        {/* 支出一覧テーブル */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            支出一覧 ({expenditures.length}件)
          </h2>
          <ExpenditureTable
            expenditures={expenditures}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSettle={handleSettle}
          />
        </div>
      </div>

      {/* 新規登録・編集モーダル */}
      <ExpenditureFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        editData={editData}
      />

      {/* CSV一括登録モーダル */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onSuccess={handleCSVSuccess}
      />
    </div>
  );
}
