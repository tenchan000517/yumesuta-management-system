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
