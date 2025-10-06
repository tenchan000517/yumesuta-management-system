'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  Search,
  BarChart3,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { AnalyticsData } from '@/types/analytics';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/analytics?days=${days}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'データの取得に失敗しました');
      } else {
        setData(json.data);
      }
    } catch (err: any) {
      setError(err.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時に自動でデータ取得
  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercent = (num: number) => `${(num * 100).toFixed(2)}%`;
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}分${secs}秒`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ダッシュボードに戻る
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                HP・LLMO分析管理
              </h1>
              <p className="text-gray-600 mt-2">
                Google Analytics、Search Console、Microsoft Clarityのデータを統合表示
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                期間:
              </label>
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value={7}>過去7日間</option>
                <option value={30}>過去30日間</option>
                <option value={90}>過去90日間</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>

          {data && (
            <p className="text-sm text-gray-500 mt-4">
              最終更新: {new Date(data.lastUpdated).toLocaleString('ja-JP')}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* KGI/KPI Section */}
        {data?.kpiMetrics && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              SEO/LLMO KPI進捗モニタリング
            </h2>

            {/* KGI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* セッション数 KGI */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">KGI</p>
                    <p className="text-sm font-medium text-gray-900">過去{days}日間のセッション数</p>
                  </div>
                  <Users className="w-6 h-6 text-blue-600" />
                </div>

                <div className="mb-3">
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-gray-900">
                      {formatNumber(data.kpiMetrics.kgi.sessions)}
                    </p>
                    <span className="text-lg text-gray-500">
                      / {formatNumber(data.kpiMetrics.kgi.targetSessions)}
                    </span>
                  </div>
                </div>

                {/* プログレスバー */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          data.kpiMetrics.kgi.sessionAchievementRate >= 80
                            ? 'bg-green-600'
                            : data.kpiMetrics.kgi.sessionAchievementRate >= 50
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{
                          width: `${Math.min(data.kpiMetrics.kgi.sessionAchievementRate, 100)}%`,
                        }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${
                      data.kpiMetrics.kgi.sessionAchievementRate >= 80
                        ? 'text-green-600'
                        : data.kpiMetrics.kgi.sessionAchievementRate >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {data.kpiMetrics.kgi.sessionAchievementRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* ステータス表示 */}
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">
                    🎯 目標まであと: <span className="font-bold text-gray-900">
                      {formatNumber(data.kpiMetrics.kgi.targetSessions - data.kpiMetrics.kgi.sessions)} セッション
                    </span>
                  </div>
                </div>
              </div>

              {/* お問い合わせ数 KPI */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">KPI</p>
                    <p className="text-sm font-medium text-gray-900">過去{days}日間のお問い合わせ数</p>
                  </div>
                  <AlertCircle className="w-6 h-6 text-green-600" />
                </div>

                <div className="mb-3">
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-gray-900">
                      {formatNumber(data.kpiMetrics.kgi.inquiries)}
                    </p>
                    <span className="text-lg text-gray-500">
                      / {formatNumber(data.kpiMetrics.kgi.targetInquiries)}
                    </span>
                  </div>
                </div>

                {/* プログレスバー */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          data.kpiMetrics.kgi.inquiryAchievementRate >= 80
                            ? 'bg-green-600'
                            : data.kpiMetrics.kgi.inquiryAchievementRate >= 50
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{
                          width: `${Math.min(data.kpiMetrics.kgi.inquiryAchievementRate, 100)}%`,
                        }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${
                      data.kpiMetrics.kgi.inquiryAchievementRate >= 80
                        ? 'text-green-600'
                        : data.kpiMetrics.kgi.inquiryAchievementRate >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {data.kpiMetrics.kgi.inquiryAchievementRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* アラート表示 */}
                {data.kpiMetrics.kgi.inquiries === 0 ? (
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
                      {formatNumber(data.kpiMetrics.kgi.targetInquiries - data.kpiMetrics.kgi.inquiries)} 件
                    </span>
                  </div>
                )}
              </div>

              {/* コンバージョン率 KPI */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600">
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
                      {data.kpiMetrics.kgi.conversionRate.toFixed(2)}%
                    </p>
                    <span className="text-lg text-gray-500">
                      / {data.kpiMetrics.kgi.targetConversionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* プログレスバー */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          (data.kpiMetrics.kgi.conversionRate / data.kpiMetrics.kgi.targetConversionRate) * 100 >= 80
                            ? 'bg-green-600'
                            : (data.kpiMetrics.kgi.conversionRate / data.kpiMetrics.kgi.targetConversionRate) * 100 >= 50
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{
                          width: `${Math.min(
                            (data.kpiMetrics.kgi.conversionRate / data.kpiMetrics.kgi.targetConversionRate) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${
                      (data.kpiMetrics.kgi.conversionRate / data.kpiMetrics.kgi.targetConversionRate) * 100 >= 80
                        ? 'text-green-600'
                        : (data.kpiMetrics.kgi.conversionRate / data.kpiMetrics.kgi.targetConversionRate) * 100 >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {((data.kpiMetrics.kgi.conversionRate / data.kpiMetrics.kgi.targetConversionRate) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* ステータス表示 */}
                {data.kpiMetrics.kgi.conversionRate === 0 ? (
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
                      {(data.kpiMetrics.kgi.targetConversionRate - data.kpiMetrics.kgi.conversionRate).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* KPI Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Brand vs Non-Brand Keyword Ratio */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  流入元キーワード分析
                </h3>

                {/* 視覚的な円グラフ風プログレスバー */}
                <div className="mb-6">
                  <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-blue-600 transition-all duration-300"
                      style={{
                        width: `${data.kpiMetrics.brandKeywordRatio.brandPercentage}%`,
                      }}
                    />
                    <div
                      className="absolute h-full bg-green-600 transition-all duration-300"
                      style={{
                        left: `${data.kpiMetrics.brandKeywordRatio.brandPercentage}%`,
                        width: `${data.kpiMetrics.brandKeywordRatio.nonBrandPercentage}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>ブランドワード {data.kpiMetrics.brandKeywordRatio.brandPercentage.toFixed(1)}%</span>
                    <span>一般ワード {data.kpiMetrics.brandKeywordRatio.nonBrandPercentage.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* ブランドワード */}
                  <div className="border-l-4 border-blue-600 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🔵</span>
                        <span className="font-bold text-gray-900">ブランドワード</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {data.kpiMetrics.brandKeywordRatio.brandPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {formatNumber(data.kpiMetrics.brandKeywordRatio.brandClicks)} クリック
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>├ ゆめスタ</div>
                      <div>└ ゆめマガ</div>
                    </div>
                  </div>

                  {/* 一般ワード */}
                  <div className="border-l-4 border-green-600 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🟢</span>
                        <span className="font-bold text-gray-900">一般ワード</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {data.kpiMetrics.brandKeywordRatio.nonBrandPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {formatNumber(data.kpiMetrics.brandKeywordRatio.nonBrandClicks)} クリック
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>├ 高校生 就職</div>
                      <div>├ 愛知 高卒採用</div>
                      <div>└ その他</div>
                    </div>
                  </div>
                </div>

                {/* 目標達成状況 */}
                <div className={`mt-6 p-4 rounded-lg ${
                  data.kpiMetrics.brandKeywordRatio.nonBrandPercentage >= 30
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎯</span>
                    <span className="font-bold text-gray-900">目標: 一般ワード30%以上</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-white rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          data.kpiMetrics.brandKeywordRatio.nonBrandPercentage >= 30
                            ? 'bg-green-600'
                            : 'bg-yellow-600'
                        }`}
                        style={{
                          width: `${Math.min(
                            (data.kpiMetrics.brandKeywordRatio.nonBrandPercentage / 30) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${
                      data.kpiMetrics.brandKeywordRatio.nonBrandPercentage >= 30
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    }`}>
                      {((data.kpiMetrics.brandKeywordRatio.nonBrandPercentage / 30) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    進捗: {data.kpiMetrics.brandKeywordRatio.nonBrandPercentage.toFixed(1)}% / 30%
                    {data.kpiMetrics.brandKeywordRatio.nonBrandPercentage >= 30
                      ? ' ✅ 達成'
                      : ` (あと${(30 - data.kpiMetrics.brandKeywordRatio.nonBrandPercentage).toFixed(1)}%)`
                    }
                  </div>
                  {data.kpiMetrics.brandKeywordRatio.nonBrandClicks === 0 && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">⚠️</span>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-orange-800">
                            一般ワードからのクリックがゼロです
                          </p>
                          <p className="text-xs text-orange-600 mt-1">
                            推奨施策: SEOコンテンツ強化、メタディスクリプション改善
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Important Keywords Ranking */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    重要キーワード順位
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-1">
                    <p className="text-xs font-medium text-yellow-800">
                      ⚠️ 24時間キャッシュ（課金防止）
                    </p>
                  </div>
                </div>
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-800">
                    <strong>Custom Search API使用:</strong> 更新ボタンを押すと8クエリ消費します。1日1回の更新を推奨（月間240クエリ、約$7/月）
                  </p>
                </div>
                {data.searchConsole?.keywordRankings && data.searchConsole.keywordRankings.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.searchConsole.keywordRankings.map((kw, index) => {
                      // メダルアイコン判定
                      const getMedalIcon = (pos: number) => {
                        if (pos <= 1) return '🥇';
                        if (pos <= 2) return '🥈';
                        if (pos <= 3) return '🥉';
                        return null;
                      };

                      // 目標達成判定とステータス色
                      const isAchieved = kw.position <= kw.targetPosition;
                      const getStatusColor = () => {
                        if (isAchieved) return 'text-green-600 bg-green-50';
                        if (kw.position <= 10) return 'text-yellow-600 bg-yellow-50';
                        if (kw.position <= 50) return 'text-orange-600 bg-orange-50';
                        return 'text-red-600 bg-red-50';
                      };

                      // トレンドアイコン
                      const getTrendIcon = (trend?: 'up' | 'down' | 'same' | 'new') => {
                        if (trend === 'up') return '↑';
                        if (trend === 'down') return '↓';
                        if (trend === 'same') return '→';
                        if (trend === 'new') return '🆕';
                        return '';
                      };

                      const medal = getMedalIcon(kw.position);

                      return (
                        <div key={index} className={`border rounded-lg p-3 ${getStatusColor()}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {medal && <span className="text-lg">{medal}</span>}
                              {!medal && (isAchieved ? '✅' : '❌')}
                              <span className="text-sm font-bold text-gray-900">
                                {kw.keyword}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {kw.trend && (
                                <span className="text-xs font-medium">
                                  {getTrendIcon(kw.trend)}
                                </span>
                              )}
                              <span className={`text-sm font-bold ${getStatusColor().split(' ')[0]}`}>
                                {kw.position === 999 ? 'ランク外' : `${kw.position.toFixed(1)}位`}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <div className="flex gap-3 text-gray-600">
                              <span>目標: {kw.targetPosition}位</span>
                              <span>{formatNumber(kw.clicks)} クリック</span>
                            </div>
                            {kw.position === 999 ? (
                              <div className="mt-1">
                                <span className="text-red-600 font-medium">⚠️ 10位圏外</span>
                                <p className="text-xs text-red-500 mt-0.5">
                                  SEO対策が必要です（コンテンツ強化・キーワード最適化）
                                </p>
                              </div>
                            ) : kw.position > kw.targetPosition ? (
                              <div className="mt-1">
                                <span className="text-orange-600 font-medium">⚠️ 目標未達</span>
                                <p className="text-xs text-orange-500 mt-0.5">
                                  目標順位まであと{kw.position - kw.targetPosition}位
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    重要キーワードのデータがありません
                  </p>
                )}
              </div>

              {/* LLM Traffic Status */}
              <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  LLM流入状況
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(data.kpiMetrics.llmStatus.totalSessions)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">合計</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatNumber(data.kpiMetrics.llmStatus.perplexitySessions)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Perplexity</p>
                    {data.kpiMetrics.llmStatus.perplexitySessions > 0 && (
                      <span className="text-xs text-green-600">✓</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-2xl font-bold ${
                        data.kpiMetrics.llmStatus.chatGPTSessions > 0
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {formatNumber(data.kpiMetrics.llmStatus.chatGPTSessions)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">ChatGPT</p>
                    {data.kpiMetrics.llmStatus.chatGPTSessions === 0 && (
                      <span className="text-xs text-red-600">🔴</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-2xl font-bold ${
                        data.kpiMetrics.llmStatus.geminiSessions > 0
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {formatNumber(data.kpiMetrics.llmStatus.geminiSessions)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Gemini</p>
                    {data.kpiMetrics.llmStatus.geminiSessions === 0 && (
                      <span className="text-xs text-red-600">🔴</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-2xl font-bold ${
                        data.kpiMetrics.llmStatus.claudeSessions > 0
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {formatNumber(data.kpiMetrics.llmStatus.claudeSessions)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Claude</p>
                    {data.kpiMetrics.llmStatus.claudeSessions === 0 && (
                      <span className="text-xs text-red-600">🔴</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Google Analytics Section */}
        {data?.googleAnalytics && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Google Analytics
            </h2>

            {/* GA Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">アクティブユーザー</p>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.googleAnalytics.metrics.activeUsers)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">セッション数</p>
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.googleAnalytics.metrics.sessions)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">ページビュー</p>
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.googleAnalytics.metrics.screenPageViews)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">平均セッション時間</p>
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(data.googleAnalytics.metrics.averageSessionDuration)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">直帰率</p>
                  <TrendingUp className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercent(data.googleAnalytics.metrics.bounceRate)}
                </p>
              </div>
            </div>

            {/* LLMO Traffic Section */}
            <div className="mb-6">
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
                      {data.googleAnalytics.llmTraffic?.totalSessions || 0}
                    </p>
                    <span className="text-sm text-gray-600">セッション</span>
                  </div>
                  {data.googleAnalytics.llmTraffic && data.googleAnalytics.llmTraffic.totalSessions > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-purple-900 mb-1">内訳:</p>
                      {data.googleAnalytics.llmTraffic.breakdown.map((source, index) => (
                        <div key={index} className="flex justify-between items-center text-sm bg-white/50 rounded px-2 py-1">
                          <span className="text-gray-700">{source.source}</span>
                          <span className="font-semibold text-purple-700">{source.sessions}件</span>
                        </div>
                      ))}
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
                      {data.googleAnalytics.searchEngineTraffic?.total || 0}
                    </p>
                    <span className="text-sm text-gray-600">セッション</span>
                  </div>
                  {data.googleAnalytics.searchEngineTraffic && data.googleAnalytics.searchEngineTraffic.breakdown.length > 0 ? (
                    <div className="space-y-2">
                      {data.googleAnalytics.searchEngineTraffic.breakdown.map((engine, index) => {
                        const total = data.googleAnalytics.searchEngineTraffic?.total || 1;
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

            {/* Top Pages and Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Pages */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  人気ページ Top 10
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-sm font-medium text-gray-700">
                          ページ
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          PV
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          ユーザー
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.googleAnalytics.topPages.map((page, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 text-sm">
                            <div className="max-w-xs truncate" title={page.pageTitle}>
                              {page.pageTitle || page.pagePath}
                            </div>
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatNumber(page.views)}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatNumber(page.users)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Traffic Sources */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  流入元 Top 10
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-sm font-medium text-gray-700">
                          ソース/メディア
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          セッション
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          ユーザー
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.googleAnalytics.trafficSources.map((source, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 text-sm">
                            {source.source} / {source.medium}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatNumber(source.sessions)}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatNumber(source.users)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Google Search Console Section */}
        {data?.searchConsole && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Search className="w-6 h-6" />
              Google Search Console
            </h2>

            {/* Search Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">クリック数</p>
                  <MousePointer className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.searchConsole.metrics.clicks)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">表示回数</p>
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.searchConsole.metrics.impressions)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">CTR</p>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercent(data.searchConsole.metrics.ctr)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">平均掲載順位</p>
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.searchConsole.metrics.position.toFixed(1)}位
                </p>
              </div>
            </div>

            {/* Top Queries and Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Queries */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  検索クエリ Top 10
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-sm font-medium text-gray-700">
                          クエリ
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          クリック
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          表示
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          CTR
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.searchConsole.topQueries.map((query, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 text-sm max-w-xs truncate">
                            {query.query}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatNumber(query.clicks)}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatNumber(query.impressions)}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatPercent(query.ctr)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Search Pages */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  検索流入ページ Top 10
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-sm font-medium text-gray-700">
                          ページ
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          クリック
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          表示
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          CTR
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.searchConsole.topPages.map((page, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 text-sm max-w-xs truncate" title={page.page}>
                            {page.page}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatNumber(page.clicks)}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatNumber(page.impressions)}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatPercent(page.ctr)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Microsoft Clarity Section */}
        {data?.clarity?.summary && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Microsoft Clarity
            </h2>

            {/* Clarity Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">セッション数</p>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.clarity.summary.sessions)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">平均スクロール深度</p>
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.clarity.summary.avgScrollDepth.toFixed(1)}%
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">平均滞在時間</p>
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(data.clarity.summary.avgTimeOnPage)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Rage Clicks</p>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.clarity.summary.rageclicks)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Dead Clicks</p>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.clarity.summary.deadclicks)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Quick Backs</p>
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.clarity.summary.quickbacks)}
                </p>
              </div>
            </div>

            {/* Clarity Breakdown */}
            {data.clarity.breakdown && data.clarity.breakdown.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  ディメンション別分析
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-sm font-medium text-gray-700">
                          ディメンション
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          セッション
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          スクロール深度
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          Rage Clicks
                        </th>
                        <th className="text-right py-2 text-sm font-medium text-gray-700">
                          Dead Clicks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.clarity.breakdown.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 text-sm">{item.dimension}</td>
                          <td className="text-right py-2 text-sm">
                            {formatNumber(item.sessions)}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {item.avgScrollDepth.toFixed(1)}%
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatNumber(item.rageclicks)}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {formatNumber(item.deadclicks)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Data Message */}
        {!loading && !data && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              「更新」ボタンをクリックしてデータを取得してください
            </p>
            <p className="text-sm text-gray-500">
              ※ Google Analytics Property ID、Search Console設定、Clarity API Tokenが必要です
            </p>
          </div>
        )}

        {/* API Setup Instructions */}
        {!loading && data && !data.googleAnalytics && !data.searchConsole && !data.clarity && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              外部API設定が必要です
            </h3>
            <p className="text-sm text-yellow-800 mb-4">
              以下の環境変数を.env.localに設定してください:
            </p>
            <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
              <li>GA_PROPERTY_ID - Google Analytics 4のプロパティID</li>
              <li>SEARCH_CONSOLE_SITE_URL - Search Console検証済みサイトURL</li>
              <li>CLARITY_API_TOKEN - Clarityプロジェクト設定から生成</li>
            </ul>
            <p className="text-sm text-yellow-800 mt-4">
              サービスアカウントに適切な権限を付与してください（GA、Search Consoleへのアクセス権限）
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
