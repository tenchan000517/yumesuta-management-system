// app/dashboard/financial-statements/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PLDisplay } from '@/components/financial-statements/PLDisplay';
import { BSDisplay } from '@/components/financial-statements/BSDisplay';
import { CFDisplay } from '@/components/financial-statements/CFDisplay';
import { CashDepletionAlert } from '@/components/financial-statements/CashDepletionAlert';
import { FutureCashFlowPrediction } from '@/components/financial-statements/FutureCashFlowPrediction';
import type { ProfitAndLoss, BalanceSheet, CashFlowStatement, FuturePredictionResponse } from '@/types/financial';

export default function FinancialStatementsPage() {
  const router = useRouter();

  // 状態管理
  const [plData, setPlData] = useState<ProfitAndLoss | null>(null);
  const [bsData, setBsData] = useState<BalanceSheet | null>(null);
  const [cfData, setCfData] = useState<CashFlowStatement | null>(null);
  const [futurePrediction, setFuturePrediction] = useState<FuturePredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [predictionMonths, setPredictionMonths] = useState(6); // 予測期間（デフォルト6ヶ月）

  // フィルター（年月・年次切り替え）
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentDate.getMonth() + 1);
  const [isAnnual, setIsAnnual] = useState(false); // 年次表示フラグ

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchFinancialStatements();
    // 月次表示時のみ未来予測を取得
    if (!isAnnual && selectedMonth !== null) {
      fetchFuturePrediction();
    }
  }, [selectedYear, selectedMonth, isAnnual, predictionMonths]);

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

  // 未来予測データ取得
  const fetchFuturePrediction = async () => {
    if (isAnnual || selectedMonth === null) return;

    setPredictionLoading(true);
    try {
      const response = await fetch(
        `/api/financial-statements/future-prediction?year=${selectedYear}&month=${selectedMonth}&months=${predictionMonths}`
      );
      const result = await response.json();

      if (result.success) {
        setFuturePrediction(result.data || null);
      } else {
        console.error('未来予測取得エラー:', result.error);
      }
    } catch (error) {
      console.error('未来予測取得エラー:', error);
    } finally {
      setPredictionLoading(false);
    }
  };

  // 更新ボタン
  const handleRefresh = () => {
    fetchFinancialStatements();
    if (!isAnnual && selectedMonth !== null) {
      fetchFuturePrediction();
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="mx-auto mb-8 pt-8" style={{ paddingLeft: 'var(--page-padding)', paddingRight: 'var(--page-padding)' }}>
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
      <div className="mx-auto pb-8" style={{ paddingLeft: 'var(--page-padding)', paddingRight: 'var(--page-padding)' }}>
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
          {/* 左カラム: P/L と B/S */}
          <div className="space-y-8">
            {/* 損益計算書 */}
            <PLDisplay data={plData} loading={loading} />

            {/* 貸借対照表 */}
            <BSDisplay data={bsData} loading={loading} />
          </div>

          {/* 右カラム: C/F と 予定キャッシュフロー */}
          <div className="space-y-8">
            {/* キャッシュフロー計算書 */}
            <CFDisplay data={cfData} loading={loading} year={selectedYear} month={selectedMonth || undefined} />

            {/* 予定キャッシュフロー（月次表示時のみ） */}
            {!isAnnual && selectedMonth !== null && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">予定キャッシュフロー</h2>
                    <span className="text-sm text-gray-500">
                      （入金予定から{predictionMonths}ヶ月先まで予測）
                    </span>
                  </div>

                  {/* 予測期間選択 */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">予測期間:</label>
                    <select
                      value={predictionMonths}
                      onChange={(e) => setPredictionMonths(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={3}>3ヶ月</option>
                      <option value={6}>6ヶ月</option>
                      <option value={12}>12ヶ月</option>
                      <option value={24}>24ヶ月</option>
                    </select>
                  </div>
                </div>

                {predictionLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                  </div>
                ) : futurePrediction ? (
                  <div className="space-y-6">
                    {/* 現金枯渇警告 */}
                    <CashDepletionAlert warning={futurePrediction.cashDepletionWarning} />

                    {/* 予測テーブル */}
                    <FutureCashFlowPrediction data={futurePrediction} />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">データがありません</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
