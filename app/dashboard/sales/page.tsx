'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, Calendar, BarChart2, TrendingUp, BookOpen, ArrowLeft, DollarSign, Users } from 'lucide-react';
import type { SalesKPIResponse } from '@/types/sales';

// 転換率カードのレンダリング関数
function renderConversionRateCard(
  title: string,
  data: { actualRate: number; expectedRate: number; gap: number; status: 'ok' | 'warning' }
) {
  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        data.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}
    >
      <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="text-xs text-gray-600 mb-1">実績</p>
          <p className="text-xl font-bold text-blue-600">{data.actualRate}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">想定</p>
          <p className="text-xl font-bold text-gray-700">{data.expectedRate}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">差分</p>
          <p className={`text-xl font-bold ${data.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.gap >= 0 ? '+' : ''}
            {data.gap}%
          </p>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded ${
            data.status === 'ok' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
          }`}
        >
          {data.status === 'ok' ? '✅想定通り' : '⚠想定以下'}
        </span>
      </div>
    </div>
  );
}

export default function SalesDashboardPage() {
  const [kpiData, setKpiData] = useState<SalesKPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sales-kpi');
      const data: SalesKPIResponse = await response.json();

      if (data.success) {
        setKpiData(data);
      } else {
        setError(data.error || '不明なエラーが発生しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !kpiData?.data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold text-lg mb-2">
              エラーが発生しました
            </h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchKPIData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { kpi, magazineDistribution, monthlyPerformance, customerStats, updatedAt } = kpiData.data;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            トップページへ戻る
          </Link>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                営業進捗管理ダッシュボード
              </h1>
              <p className="text-gray-600">
                {kpi.month}月の営業KPI・進捗状況
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <Link href="/">
                <button className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <Home className="w-5 h-5" />
                  ダッシュボード一覧
                </button>
              </Link>
              <button
                onClick={fetchKPIData}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                更新
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            最終更新: {new Date(updatedAt).toLocaleString('ja-JP')}
          </p>
        </div>

        {/* 月次予実サマリー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            月次予実サマリー
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 契約件数 */}
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">契約件数</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">目標:</span>
                  <span className="font-semibold">{monthlyPerformance.contractTarget}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">実績:</span>
                  <span className="font-bold text-blue-600">{monthlyPerformance.contractActual}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">達成率:</span>
                  <span className="font-semibold">
                    {monthlyPerformance.contractTarget > 0
                      ? Math.round((monthlyPerformance.contractActual / monthlyPerformance.contractTarget) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-gray-600">過不足:</span>
                  <span className={`font-bold ${monthlyPerformance.contractGap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlyPerformance.contractGap >= 0 ? '+' : ''}
                    {monthlyPerformance.contractGap}件
                  </span>
                </div>
              </div>
            </div>

            {/* 売上 */}
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">売上</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">目標:</span>
                  <span className="font-semibold">¥{monthlyPerformance.revenueTarget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">実績:</span>
                  <span className="font-bold text-blue-600">¥{monthlyPerformance.revenueActual.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">達成率:</span>
                  <span className="font-semibold">
                    {monthlyPerformance.revenueTarget > 0
                      ? Math.round((monthlyPerformance.revenueActual / monthlyPerformance.revenueTarget) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-gray-600">過不足:</span>
                  <span className={`font-bold ${monthlyPerformance.revenueGap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {monthlyPerformance.revenueGap >= 0 ? '+' : ''}¥{Math.abs(monthlyPerformance.revenueGap).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 入金状況 */}
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">入金状況</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">目標:</span>
                  <span className="font-semibold">¥{monthlyPerformance.paymentTarget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">実績:</span>
                  <span className="font-bold text-blue-600">¥{monthlyPerformance.paymentActual.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">達成率:</span>
                  <span className="font-semibold">
                    {monthlyPerformance.paymentTarget > 0
                      ? Math.round((monthlyPerformance.paymentActual / monthlyPerformance.paymentTarget) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-gray-600">未入金:</span>
                  <span className={`font-bold ${monthlyPerformance.unpaidAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ¥{monthlyPerformance.unpaidAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 営業日の進捗状況 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            営業日の進捗状況
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">今月の営業日数</p>
              <p className="text-3xl font-bold text-gray-900">
                {kpi.totalBusinessDays}日
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">経過営業日数</p>
              <p className="text-3xl font-bold text-blue-600">
                {kpi.elapsedBusinessDays}日
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">進捗率</p>
              <p className="text-3xl font-bold text-green-600">
                {kpi.progressRate}%
              </p>
            </div>
          </div>
        </div>

        {/* 商談予定カレンダー（週別） */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            商談予定カレンダー（{kpi.month}月）
          </h2>

          {/* 週別商談予定 */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-700 mb-3">週別商談予定</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {customerStats.weeklyMeetings.map((week, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    week.count > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className="text-xs text-gray-600 mb-1">{week.weekLabel}</p>
                  <p className={`text-2xl font-bold ${week.count > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {week.count}件
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 報告待ち・ステータス別 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 報告待ち */}
            <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">報告待ち</p>
              <p className="text-3xl font-bold text-yellow-600">{customerStats.awaitingReport}件</p>
              <p className="text-xs text-gray-600 mt-1">過去1ヶ月以内の商談</p>
            </div>

            {/* ステータス別 */}
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">ステータス別件数</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">初回商談待ち:</span>
                  <span className="font-bold text-gray-900">{customerStats.statusCounts.initialMeeting}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">返事待ち:</span>
                  <span className="font-bold text-gray-900">{customerStats.statusCounts.awaitingResponse}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">商談中:</span>
                  <span className="font-bold text-gray-900">{customerStats.statusCounts.inNegotiation}件</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 行動量の日次進捗 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-6 h-6" />
            行動量の日次進捗（今日時点で足りてる？）
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(kpi.metrics).map(([key, metric]) => {
              const labels: Record<string, string> = {
                telAppointments: 'テレアポ件数',
                appointments: 'アポ獲得数',
                meetings: '商談件数',
                closings: 'クロージング数',
                contracts: '契約件数',
              };

              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg border-2 ${
                    metric.status === 'ok'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    {labels[key as keyof typeof labels]}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">月間目標:</span>
                      <span className="font-semibold">{metric.monthlyTarget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">必要:</span>
                      <span className="font-semibold">{metric.requiredToday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">実績:</span>
                      <span className="font-bold text-blue-600">{metric.actual}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-gray-600">過不足:</span>
                      <span
                        className={`font-bold ${
                          metric.gap >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {metric.gap >= 0 ? '+' : ''}
                        {metric.gap}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        metric.status === 'ok'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {metric.status === 'ok' ? '✅順調' : '⚠遅れ'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 転換率の検証 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            転換率の検証（ツールや営業手法に問題ない？）
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* アポ獲得率 */}
            {renderConversionRateCard(
              'アポ獲得率（テレアポ→アポ）',
              kpi.conversionRates.appointmentRate
            )}
            {/* 商談率 */}
            {renderConversionRateCard(
              '商談率（アポ→商談）',
              kpi.conversionRates.meetingRate
            )}
            {/* クロージング率 */}
            {renderConversionRateCard(
              'クロージング率（商談→クロージング）',
              kpi.conversionRates.closingRate
            )}
            {/* 契約率 */}
            {renderConversionRateCard(
              '契約率（クロージング→契約）',
              kpi.conversionRates.contractRate
            )}
          </div>
        </div>

        {/* ゆめマガ配布状況 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            ゆめマガ配布状況
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(magazineDistribution).map(([key, metric]) => {
              const labels: Record<string, string> = {
                availableSchools: '配布可能校',
                distributedSchools: '配布学校数',
                distributedCopies: '配布部数',
              };

              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg border-2 ${
                    metric.status === 'ok'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    {labels[key as keyof typeof labels]}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">目標:</span>
                      <span className="font-semibold">
                        {metric.target.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">実績:</span>
                      <span className="font-bold text-blue-600">
                        {metric.actual.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">達成率:</span>
                      <span className="font-semibold">{metric.achievementRate}%</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-gray-600">過不足:</span>
                      <span
                        className={`font-bold ${
                          metric.gap >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {metric.gap >= 0 ? '+' : ''}
                        {metric.gap.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        metric.status === 'ok'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {metric.status === 'ok' ? '✅順調' : '⚠要対応'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
