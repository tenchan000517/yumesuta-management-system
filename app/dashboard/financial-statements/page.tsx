// app/dashboard/financial-statements/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PLDisplay } from '@/components/financial-statements/PLDisplay';
import { BSDisplay } from '@/components/financial-statements/BSDisplay';
import { CFDisplay } from '@/components/financial-statements/CFDisplay';
import type { ProfitAndLoss, BalanceSheet, CashFlowStatement } from '@/types/financial';

export default function FinancialStatementsPage() {
  const router = useRouter();

  // 状態管理
  const [plData, setPlData] = useState<ProfitAndLoss | null>(null);
  const [bsData, setBsData] = useState<BalanceSheet | null>(null);
  const [cfData, setCfData] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // フィルター（年月・年次切り替え）
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentDate.getMonth() + 1);
  const [isAnnual, setIsAnnual] = useState(false); // 年次表示フラグ

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchFinancialStatements();
  }, [selectedYear, selectedMonth, isAnnual]);

  // 財務諸表データ取得
  const fetchFinancialStatements = async () => {
    setLoading(true);
    try {
      // 年次・月次に応じてAPIパラメータを変更
      const monthParam = isAnnual ? '' : `&month=${selectedMonth}`;
      const response = await fetch(`/api/financial-statements/all?year=${selectedYear}${monthParam}`);
      const result = await response.json();

      if (result.success) {
        setPlData(result.data.pl || null);
        setBsData(result.data.bs || null);
        setCfData(result.data.cf || null);
        updateLastUpdatedTime();
      } else {
        console.error('財務諸表取得エラー:', result.error);
      }
    } catch (error) {
      console.error('財務諸表取得エラー:', error);
    } finally {
      setLoading(false);
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
    fetchFinancialStatements();
  };

  // 年次・月次切り替え
  const handleToggleAnnual = () => {
    setIsAnnual(!isAnnual);
    if (!isAnnual) {
      setSelectedMonth(null); // 年次表示時は月をnullに
    } else {
      setSelectedMonth(currentDate.getMonth() + 1); // 月次表示時は当月に戻す
    }
  };

  // 年・月の選択肢生成
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">決算書</h1>
                <p className="text-sm text-gray-600">財務3表（P/L・B/S・C/F）</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-600">最終更新: {lastUpdated}</span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
          {/* 年次・月次切り替え */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAnnual}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isAnnual
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              年次
            </button>
            <button
              onClick={handleToggleAnnual}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !isAnnual
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              月次
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* 年選択 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">年:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
          </div>

          {/* 月選択（月次表示時のみ） */}
          {!isAnnual && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">月:</label>
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}月
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 財務諸表表示 */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 損益計算書 */}
        <PLDisplay data={plData} loading={loading} />

        {/* 貸借対照表 */}
        <BSDisplay data={bsData} loading={loading} />

        {/* キャッシュフロー計算書 */}
        <CFDisplay data={cfData} loading={loading} year={selectedYear} month={selectedMonth || undefined} />
      </div>
    </div>
  );
}
