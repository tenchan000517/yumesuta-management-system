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
  Brain,
  Menu,
  X,
  Wallet
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { QuickAccessButton } from '@/types/quick-access';

interface DashboardSummary {
  sales: any | null; // 営業KPI全データ
  yumemaga: {
    currentIssue: string;
    totalProcesses: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    delayed: number;
    progressRate: number;
    delayedProcesses: Array<{ name: string; delayedDays: number }>;
    categoryProgress: Array<{ id: string; name: string; progress: number }>;
    nextMilestones: Array<{ name: string; plannedDate: string; daysUntil: number }>;
    publishDate?: string;
    daysUntilPublish?: number;
    nextMonthProgress?: { completed: number; total: number; progressRate: number };
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
  contract: {
    paymentOverdue: number;      // 入金遅延
    newContractRequired: number; // 新規契約必要
    contractExpiryNear: number;  // 契約満了近い
    paymentPending: number;      // 入金待ち
    inProgress: number;          // 進行中（合計）
    inProgressByStep: Array<{    // 進行中の内訳（ステップ別）
      stepNumber: number;
      stepTitle: string;
      count: number;
    }>;
    inProgressContracts: Array<{ // 進行中の企業一覧
      companyName: string;
      contractId: number;
      nextStep: number;
      nextStepTitle: string;
    }>;
    completed: number;           // 完了
  } | null;
  financial: {
    revenue: number;             // 売上高
    operatingProfit: number;     // 営業利益
    netProfit: number;           // 純利益
    operatingCashFlow: number;   // 営業CF
    cashAtEnd: number;           // 期末現金残高
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
    contract: null,
    financial: null,
  });
  const [quickAccessButtons, setQuickAccessButtons] = useState<QuickAccessButton[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedContractCompany, setSelectedContractCompany] = useState<string | null>(null);
  const [showAllContracts, setShowAllContracts] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMetadata, setCategoryMetadata] = useState<any[]>([]); // カテゴリマスター

  // カテゴリマスター取得
  useEffect(() => {
    const fetchCategoryMetadata = async () => {
      try {
        const res = await fetch('/api/yumemaga-v2/categories');
        const data = await res.json();
        if (data.success) {
          setCategoryMetadata(data.categories);
        }
      } catch (error) {
        console.error('カテゴリマスター取得エラー:', error);
      }
    };
    fetchCategoryMetadata();
  }, []);

  const fetchDashboardSummary = async () => {
    setLoading(true);
    try {
      // カテゴリマスターを先に取得（カテゴリ名表示に必要）
      let localCategoryMetadata = categoryMetadata;
      if (localCategoryMetadata.length === 0) {
        try {
          const categoryRes = await fetch('/api/yumemaga-v2/categories');
          const categoryData = await categoryRes.json();
          if (categoryData.success) {
            localCategoryMetadata = categoryData.categories;
            setCategoryMetadata(categoryData.categories);
          }
        } catch (error) {
          console.error('カテゴリマスター取得エラー:', error);
        }
      }

      // 全APIを並列で取得
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const [salesRes, yumemagaRes, yumemagaProgressRes, yumemagaNextMonthRes, tasksRes, analyticsRes, snsRes, partnersRes, quickAccessRes, keywordRankRes, contractRes, financialRes] = await Promise.all([
        fetch('/api/sales-kpi'),
        fetch('/api/process-schedule'),
        fetch('/api/yumemaga-v2/progress?issue=2025年11月号'),
        fetch('/api/yumemaga-v2/next-month?currentIssue=2025年11月号'),
        fetch('/api/tasks'),
        fetch('/api/analytics'),
        fetch('/api/sns'),
        fetch('/api/partners'),
        fetch('/api/quick-access'),
        fetch('/api/keyword-rank'),
        fetch('/api/contract/reminders'),
        fetch(`/api/financial-statements/all?year=${currentYear}&month=${currentMonth}`),
      ]);

      const [salesData, yumemagaData, yumemagaProgressData, yumemagaNextMonthData, tasksData, analyticsData, snsData, partnersData, quickAccessData, keywordRankData, contractData, financialData] = await Promise.all([
        salesRes.json(),
        yumemagaRes.json(),
        yumemagaProgressRes.json(),
        yumemagaNextMonthRes.json(),
        tasksRes.json(),
        analyticsRes.json(),
        snsRes.json(),
        partnersRes.json(),
        quickAccessRes.json(),
        keywordRankRes.json(),
        contractRes.json(),
        financialRes.json(),
      ]);

      // クイックアクセスボタンを設定
      if (quickAccessData.success && quickAccessData.data) {
        setQuickAccessButtons(quickAccessData.data.buttons);
      }

      // 契約サマリーを生成
      let contractSummary: DashboardSummary['contract'] = null;
      if (contractData.success && contractData.reminders) {
        const reminders = contractData.reminders;

        // リマインダーを種類別に集計
        const paymentOverdue = reminders.filter((r: any) => r.type === 'payment-overdue').length;
        const newContractRequired = reminders.filter((r: any) => r.type === 'new-contract-required').length;
        const contractExpiryNear = reminders.filter((r: any) => r.type === 'contract-expiry-near').length;
        const paymentPending = reminders.filter((r: any) => r.type === 'payment-pending').length;
        const inProgressReminders = reminders.filter((r: any) => r.type === 'in-progress');
        const completed = reminders.filter((r: any) => r.type === 'completed').length;

        // 進行中の内訳（ステップ別に集計）
        const stepCountMap: Record<number, { count: number; title: string }> = {};
        inProgressReminders.forEach((r: any) => {
          if (r.nextStep) {
            if (!stepCountMap[r.nextStep]) {
              stepCountMap[r.nextStep] = { count: 0, title: r.nextStepTitle || `ステップ${r.nextStep}` };
            }
            stepCountMap[r.nextStep].count++;
          }
        });

        const inProgressByStep = Object.entries(stepCountMap)
          .map(([stepNumber, data]) => ({
            stepNumber: parseInt(stepNumber),
            stepTitle: data.title,
            count: data.count
          }))
          .sort((a, b) => a.stepNumber - b.stepNumber);

        // 進行中の企業一覧（ステップ番号順にソート）
        const inProgressContracts = inProgressReminders
          .map((r: any) => ({
            companyName: r.companyName,
            contractId: r.contractId,
            nextStep: r.nextStep || 1,
            nextStepTitle: r.nextStepTitle || 'ステップ1'
          }))
          .sort((a: any, b: any) => a.nextStep - b.nextStep);

        contractSummary = {
          paymentOverdue,
          newContractRequired,
          contractExpiryNear,
          paymentPending,
          inProgress: inProgressReminders.length,
          inProgressByStep,
          inProgressContracts,
          completed
        };
      }

      // ゆめマガデータの詳細集計
      let yumemagaSummary = null;
      if (yumemagaData.success && yumemagaData.ganttData && yumemagaData.progressData) {
        const progressData = yumemagaData.progressData;
        const total = progressData.length;
        const completed = progressData.filter((p: any) => p.status === 'completed').length;
        const inProgress = progressData.filter((p: any) => p.status === 'in_progress').length;
        const notStarted = progressData.filter((p: any) => p.status === 'not_started').length;
        const delayed = progressData.filter((p: any) => p.status === 'delayed').length;

        // 99%問題の修正：分子が分母と等しい場合は100%にする
        let progressRate = 0;
        if (total > 0) {
          progressRate = completed === total ? 100 : Math.round((completed / total) * 100);
        }

        // 遅延工程リスト（最大3件）
        const delayedProcesses = progressData
          .filter((p: any) => p.status === 'delayed')
          .slice(0, 3)
          .map((p: any) => {
            // 予定日と今日の差分を計算（日本時間で）
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 予定日のパース（年を補完）
            let planned: Date;
            if (p.plannedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // YYYY-MM-DD形式
              planned = new Date(p.plannedDate + 'T00:00:00+09:00');
            } else if (p.plannedDate.match(/^\d{1,2}\/\d{1,2}$/)) {
              // M/D形式 - 年を補完（今年か来年）
              const [month, day] = p.plannedDate.split('/').map((s: string) => parseInt(s));
              const currentYear = new Date().getFullYear();
              planned = new Date(currentYear, month - 1, day);
              planned.setHours(0, 0, 0, 0);
            } else {
              // その他の形式
              planned = new Date(p.plannedDate);
              planned.setHours(0, 0, 0, 0);
            }

            const delayedDays = Math.floor((today.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
            return {
              name: p.processName,
              delayedDays: delayedDays > 0 ? delayedDays : 1,
            };
          });

        // カテゴリ別進捗（すべてのカテゴリ）
        // カテゴリ名を取得するヘルパー関数
        const getCategoryName = (catId: string) => {
          const category = localCategoryMetadata.find(c => c.categoryId === catId);
          return category?.categoryName || catId;
        };

        // カテゴリの表示順を取得するヘルパー関数
        const getCategoryDisplayOrder = (catId: string) => {
          const category = localCategoryMetadata.find(c => c.categoryId === catId);
          return category?.displayOrder || 999;
        };

        const categoryProgress = yumemagaProgressData.success && yumemagaProgressData.categories
          ? Object.entries(yumemagaProgressData.categories)
              .filter(([id, _]) => id !== 'Z' && id !== 'B') // Z（全体進捗）とB（全体調整）を除外
              .map(([id, data]: [string, any]) => ({
                id,
                name: getCategoryName(id), // カテゴリマスターから正式名称を取得
                progress: data.progress || 0,
                displayOrder: getCategoryDisplayOrder(id)
              }))
              .sort((a, b) => a.displayOrder - b.displayOrder) // 表示順でソート
          : [];

        // 次のマイルストーン（未完了で予定日が近い順に2-3件）
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentMonth = today.getMonth();
        const nextMilestones = progressData
          .filter((p: any) => p.status !== 'completed' && p.plannedDate && p.plannedDate !== '-')
          .map((p: any) => {
            // 予定日のパース（年を補完、年またぎ配慮）
            let planned: Date;
            if (p.plannedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // YYYY-MM-DD形式
              planned = new Date(p.plannedDate + 'T00:00:00+09:00');
            } else if (p.plannedDate.match(/^\d{1,2}\/\d{1,2}$/)) {
              // M/D形式 - 年を補完（未来のマイルストーンなので、過去の月は来年として扱う）
              const [month, day] = p.plannedDate.split('/').map((s: string) => parseInt(s));
              const currentYear = new Date().getFullYear();

              // 月が現在より前の場合は来年、同じか後の場合は今年
              const targetYear = (month - 1) < currentMonth ? currentYear + 1 : currentYear;
              planned = new Date(targetYear, month - 1, day);
              planned.setHours(0, 0, 0, 0);
            } else {
              // その他の形式
              planned = new Date(p.plannedDate);
              planned.setHours(0, 0, 0, 0);
            }

            const daysUntil = Math.ceil((planned.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return {
              name: p.processName,
              plannedDate: p.plannedDate,
              daysUntil
            };
          })
          .sort((a: any, b: any) => a.daysUntil - b.daysUntil)
          .slice(0, 3);

        // 校了予定日と残日数（月号の前月18日を計算）
        let publishDate: string | undefined;
        let daysUntilPublish: number | undefined;

        // 月号から年月を抽出（例：2025年11月号 → 2025-10-18）
        const issueMatch = yumemagaData.ganttData.issueNumber.match(/(\d{4})年(\d{1,2})月号/);
        if (issueMatch) {
          const year = parseInt(issueMatch[1]);
          const month = parseInt(issueMatch[2]);

          // 前月を計算（1月の場合は前年12月）
          let publishYear = year;
          let publishMonth = month - 1;
          if (publishMonth === 0) {
            publishYear = year - 1;
            publishMonth = 12;
          }

          publishDate = `${publishYear}-${publishMonth.toString().padStart(2, '0')}-18`; // 校了予定日は前月18日
          const publishDateTime = new Date(publishDate + 'T00:00:00+09:00'); // 日本時間で解釈
          publishDateTime.setHours(0, 0, 0, 0);
          const todayForCalc = new Date();
          todayForCalc.setHours(0, 0, 0, 0);
          daysUntilPublish = Math.ceil((publishDateTime.getTime() - todayForCalc.getTime()) / (1000 * 60 * 60 * 24));
        }

        // 次月号準備の進捗
        let nextMonthProgress;
        if (yumemagaNextMonthData.success && yumemagaNextMonthData.processes) {
          const processes = yumemagaNextMonthData.processes;
          const nextTotal = processes.length;
          const nextCompleted = processes.filter((p: any) => p.actualDate).length;
          const nextProgressRate = nextTotal > 0
            ? (nextCompleted === nextTotal ? 100 : Math.round((nextCompleted / nextTotal) * 100))
            : 0;
          nextMonthProgress = {
            completed: nextCompleted,
            total: nextTotal,
            progressRate: nextProgressRate
          };
        }

        yumemagaSummary = {
          currentIssue: yumemagaData.ganttData.issueNumber || '未設定',
          totalProcesses: total,
          completed,
          inProgress,
          notStarted,
          delayed,
          progressRate,
          delayedProcesses,
          categoryProgress,
          nextMilestones,
          publishDate,
          daysUntilPublish,
          nextMonthProgress
        };
      }

      // サマリーデータを整形
      setSummary({
        sales: salesData.success ? salesData.data : null,
        yumemaga: yumemagaSummary,
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
        contract: contractSummary,
        financial: financialData.success ? {
          revenue: financialData.data?.pl?.revenue || 0,
          operatingProfit: financialData.data?.pl?.operatingProfit || 0,
          netProfit: financialData.data?.pl?.netProfit || 0,
          operatingCashFlow: financialData.data?.cf?.operatingActivities?.netOperatingCashFlow || 0,
          cashAtEnd: financialData.data?.cf?.cashAtEnd || 0,
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
      {/* モバイルオーバーレイ（メニューより後ろ） */}
      <div
        className={`
          fixed inset-0 bg-black z-30 md:opacity-0 md:pointer-events-none
          transition-opacity duration-300
          ${mobileMenuOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* サイドメニュー */}
      <aside className={`
        fixed md:sticky top-0 z-50 h-screen bg-white bg-opacity-100 shadow-lg flex-col
        transition-transform duration-300 ease-in-out
        w-full md:w-64
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">メニュー</h2>
            {/* モバイル閉じるボタン */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="space-y-2">
            <Link href="/dashboard/sales" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span>営業進捗</span>
            </Link>
            <Link href="/dashboard/yumemaga-v2" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
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
            <Link href="/dashboard/expenditures" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
              <Wallet className="w-5 h-5" />
              <span>支出管理</span>
            </Link>
            <Link href="/dashboard/financial-statements" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
              <FileText className="w-5 h-5" />
              <span>決算書</span>
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
      <main className="flex-1 p-4 md:p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* モバイルハンバーガーボタン */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  統合ダッシュボード
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  全業務の状況を一目で確認
                </p>
              </div>
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
                <Link href="/dashboard/yumemaga-v2" className="text-sm text-blue-600 hover:underline">
                  詳細 →
                </Link>
              </div>
              {summary.yumemaga ? (
                <div className="space-y-4">
                  {/* 制作中の月号と発行予定日 */}
                  <div className="flex justify-between items-center pb-3 border-b">
                    <div>
                      <span className="text-gray-600 font-medium">制作中</span>
                      <p className="font-bold text-blue-600 mt-1">{summary.yumemaga.currentIssue}</p>
                    </div>
                    {summary.yumemaga.publishDate && summary.yumemaga.daysUntilPublish !== undefined && (
                      <div className="text-right">
                        <span className="text-xs text-gray-500">校了予定日</span>
                        <p className="text-sm font-semibold text-gray-700">
                          {summary.yumemaga.publishDate}
                          <span className="ml-2 text-orange-600">
                            (あと{summary.yumemaga.daysUntilPublish}日)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 全体進捗率（プログレスバー） */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">全体進捗</span>
                      <span className="text-lg font-bold text-blue-600">{summary.yumemaga.progressRate}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                        style={{ width: `${summary.yumemaga.progressRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {summary.yumemaga.completed}/{summary.yumemaga.totalProcesses}工程完了
                    </p>
                  </div>

                  {/* ステータス別件数（4つのグリッド） */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                      <p className="text-xs text-green-700 font-medium mb-1">完了</p>
                      <p className="text-xl font-bold text-green-900">{summary.yumemaga.completed}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                      <p className="text-xs text-blue-700 font-medium mb-1">進行中</p>
                      <p className="text-xl font-bold text-blue-900">{summary.yumemaga.inProgress}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-700 font-medium mb-1">未着手</p>
                      <p className="text-xl font-bold text-gray-900">{summary.yumemaga.notStarted}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                      <p className="text-xs text-red-700 font-medium mb-1">遅延</p>
                      <p className="text-xl font-bold text-red-900">{summary.yumemaga.delayed}</p>
                    </div>
                  </div>

                  {/* カテゴリ別進捗 */}
                  {summary.yumemaga.categoryProgress && summary.yumemaga.categoryProgress.length > 0 && (
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">カテゴリ別進捗</h4>
                      <div className="space-y-2">
                        {summary.yumemaga.categoryProgress.map((cat, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">{cat.id}: {cat.name}</span>
                              <span className="text-xs font-bold text-blue-600">{cat.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${cat.progress}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 次のマイルストーン */}
                  {summary.yumemaga.nextMilestones && summary.yumemaga.nextMilestones.length > 0 && (
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">🎯 次のマイルストーン</h4>
                      <div className="space-y-1">
                        {summary.yumemaga.nextMilestones.map((milestone, idx) => (
                          <div key={idx} className="text-xs bg-blue-50 px-3 py-2 rounded text-blue-800">
                            • {milestone.name}
                            <span className="ml-2 font-semibold">
                              (予定: {milestone.plannedDate})
                              {milestone.daysUntil >= 0 && <span className="ml-1">あと{milestone.daysUntil}日</span>}
                              {milestone.daysUntil < 0 && <span className="ml-1 text-red-600">{Math.abs(milestone.daysUntil)}日遅れ</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 遅延工程リスト */}
                  {summary.yumemaga.delayed > 0 && summary.yumemaga.delayedProcesses.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <h4 className="text-sm font-semibold text-red-900">遅延工程</h4>
                      </div>
                      <div className="space-y-1">
                        {summary.yumemaga.delayedProcesses.map((task, idx) => (
                          <div key={idx} className="text-xs bg-red-50 px-3 py-2 rounded text-red-800">
                            • {task.name} <span className="font-semibold">({task.delayedDays}日遅れ)</span>
                          </div>
                        ))}
                      </div>
                      {summary.yumemaga.delayed > 3 && (
                        <p className="text-xs text-red-600 mt-2">
                          他{summary.yumemaga.delayed - 3}件の遅延工程があります
                        </p>
                      )}
                    </div>
                  )}

                  {/* 次月号準備 */}
                  {summary.yumemaga.nextMonthProgress && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-600 font-medium">📋 次月号準備</span>
                        <span className="text-xs font-bold text-purple-600">
                          {summary.yumemaga.nextMonthProgress.completed}/{summary.yumemaga.nextMonthProgress.total}工程
                          ({summary.yumemaga.nextMonthProgress.progressRate}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${summary.yumemaga.nextMonthProgress.progressRate}%` }}
                        />
                      </div>
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
            {/* 決算書サマリー */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  決算書（当月）
                </h3>
                <Link href="/dashboard/financial-statements" className="text-sm text-blue-600 hover:underline">
                  詳細 →
                </Link>
              </div>
              {summary.financial ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* 売上高 */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">売上高</p>
                    <p className="text-lg font-bold text-blue-700">{summary.financial.revenue.toLocaleString()}円</p>
                  </div>
                  {/* 営業利益 */}
                  <div className={`rounded-lg p-3 border ${summary.financial.operatingProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs text-gray-600 mb-1">営業利益</p>
                    <p className={`text-lg font-bold ${summary.financial.operatingProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {summary.financial.operatingProfit.toLocaleString()}円
                    </p>
                  </div>
                  {/* 純利益 */}
                  <div className={`rounded-lg p-3 border ${summary.financial.netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs text-gray-600 mb-1">純利益</p>
                    <p className={`text-lg font-bold ${summary.financial.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {summary.financial.netProfit.toLocaleString()}円
                    </p>
                  </div>
                  {/* 営業CF */}
                  <div className={`rounded-lg p-3 border ${summary.financial.operatingCashFlow >= 0 ? 'bg-purple-50 border-purple-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-xs text-gray-600 mb-1">営業CF</p>
                    <p className={`text-lg font-bold ${summary.financial.operatingCashFlow >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                      {summary.financial.operatingCashFlow.toLocaleString()}円
                    </p>
                  </div>
                  {/* 現金残高 */}
                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200 col-span-2">
                    <p className="text-xs text-gray-600 mb-1">期末現金残高</p>
                    <p className="text-lg font-bold text-indigo-700">{summary.financial.cashAtEnd.toLocaleString()}円</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">「更新」ボタンをクリックしてデータを読み込んでください</p>
              )}
            </div>

            {/* 契約業務フロー */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  契約業務フロー
                </h3>
                <Link href="/dashboard/workflow/contract" className="text-sm text-blue-600 hover:underline">
                  詳細 →
                </Link>
              </div>
              {summary.contract ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {/* グリッド1: 緊急対応が必要 */}
                  <div className="bg-red-50 rounded-lg p-4 min-h-[120px]">
                    <h4 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      緊急対応
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center text-red-700">
                        <span>入金遅延</span>
                        <span className="font-bold">{summary.contract.paymentOverdue}件</span>
                      </div>
                      <div className="flex justify-between items-center text-red-700">
                        <span>新規契約必要</span>
                        <span className="font-bold">{summary.contract.newContractRequired}件</span>
                      </div>
                    </div>
                  </div>

                  {/* グリッド2: 注意が必要 */}
                  <div className="bg-yellow-50 rounded-lg p-4 min-h-[120px]">
                    <h4 className="text-sm font-bold text-yellow-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      注意が必要
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center text-yellow-700">
                        <span>契約満了近い</span>
                        <span className="font-bold">{summary.contract.contractExpiryNear}件</span>
                      </div>
                      <div className="flex justify-between items-center text-yellow-700">
                        <span>入金待ち</span>
                        <span className="font-bold">{summary.contract.paymentPending}件</span>
                      </div>
                    </div>
                  </div>

                  {/* グリッド3: 進行中の企業一覧 */}
                  <div className="bg-blue-50 rounded-lg p-4 min-h-[120px]">
                    <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      進行中 ({summary.contract.inProgress}件)
                    </h4>
                    {summary.contract.inProgressContracts && summary.contract.inProgressContracts.length > 0 ? (
                      <div className="space-y-1">
                        {summary.contract.inProgressContracts
                          .slice(0, showAllContracts ? undefined : 5)
                          .map((contract) => (
                            <button
                              key={contract.contractId}
                              onClick={() => setSelectedContractCompany(contract.companyName)}
                              className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                                selectedContractCompany === contract.companyName
                                  ? 'bg-blue-200 text-blue-900 font-semibold'
                                  : 'hover:bg-blue-100 text-blue-700'
                              }`}
                            >
                              <span className="font-medium">{contract.companyName}</span>
                              <span className="text-blue-600 ml-2">(ステップ{contract.nextStep})</span>
                            </button>
                          ))}
                        {summary.contract.inProgressContracts.length > 5 && (
                          <button
                            onClick={() => setShowAllContracts(!showAllContracts)}
                            className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 text-center py-1"
                          >
                            {showAllContracts ? '閉じる' : `もっと見る (${summary.contract.inProgressContracts.length - 5}件)`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">進行中の契約はありません</p>
                    )}
                  </div>

                  {/* グリッド4: 選択した企業のステップ */}
                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200 min-h-[120px]">
                    {selectedContractCompany && summary.contract.inProgressContracts ? (
                      <>
                        {(() => {
                          const contract = summary.contract.inProgressContracts.find(
                            c => c.companyName === selectedContractCompany
                          );
                          return contract ? (
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 mb-2">{contract.companyName}</h4>
                              <div className="mb-3">
                                <p className="text-xs text-gray-600 mb-1">次のステップ</p>
                                <p className="text-lg font-bold text-blue-600">ステップ{contract.nextStep}</p>
                                <p className="text-sm text-gray-700">{contract.nextStepTitle}</p>
                              </div>
                              <Link
                                href="/dashboard/workflow/contract"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                              >
                                詳細へ
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          ) : null;
                        })()}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-xs text-gray-400 text-center">企業を選択してください</p>
                      </div>
                    )}
                  </div>

                  {/* 完了件数（最下部・控えめ表示） */}
                  <div className="col-span-full text-center">
                    <p className="text-xs text-gray-500">
                      完了: {summary.contract.completed}件
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">データを読み込んでください</p>
              )}
            </div>

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
