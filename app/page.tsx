'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  Users,
  TrendingUp,
  Share2,
  CheckSquare,
  RefreshCw,
  AlertTriangle,
  Zap,
  ExternalLink,
  Radar,
  AlertCircle,
  Activity,
  Eye,
  Search,
  FileText,
  Brain
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { QuickAccessButton } from '@/types/quick-access';

interface DashboardSummary {
  sales: any | null; // 営業KPI全データ
  yumemaga: {
    currentIssue: string;
    inProgressCount: number;
    delayedCount: number;
  } | null;
  tasks: {
    total: number;
    inProgress: number;
    delayed: number;
    dueTodayCount: number;
    delayedTasks: Array<{ name: string; delayedDays: number }>;
  } | null;
  analytics: {
    monthlyUsers: number;
    searchRankingChange: number;
    kpi?: any;
    ga?: any;
    llm?: any;
    searchEngines?: any;
    keywordRanks?: any[];
  } | null;
  sns: {
    todayScheduled: number;
    overdue: number;
  } | null;
  partners: {
    totalPartners: number;
    totalStars: number;
  } | null;
}

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary>({
    sales: null,
    yumemaga: null,
    tasks: null,
    analytics: null,
    sns: null,
    partners: null,
  });
  const [quickAccessButtons, setQuickAccessButtons] = useState<QuickAccessButton[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardSummary = async () => {
    setLoading(true);
    try {
      // 全APIを並列で取得
      const [salesRes, yumemagaRes, tasksRes, analyticsRes, snsRes, partnersRes, quickAccessRes, keywordRankRes] = await Promise.all([
        fetch('/api/sales-kpi'),
        fetch('/api/process-schedule'),
        fetch('/api/tasks'),
        fetch('/api/analytics'),
        fetch('/api/sns'),
        fetch('/api/partners'),
        fetch('/api/quick-access'),
        fetch('/api/keyword-rank'),
      ]);

      const [salesData, yumemagaData, tasksData, analyticsData, snsData, partnersData, quickAccessData, keywordRankData] = await Promise.all([
        salesRes.json(),
        yumemagaRes.json(),
        tasksRes.json(),
        analyticsRes.json(),
        snsRes.json(),
        partnersRes.json(),
        quickAccessRes.json(),
        keywordRankRes.json(),
      ]);

      // クイックアクセスボタンを設定
      if (quickAccessData.success && quickAccessData.data) {
        setQuickAccessButtons(quickAccessData.data.buttons);
      }

      // サマリーデータを整形
      setSummary({
        sales: salesData.success ? salesData.data : null,
        yumemaga: yumemagaData.success ? {
          currentIssue: yumemagaData.data?.issueNumber || '未設定',
          inProgressCount: yumemagaData.data?.progressSummary?.inProgress || 0,
          delayedCount: yumemagaData.data?.progressSummary?.delayed || 0,
        } : null,
        tasks: tasksData.success ? {
          total: tasksData.data?.allTaskMasters?.length || 0,
          inProgress: tasksData.data?.todayTasks?.length || 0,
          delayed: (tasksData.data?.overdueScheduledTasks?.length || 0) + (tasksData.data?.overdueProjectTasks?.length || 0),
          dueTodayCount: tasksData.data?.todayTasks?.filter((t: any) => t.alert === '本日実施')?.length || 0,
          delayedTasks: [
            ...(tasksData.data?.overdueScheduledTasks || []).slice(0, 2).map((t: any) => ({
              name: t.taskName,
              delayedDays: Math.floor((new Date().getTime() - new Date(t.scheduledDate).getTime()) / (1000 * 60 * 60 * 24))
            })),
            ...(tasksData.data?.overdueProjectTasks || []).slice(0, 1).map((t: any) => ({
              name: t.taskName,
              delayedDays: t.delayDays
            }))
          ],
        } : null,
        analytics: analyticsData.success ? {
          monthlyUsers: analyticsData.data?.googleAnalytics?.metrics?.activeUsers || 0,
          searchRankingChange: 0,
          kpi: analyticsData.data?.kpiMetrics?.kgi || null,
          ga: analyticsData.data?.googleAnalytics?.metrics || null,
          llm: analyticsData.data?.kpiMetrics?.llmStatus || null,
          searchEngines: analyticsData.data?.googleAnalytics?.searchEngineTraffic || null,
          keywordRanks: keywordRankData.success ? (keywordRankData.data || []) : [],
        } : null,
        sns: snsData.success ? {
          todayScheduled: 0, // SNS未実装
          overdue: 0,
        } : null,
        partners: partnersData.success ? {
          totalPartners: partnersData.data?.organizations?.length || 0,
          totalStars: partnersData.data?.stars?.length || 0,
        } : null,
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('ダッシュボードサマリー取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時に自動でデータ取得
  useEffect(() => {
    fetchDashboardSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドメニュー */}
      <aside className="w-64 bg-white shadow-lg flex flex-col h-screen sticky top-0">
        <div className="p-6 flex flex-col h-full">
          <h2 className="text-xl font-bold text-gray-900 mb-6">メニュー</h2>
          <nav className="space-y-2">
            <Link href="/dashboard/sales" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span>営業進捗</span>
            </Link>
            <Link href="/dashboard/yumemaga" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
              <BookOpen className="w-5 h-5" />
              <span>ゆめマガ制作</span>
            </Link>
            <Link href="/dashboard/tasks" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
              <CheckSquare className="w-5 h-5" />
              <span>タスク管理</span>
            </Link>
            <Link href="/dashboard/analytics" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
              <TrendingUp className="w-5 h-5" />
              <span>HP・LLMO分析</span>
            </Link>
            <Link href="/dashboard/sns" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
              <Share2 className="w-5 h-5" />
              <span>SNS投稿</span>
            </Link>
            <Link href="/dashboard/partners" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
              <Users className="w-5 h-5" />
              <span>パートナー・スター</span>
            </Link>
            <Link href="/dashboard/workflow/contract" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
              <FileText className="w-5 h-5" />
              <span>契約業務フロー</span>
            </Link>
          </nav>

          {/* 下部メニュー */}
          <div className="mt-auto pt-6 border-t border-gray-200">
            <Link href="/dashboard/mbti" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors">
              <Brain className="w-5 h-5" />
              <span>MBTI診断結果</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* メインエリア */}
      <main className="flex-1 p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                統合ダッシュボード
              </h1>
              <p className="text-gray-600 mt-1">
                全業務の状況を一目で確認
              </p>
            </div>
            <button
              onClick={fetchDashboardSummary}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">
              最終更新: {lastUpdated.toLocaleString('ja-JP')}
            </p>
          )}

          {/* クイックアクセスエリア */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">クイックアクセス</h2>
              </div>
              <Link
                href="/dashboard/quick-access"
                className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1"
              >
                すべて表示 →
              </Link>
            </div>
            {quickAccessButtons.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {quickAccessButtons.slice(0, 8).map((button, index) => {
                  // アイコン名からlucide-reactのアイコンを取得
                  const IconComponent = button.iconName
                    ? (LucideIcons as any)[button.iconName]
                    : ExternalLink;

                  // 背景色のクラス
                  const bgColorClass = {
                    blue: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
                    green: 'bg-green-100 hover:bg-green-200 text-green-800',
                    orange: 'bg-orange-100 hover:bg-orange-200 text-orange-800',
                    purple: 'bg-purple-100 hover:bg-purple-200 text-purple-800',
                    gray: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
                  }[button.bgColor || 'blue'];

                  return (
                    <button
                      key={index}
                      onClick={() => window.open(button.url, '_blank')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${bgColorClass}`}
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      <span className="font-medium">{button.buttonName}</span>
                    </button>
                  );
                })}
                {quickAccessButtons.length > 8 && (
                  <Link
                    href="/dashboard/quick-access"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    他{quickAccessButtons.length - 8}件を表示 →
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">「更新」ボタンをクリックしてデータを読み込んでください</p>
            )}
          </div>
        </div>

        {/* サマリーグリッド */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左カラム */}
          <div className="space-y-6">
            {/* 営業進捗サマリー */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  営業進捗
                </h3>
                <Link href="/dashboard/sales" className="text-sm text-blue-600 hover:underline">
                  詳細 →
                </Link>
              </div>
              {summary.sales ? (
                <div className="space-y-6">
                  {/* 商談予定カレンダー */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">商談予定カレンダー（{summary.sales.kpi.month}月）</h4>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {summary.sales.customerStats.weeklyMeetings.slice(0, 5).map((week: any, index: number) => (
                        <div key={index} className={`p-3 rounded-lg border-2 ${week.count > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-xs text-gray-600 mb-1">{week.weekLabel}</p>
                          <p className={`text-xl font-bold ${week.count > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{week.count}件</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* 報告待ち */}
                      <div className="p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">報告待ち</p>
                        <p className="text-2xl font-bold text-yellow-600">{summary.sales.customerStats.awaitingReport}件</p>
                      </div>

                      {/* ステータス別 */}
                      <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">ステータス別件数</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">初回商談待ち:</span>
                            <span className="font-bold text-gray-900">{summary.sales.customerStats.statusCounts.initialMeeting}件</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">返事待ち:</span>
                            <span className="font-bold text-gray-900">{summary.sales.customerStats.statusCounts.awaitingResponse}件</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">商談中:</span>
                            <span className="font-bold text-gray-900">{summary.sales.customerStats.statusCounts.inNegotiation}件</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 行動量ステータス */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">行動量の日次進捗（今日時点で足りてる？）</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(summary.sales.kpi.metrics).map(([key, metric]: [string, any]) => {
                        const labels: Record<string, string> = {
                          telAppointments: 'テレアポ件数',
                          appointments: 'アポ獲得数',
                          meetings: '商談件数',
                          closings: 'クロージング数',
                          contracts: '契約件数',
                        };
                        return (
                          <div key={key} className={`p-2 rounded-lg border-2 ${metric.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <p className="text-xs font-semibold text-gray-700 mb-1">{labels[key as keyof typeof labels]}</p>
                            <div className="space-y-0.5 text-xs">
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
                              <div className="flex justify-between border-t pt-0.5">
                                <span className="text-gray-600">過不足:</span>
                                <span className={`font-bold ${metric.gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {metric.gap >= 0 ? '+' : ''}{metric.gap}
                                </span>
                              </div>
                            </div>
                            <div className="mt-1 text-center">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${metric.status === 'ok' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                {metric.status === 'ok' ? '✅順調' : '⚠遅延'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ゆめマガ配布状況 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">ゆめマガ配布状況</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(summary.sales.magazineDistribution).map(([key, metric]: [string, any]) => {
                        const labels: Record<string, string> = {
                          availableSchools: '配布可能校',
                          distributedSchools: '配布学校数',
                          distributedCopies: '配布部数',
                        };
                        return (
                          <div key={key} className={`p-2 rounded-lg border-2 ${metric.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <p className="text-xs font-semibold text-gray-700 mb-1">{labels[key as keyof typeof labels]}</p>
                            <div className="space-y-0.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">目標:</span>
                                <span className="font-semibold">{metric.target.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">実績:</span>
                                <span className="font-bold text-blue-600">{metric.actual.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">達成率:</span>
                                <span className="font-semibold">{metric.achievementRate}%</span>
                              </div>
                              <div className="flex justify-between border-t pt-0.5">
                                <span className="text-gray-600">過不足:</span>
                                <span className={`font-bold ${metric.gap >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {metric.gap >= 0 ? '+' : ''}{metric.gap.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="mt-1 text-center">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${metric.status === 'ok' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                {metric.status === 'ok' ? '✅達成' : '⚠未達'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">データを読み込んでください</p>
              )}
            </div>

            {/* ゆめマガ制作進捗 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  ゆめマガ制作
                </h3>
                <Link href="/dashboard/yumemaga" className="text-sm text-blue-600 hover:underline">
                  詳細 →
                </Link>
              </div>
              {summary.yumemaga ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">制作中</span>
                    <span className="font-semibold">{summary.yumemaga.currentIssue}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">進行中工程</span>
                    <span className="font-semibold">{summary.yumemaga.inProgressCount}件</span>
                  </div>
                  {summary.yumemaga.delayedCount > 0 && (
                    <div className="flex justify-between items-center text-red-600">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        遅延工程
                      </span>
                      <span className="font-semibold">{summary.yumemaga.delayedCount}件</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">データを読み込んでください</p>
              )}
            </div>

            {/* HP・LLMO分析 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  HP・LLMO分析
                </h3>
                <Link href="/dashboard/analytics" className="text-sm text-blue-600 hover:underline">
                  詳細 →
                </Link>
              </div>
              {summary.analytics && summary.analytics.kpi && summary.analytics.ga ? (
                <div className="space-y-6">
                  {/* KGI/KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* セッション数 KGI */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">KGI</p>
                          <p className="text-sm font-medium text-gray-900">セッション数</p>
                        </div>
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>

                      <div className="mb-3">
                        <div className="flex items-baseline gap-2">
                          <p className="text-4xl font-bold text-gray-900">
                            {summary.analytics.kpi.sessions || 0}
                          </p>
                          <span className="text-lg text-gray-500">
                            / {summary.analytics.kpi.targetSessions || 0}
                          </span>
                        </div>
                      </div>

                      {/* プログレスバー */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${(summary.analytics.kpi.sessionAchievementRate || 0) >= 80
                                ? 'bg-green-600'
                                : (summary.analytics.kpi.sessionAchievementRate || 0) >= 50
                                  ? 'bg-blue-600'
                                  : 'bg-red-600'
                                }`}
                              style={{
                                width: `${Math.min(summary.analytics.kpi.sessionAchievementRate || 0, 100)}%`,
                              }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${(summary.analytics.kpi.sessionAchievementRate || 0) >= 80
                            ? 'text-green-600'
                            : (summary.analytics.kpi.sessionAchievementRate || 0) >= 50
                              ? 'text-blue-600'
                              : 'text-red-600'
                            }`}>
                            {(summary.analytics.kpi.sessionAchievementRate || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* ステータス表示 */}
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          🎯 目標まであと: <span className="font-bold text-gray-900">
                            {(summary.analytics.kpi.targetSessions || 0) - (summary.analytics.kpi.sessions || 0)} セッション
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* お問い合わせ数 KPI */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">KPI</p>
                          <p className="text-sm font-medium text-gray-900">お問い合わせ数</p>
                        </div>
                        <AlertCircle className="w-6 h-6 text-green-600" />
                      </div>

                      <div className="mb-3">
                        <div className="flex items-baseline gap-2">
                          <p className="text-4xl font-bold text-gray-900">
                            {summary.analytics.kpi.inquiries || 0}
                          </p>
                          <span className="text-lg text-gray-500">
                            / {summary.analytics.kpi.targetInquiries || 0}
                          </span>
                        </div>
                      </div>

                      {/* プログレスバー */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${(summary.analytics.kpi.inquiryAchievementRate || 0) >= 80
                                ? 'bg-green-600'
                                : (summary.analytics.kpi.inquiryAchievementRate || 0) >= 50
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                                }`}
                              style={{
                                width: `${Math.min(summary.analytics.kpi.inquiryAchievementRate || 0, 100)}%`,
                              }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${(summary.analytics.kpi.inquiryAchievementRate || 0) >= 80
                            ? 'text-green-600'
                            : (summary.analytics.kpi.inquiryAchievementRate || 0) >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                            }`}>
                            {(summary.analytics.kpi.inquiryAchievementRate || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* アラート表示 */}
                      {(summary.analytics.kpi.inquiries || 0) === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="text-xs text-yellow-800">
                            ⚠️ お問い合わせ0件
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            💡 GA4イベント設定を確認してください
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">
                          🎯 目標まであと: <span className="font-bold text-gray-900">
                            {(summary.analytics.kpi.targetInquiries || 0) - (summary.analytics.kpi.inquiries || 0)} 件
                          </span>
                        </div>
                      )}
                    </div>

                    {/* コンバージョン率 KPI */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">KPI</p>
                          <p className="text-sm font-medium text-gray-900">コンバージョン率</p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                      </div>

                      <div className="mb-3">
                        <div className="flex items-baseline gap-2">
                          <p className="text-4xl font-bold text-gray-900">
                            {(summary.analytics.kpi.conversionRate || 0).toFixed(2)}%
                          </p>
                          <span className="text-lg text-gray-500">
                            / {(summary.analytics.kpi.targetConversionRate || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* プログレスバー */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${((summary.analytics.kpi.conversionRate || 0) / (summary.analytics.kpi.targetConversionRate || 1)) * 100 >= 80
                                ? 'bg-green-600'
                                : ((summary.analytics.kpi.conversionRate || 0) / (summary.analytics.kpi.targetConversionRate || 1)) * 100 >= 50
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                                }`}
                              style={{
                                width: `${Math.min(
                                  ((summary.analytics.kpi.conversionRate || 0) / (summary.analytics.kpi.targetConversionRate || 1)) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${((summary.analytics.kpi.conversionRate || 0) / (summary.analytics.kpi.targetConversionRate || 1)) * 100 >= 80
                            ? 'text-green-600'
                            : ((summary.analytics.kpi.conversionRate || 0) / (summary.analytics.kpi.targetConversionRate || 1)) * 100 >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                            }`}>
                            {(((summary.analytics.kpi.conversionRate || 0) / (summary.analytics.kpi.targetConversionRate || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* ステータス表示 */}
                      {(summary.analytics.kpi.conversionRate || 0) === 0 ? (
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs text-red-800">
                            🔴 コンバージョン未発生
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            イベント設定を確認
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">
                          🎯 目標まであと: <span className="font-bold text-gray-900">
                            {((summary.analytics.kpi.targetConversionRate || 0) - (summary.analytics.kpi.conversionRate || 0)).toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* キーワード順位テーブル */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        登録済みキーワード順位
                      </h3>
                    </div>

                    {summary.analytics.keywordRanks && summary.analytics.keywordRanks.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-2 text-left font-medium text-gray-700">
                                キーワード
                              </th>
                              <th className="px-2 py-2 text-center font-medium text-gray-700">
                                Google<br />(PC)
                              </th>
                              <th className="px-2 py-2 text-center font-medium text-gray-700">
                                Google<br />(スマホ)
                              </th>
                              <th className="px-2 py-2 text-center font-medium text-gray-700">
                                Yahoo<br />(PC)
                              </th>
                              <th className="px-2 py-2 text-center font-medium text-gray-700">
                                Yahoo<br />(スマホ)
                              </th>
                              <th className="px-2 py-2 text-center font-medium text-gray-700">
                                Bing<br />(PC)
                              </th>
                              <th className="px-2 py-2 text-center font-medium text-gray-700">
                                Bing<br />(スマホ)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {summary.analytics.keywordRanks
                              .filter((rank: any) =>
                                rank.keyword === '就活情報誌' ||
                                rank.keyword === '高校生 就職情報誌' ||
                                rank.keyword === '東海 高校生 就職'
                              )
                              .map((rank: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-2 py-2 font-medium text-gray-900">
                                  {rank.keyword}
                                </td>
                                {/* Google PC */}
                                <td className="px-2 py-2 text-center">
                                  {rank.googleRank ? (
                                    <span
                                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${rank.googleRank <= 3
                                        ? 'bg-green-100 text-green-800'
                                        : rank.googleRank <= 10
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                      {rank.googleRank}位
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">圏外</span>
                                  )}
                                </td>
                                {/* Google Mobile */}
                                <td className="px-2 py-2 text-center">
                                  {rank.googleMobileRank ? (
                                    <span
                                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${rank.googleMobileRank <= 3
                                        ? 'bg-green-100 text-green-800'
                                        : rank.googleMobileRank <= 10
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                      {rank.googleMobileRank}位
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                  )}
                                </td>
                                {/* Yahoo PC */}
                                <td className="px-2 py-2 text-center">
                                  {rank.yahooRank ? (
                                    <span
                                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${rank.yahooRank <= 3
                                        ? 'bg-green-100 text-green-800'
                                        : rank.yahooRank <= 10
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                      {rank.yahooRank}位
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">圏外</span>
                                  )}
                                </td>
                                {/* Yahoo Mobile */}
                                <td className="px-2 py-2 text-center">
                                  {rank.yahooMobileRank ? (
                                    <span
                                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${rank.yahooMobileRank <= 3
                                        ? 'bg-green-100 text-green-800'
                                        : rank.yahooMobileRank <= 10
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                      {rank.yahooMobileRank}位
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                  )}
                                </td>
                                {/* Bing PC */}
                                <td className="px-2 py-2 text-center">
                                  {rank.bingRank ? (
                                    <span
                                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${rank.bingRank <= 3
                                        ? 'bg-green-100 text-green-800'
                                        : rank.bingRank <= 10
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                      {rank.bingRank}位
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">圏外</span>
                                  )}
                                </td>
                                {/* Bing Mobile */}
                                <td className="px-2 py-2 text-center">
                                  {rank.bingMobileRank ? (
                                    <span
                                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${rank.bingMobileRank <= 3
                                        ? 'bg-green-100 text-green-800'
                                        : rank.bingMobileRank <= 10
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                      {rank.bingMobileRank}位
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {summary.analytics.keywordRanks.length > 0 && summary.analytics.keywordRanks[0].updatedAt && (
                          <p className="text-xs text-gray-500 mt-3 text-right">
                            最終更新: {new Date(summary.analytics.keywordRanks[0].updatedAt).toLocaleString('ja-JP')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">まだデータがありません</p>
                      </div>
                    )}
                  </div>

                  {/* GA Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">アクティブユーザー</p>
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.analytics.ga.activeUsers || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">セッション数</p>
                        <Activity className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.analytics.ga.sessions || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">ページビュー</p>
                        <Eye className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.analytics.ga.screenPageViews || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">平均セッション時間</p>
                        <Activity className="w-5 h-5 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.floor((summary.analytics.ga.averageSessionDuration || 0) / 60)}分{Math.floor((summary.analytics.ga.averageSessionDuration || 0) % 60)}秒
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">直帰率</p>
                        <TrendingUp className="w-5 h-5 text-red-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {(summary.analytics.ga.bounceRate || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* LLMO Traffic Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      LLMO対策・流入分析
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* LLM Traffic */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm p-6 border-2 border-purple-200">
                        <h4 className="text-sm font-semibold text-purple-900 mb-3">
                          LLM経由の流入
                        </h4>
                        <div className="flex items-baseline gap-3 mb-4">
                          <p className="text-4xl font-bold text-purple-600">
                            {summary.analytics.llm?.totalSessions || 0}
                          </p>
                          <span className="text-sm text-gray-600">セッション</span>
                        </div>
                        {summary.analytics.llm && (summary.analytics.llm.totalSessions || 0) > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-purple-900 mb-1">内訳:</p>
                            <div className="flex justify-between items-center text-sm bg-white/50 rounded px-2 py-1">
                              <span className="text-gray-700">perplexity.ai</span>
                              <span className="font-semibold text-purple-700">{summary.analytics.llm.perplexitySessions || 0}件</span>
                            </div>
                            {(summary.analytics.llm.chatGPTSessions || 0) > 0 && (
                              <div className="flex justify-between items-center text-sm bg-white/50 rounded px-2 py-1">
                                <span className="text-gray-700">ChatGPT</span>
                                <span className="font-semibold text-purple-700">{summary.analytics.llm.chatGPTSessions}件</span>
                              </div>
                            )}
                            {(summary.analytics.llm.geminiSessions || 0) > 0 && (
                              <div className="flex justify-between items-center text-sm bg-white/50 rounded px-2 py-1">
                                <span className="text-gray-700">Gemini</span>
                                <span className="font-semibold text-purple-700">{summary.analytics.llm.geminiSessions}件</span>
                              </div>
                            )}
                            {(summary.analytics.llm.claudeSessions || 0) > 0 && (
                              <div className="flex justify-between items-center text-sm bg-white/50 rounded px-2 py-1">
                                <span className="text-gray-700">Claude</span>
                                <span className="font-semibold text-purple-700">{summary.analytics.llm.claudeSessions}件</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-purple-700 bg-white/50 rounded px-3 py-2">
                            <p className="font-medium">✨ 測定準備完了</p>
                            <p className="text-xs mt-1 text-gray-600">
                              ChatGPT、Perplexity、Gemini等からの流入を監視中
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Search Engine Traffic */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-6 border-2 border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3">
                          検索エンジン別流入
                        </h4>
                        <div className="flex items-baseline gap-3 mb-4">
                          <p className="text-4xl font-bold text-blue-600">
                            {summary.analytics.searchEngines?.total || 0}
                          </p>
                          <span className="text-sm text-gray-600">セッション</span>
                        </div>
                        {summary.analytics && summary.analytics.searchEngines && summary.analytics.searchEngines.breakdown && summary.analytics.searchEngines.breakdown.length > 0 ? (
                          <div className="space-y-2">
                            {summary.analytics.searchEngines.breakdown.map((engine: any, index: number) => {
                              const total = summary.analytics?.searchEngines?.total || 1;
                              const percent = ((engine.sessions / total) * 100).toFixed(1);
                              return (
                                <div key={index} className="space-y-1">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 capitalize">{engine.source}</span>
                                    <span className="font-semibold text-blue-700">
                                      {engine.sessions}件 ({percent}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-white/50 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">データがありません</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">データを読み込んでください</p>
              )}
            </div>
          </div>

          {/* 右カラム */}
          <div className="space-y-6">
            {/* タスク管理 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  タスク管理
                </h3>
                <Link href="/dashboard/tasks" className="text-sm text-blue-600 hover:underline">
                  詳細 →
                </Link>
              </div>
              {summary.tasks ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">進行中</span>
                    <span className="font-semibold">{summary.tasks.inProgress}件</span>
                  </div>
                  {summary.tasks.delayed > 0 && (
                    <div className="flex justify-between items-center text-red-600">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        遅延
                      </span>
                      <span className="font-semibold">{summary.tasks.delayed}件</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">今日期限</span>
                    <span className="font-semibold">{summary.tasks.dueTodayCount}件</span>
                  </div>

                  {summary.tasks.delayedTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">遅延タスク</h4>
                      <div className="space-y-1">
                        {summary.tasks.delayedTasks.map((task, idx) => (
                          <div key={idx} className="text-sm text-red-600">
                            • {task.name} ({task.delayedDays}日遅延)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">データを読み込んでください</p>
              )}
            </div>

            {/* SNS投稿 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-blue-600" />
                  SNS投稿
                </h3>
                <Link href="/dashboard/sns" className="text-sm text-blue-600 hover:underline">
                  詳細 →
                </Link>
              </div>
              {summary.sns ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">今日の予定</span>
                    <span className="font-semibold">{summary.sns.todayScheduled}件</span>
                  </div>
                  {summary.sns.overdue > 0 && (
                    <div className="flex justify-between items-center text-red-600">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        期限切れ
                      </span>
                      <span className="font-semibold">{summary.sns.overdue}件</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">データを読み込んでください</p>
              )}
            </div>
          </div>
        </div>

        {/* パートナー・スター（最下部） */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                パートナー・スター
              </h3>
              <Link href="/dashboard/partners" className="text-sm text-blue-600 hover:underline">
                詳細 →
              </Link>
            </div>
            {summary.partners ? (
              <div className="flex gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">パートナー企業:</span>
                  <span className="font-semibold">{summary.partners.totalPartners}社</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">スター紹介:</span>
                  <span className="font-semibold">{summary.partners.totalStars}名</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">データを読み込んでください</p>
            )}
          </div>
        </div>

        {/* 競合分析 */}
        <div className="mt-6">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Radar className="w-5 h-5 text-orange-600" />
                競合分析
              </h3>
              <Link href="/dashboard/competitive-analysis" className="text-sm text-orange-600 hover:underline font-medium">
                詳細 →
              </Link>
            </div>
            <p className="text-gray-600 text-sm">競合企業のHP・SNS等の情報を一元管理</p>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          マネージャー1名が全業務を統括できる運営体制を実現
        </div>
      </main>
    </div>
  );
}
