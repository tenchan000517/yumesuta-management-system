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

interface KeywordRankData {
  keyword: string;
  googleRank: number | null;
  yahooRank: number | null;
  bingRank: number | null;
  googleHits: number | null;
  yahooHits: number | null;
  bingHits: number | null;
  updatedAt: string;
}

interface DomainPowerData {
  domain: string;
  domainRating: number;
  backlinks: number;
  dofollowPercentage: number;
  linkingWebsites: number;
  linkingWebsitesDofollow: number;
  updatedAt: string;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  // キーワード順位関連のstate
  const [keywordRanks, setKeywordRanks] = useState<KeywordRankData[]>([]);
  const [pastedData, setPastedData] = useState('');
  const [savingRanks, setSavingRanks] = useState(false);
  const [rankError, setRankError] = useState<string | null>(null);
  const [rankSuccess, setRankSuccess] = useState<string | null>(null);
  const [showInputForm, setShowInputForm] = useState(false);

  // ドメインパワー関連のstate
  const [domainPower, setDomainPower] = useState<DomainPowerData | null>(null);
  const [domainInput, setDomainInput] = useState({
    domain: 'yumesuta.com',
    domainRating: '',
    backlinks: '',
    dofollowPercentage: '',
    linkingWebsites: '',
    linkingWebsitesDofollow: '',
  });
  const [savingDomain, setSavingDomain] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [domainSuccess, setDomainSuccess] = useState<string | null>(null);
  const [showDomainForm, setShowDomainForm] = useState(false);

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

  // キーワード順位を取得
  const fetchKeywordRanks = async () => {
    try {
      const res = await fetch('/api/keyword-rank');
      const json = await res.json();
      if (json.success) {
        setKeywordRanks(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch keyword ranks:', err);
    }
  };

  // キーワード順位を保存
  const handleSaveRanks = async () => {
    if (!pastedData.trim()) {
      setRankError('データを貼り付けてください');
      return;
    }

    setSavingRanks(true);
    setRankError(null);
    setRankSuccess(null);

    try {
      const res = await fetch('/api/keyword-rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pastedData }),
      });

      const json = await res.json();

      if (json.success) {
        setRankSuccess(json.message);
        setPastedData('');
        await fetchKeywordRanks(); // データを再取得
      } else {
        setRankError(json.error);
      }
    } catch (err: any) {
      setRankError(err.message || '保存に失敗しました');
    } finally {
      setSavingRanks(false);
    }
  };

  // ドメインパワーを取得
  const fetchDomainPower = async () => {
    try {
      const res = await fetch('/api/domain-power');
      const json = await res.json();
      if (json.success && json.data) {
        setDomainPower(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch domain power:', err);
    }
  };

  // ドメインパワーを保存
  const handleSaveDomain = async () => {
    setSavingDomain(true);
    setDomainError(null);
    setDomainSuccess(null);

    try {
      const res = await fetch('/api/domain-power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domainInput.domain,
          domainRating: parseFloat(domainInput.domainRating) || 0,
          backlinks: parseInt(domainInput.backlinks) || 0,
          dofollowPercentage: parseFloat(domainInput.dofollowPercentage) || 0,
          linkingWebsites: parseInt(domainInput.linkingWebsites) || 0,
          linkingWebsitesDofollow: parseFloat(domainInput.linkingWebsitesDofollow) || 0,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setDomainSuccess(json.message);
        setShowDomainForm(false);
        await fetchDomainPower(); // データを再取得
      } else {
        setDomainError(json.error);
      }
    } catch (err: any) {
      setDomainError(err.message || '保存に失敗しました');
    } finally {
      setSavingDomain(false);
    }
  };

  // 初回マウント時に自動でデータ取得
  useEffect(() => {
    handleRefresh();
    fetchKeywordRanks();
    fetchDomainPower();
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
            <div className="mb-8">
              {/* LLMO対策推奨アクション */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  LLMO対策推奨アクション
                </h3>

                <div className="space-y-3">
                  {/* LLM流入ゼロの場合 */}
                  {data.kpiMetrics.llmStatus.totalSessions === 0 && (
                    <div className="border-l-4 border-red-600 bg-red-50 p-4 rounded">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">🚨</span>
                        <div className="flex-1">
                          <p className="font-bold text-red-900 mb-1">緊急: LLMからの流入がゼロです</p>
                          <p className="text-sm text-red-700 mb-2">
                            ChatGPT・Perplexity・Geminiなどの生成AIからのアクセスが検出されていません
                          </p>
                          <div className="bg-white rounded p-3 text-xs text-gray-700 space-y-1">
                            <p className="font-bold text-red-800">推奨対策:</p>
                            <p>1. Q&A形式のコンテンツを追加（「高校生 就職 愛知 よくある質問」など）</p>
                            <p>2. FAQページを作成・充実化</p>
                            <p>3. 構造化データ（Schema.org）を実装</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* お問い合わせゼロの場合 */}
                  {data.kpiMetrics.kgi.inquiries === 0 && (
                    <div className="border-l-4 border-orange-600 bg-orange-50 p-4 rounded">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div className="flex-1">
                          <p className="font-bold text-orange-900 mb-1">重要: お問い合わせがゼロです</p>
                          <p className="text-sm text-orange-700 mb-2">
                            過去{days}日間でコンバージョンが発生していません
                          </p>
                          <div className="bg-white rounded p-3 text-xs text-gray-700 space-y-1">
                            <p className="font-bold text-orange-800">推奨対策:</p>
                            <p>1. CTAボタンの配置・文言を見直し</p>
                            <p>2. お問い合わせフォームを簡略化</p>
                            <p>3. GA4イベント設定の確認（generate_leadイベントが正しく発火しているか）</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* セッション目標未達の場合 */}
                  {data.kpiMetrics.kgi.sessionAchievementRate < 80 && (
                    <div className="border-l-4 border-yellow-600 bg-yellow-50 p-4 rounded">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">📊</span>
                        <div className="flex-1">
                          <p className="font-bold text-yellow-900 mb-1">
                            セッション数が目標の{data.kpiMetrics.kgi.sessionAchievementRate.toFixed(0)}%です
                          </p>
                          <p className="text-sm text-yellow-700 mb-2">
                            目標まであと {formatNumber(data.kpiMetrics.kgi.targetSessions - data.kpiMetrics.kgi.sessions)} セッション
                          </p>
                          <div className="bg-white rounded p-3 text-xs text-gray-700 space-y-1">
                            <p className="font-bold text-yellow-800">推奨対策:</p>
                            <p>1. SNS投稿頻度を増やす（週3回→毎日）</p>
                            <p>2. 検索順位の低いキーワードのコンテンツ改善</p>
                            <p>3. 内部リンク構造の最適化</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 一般ワード比率が低い場合 */}
                  {data.kpiMetrics.brandKeywordRatio.nonBrandPercentage < 30 && (
                    <div className="border-l-4 border-blue-600 bg-blue-50 p-4 rounded">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">🎯</span>
                        <div className="flex-1">
                          <p className="font-bold text-blue-900 mb-1">
                            一般ワード比率が{data.kpiMetrics.brandKeywordRatio.nonBrandPercentage.toFixed(1)}%（目標30%）
                          </p>
                          <p className="text-sm text-blue-700 mb-2">
                            ブランド名以外のキーワードからの流入を増やす必要があります
                          </p>
                          <div className="bg-white rounded p-3 text-xs text-gray-700 space-y-1">
                            <p className="font-bold text-blue-800">推奨対策:</p>
                            <p>1. 「高校生 就職 愛知」などのロングテールキーワード記事を作成</p>
                            <p>2. 既存ページのタイトル・見出しにキーワードを追加</p>
                            <p>3. 検索意図に合ったコンテンツの拡充</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* すべて順調な場合 */}
                  {data.kpiMetrics.llmStatus.totalSessions > 0 &&
                    data.kpiMetrics.kgi.inquiries > 0 &&
                    data.kpiMetrics.kgi.sessionAchievementRate >= 80 &&
                    data.kpiMetrics.brandKeywordRatio.nonBrandPercentage >= 30 && (
                    <div className="border-l-4 border-green-600 bg-green-50 p-4 rounded">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">✅</span>
                        <div className="flex-1">
                          <p className="font-bold text-green-900 mb-1">すべて順調です！</p>
                          <p className="text-sm text-green-700 mb-2">
                            主要KPIが目標を達成しています
                          </p>
                          <div className="bg-white rounded p-3 text-xs text-gray-700 space-y-1">
                            <p className="font-bold text-green-800">さらなる改善施策:</p>
                            <p>1. コンバージョン率2.0%以上を目指してフォーム最適化</p>
                            <p>2. LLM流入をさらに増やすためのFAQコンテンツ追加</p>
                            <p>3. リピーターを増やすためのメルマガ・SNS運用強化</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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

        {/* Keyword Ranking Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-6 h-6" />
            キーワード検索順位
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 入力エリア */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                順位データ入力
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                <a
                  href="https://checker.search-rank-check.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  検索順位チェッカー
                </a>
                の結果をコピーして貼り付けてください
              </p>

              <textarea
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder="ゆめスタ    1    4240000    1    4610000    圏外    圏外    -    -    -
ゆめマガ    1    2980000    1    2960000    圏外    圏外    -    -    -"
                className="w-full h-48 border border-gray-300 rounded-md p-3 text-sm font-mono"
                disabled={savingRanks}
              />

              {rankError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800">{rankError}</p>
                </div>
              )}

              {rankSuccess && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">{rankSuccess}</p>
                </div>
              )}

              <button
                onClick={handleSaveRanks}
                disabled={savingRanks || !pastedData.trim()}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingRanks ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存してスプレッドシートに記録'
                )}
              </button>
            </div>

            {/* 表示エリア */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">
                  登録済みキーワード順位
                </h3>
                <button
                  onClick={fetchKeywordRanks}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  更新
                </button>
              </div>

              {keywordRanks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">まだデータがありません</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          キーワード
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">
                          Google
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">
                          Yahoo
                        </th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">
                          Bing
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {keywordRanks.map((rank, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {rank.keyword}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {rank.googleRank ? (
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                  rank.googleRank <= 3
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
                          <td className="px-3 py-2 text-center">
                            {rank.yahooRank ? (
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                  rank.yahooRank <= 3
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
                          <td className="px-3 py-2 text-center">
                            {rank.bingRank ? (
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                  rank.bingRank <= 3
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
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {keywordRanks.length > 0 && keywordRanks[0].updatedAt && (
                    <p className="text-xs text-gray-500 mt-3 text-right">
                      最終更新: {new Date(keywordRanks[0].updatedAt).toLocaleString('ja-JP')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Domain Power Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            ドメインパワー (yumesuta.com)
          </h2>

          <div className="bg-white rounded-lg shadow-sm p-6">
            {domainPower ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  {/* ドメイン評価 */}
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700 mb-1 font-medium">ドメイン評価</p>
                    <p className="text-3xl font-bold text-blue-900">{domainPower.domainRating.toFixed(1)}</p>
                  </div>

                  {/* 被リンク数 */}
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <p className="text-xs text-green-700 mb-1 font-medium">被リンク数</p>
                    <p className="text-3xl font-bold text-green-900">{formatNumber(domainPower.backlinks)}</p>
                  </div>

                  {/* Dofollow率 */}
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <p className="text-xs text-purple-700 mb-1 font-medium">Dofollow率</p>
                    <p className="text-3xl font-bold text-purple-900">{domainPower.dofollowPercentage.toFixed(0)}%</p>
                  </div>

                  {/* リンク元サイト数 */}
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                    <p className="text-xs text-orange-700 mb-1 font-medium">リンク元サイト</p>
                    <p className="text-3xl font-bold text-orange-900">{formatNumber(domainPower.linkingWebsites)}</p>
                  </div>

                  {/* Dofollowサイト率 */}
                  <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                    <p className="text-xs text-pink-700 mb-1 font-medium">Dofollowサイト率</p>
                    <p className="text-3xl font-bold text-pink-900">{domainPower.linkingWebsitesDofollow.toFixed(0)}%</p>
                  </div>

                  {/* 最終更新 */}
                  <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                    <p className="text-xs text-gray-700 mb-1 font-medium">最終更新</p>
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(domainPower.updatedAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>

                {domainSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-800">{domainSuccess}</p>
                  </div>
                )}

                <button
                  onClick={() => setShowDomainForm(!showDomainForm)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {showDomainForm ? '入力欄を閉じる' : 'データを更新'}
                </button>

                {showDomainForm && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">
                      最新データを入力してください
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          ドメイン評価
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={domainInput.domainRating}
                          onChange={(e) => setDomainInput({ ...domainInput, domainRating: e.target.value })}
                          placeholder="2.8"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          被リンク数
                        </label>
                        <input
                          type="number"
                          value={domainInput.backlinks}
                          onChange={(e) => setDomainInput({ ...domainInput, backlinks: e.target.value })}
                          placeholder="47"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Dofollow率 (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={domainInput.dofollowPercentage}
                          onChange={(e) => setDomainInput({ ...domainInput, dofollowPercentage: e.target.value })}
                          placeholder="34"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          リンク元サイト数
                        </label>
                        <input
                          type="number"
                          value={domainInput.linkingWebsites}
                          onChange={(e) => setDomainInput({ ...domainInput, linkingWebsites: e.target.value })}
                          placeholder="12"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Dofollowサイト率 (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={domainInput.linkingWebsitesDofollow}
                          onChange={(e) => setDomainInput({ ...domainInput, linkingWebsitesDofollow: e.target.value })}
                          placeholder="33"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    {domainError && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-800">{domainError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleSaveDomain}
                      disabled={savingDomain}
                      className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {savingDomain ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        '保存'
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
                <p className="text-sm text-gray-500 mb-4">まだデータがありません</p>
                <button
                  onClick={() => setShowDomainForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  初回データを入力
                </button>

                {showDomainForm && (
                  <div className="mt-6 text-left max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          ドメイン評価
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={domainInput.domainRating}
                          onChange={(e) => setDomainInput({ ...domainInput, domainRating: e.target.value })}
                          placeholder="2.8"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          被リンク数
                        </label>
                        <input
                          type="number"
                          value={domainInput.backlinks}
                          onChange={(e) => setDomainInput({ ...domainInput, backlinks: e.target.value })}
                          placeholder="47"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Dofollow率 (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={domainInput.dofollowPercentage}
                          onChange={(e) => setDomainInput({ ...domainInput, dofollowPercentage: e.target.value })}
                          placeholder="34"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          リンク元サイト数
                        </label>
                        <input
                          type="number"
                          value={domainInput.linkingWebsites}
                          onChange={(e) => setDomainInput({ ...domainInput, linkingWebsites: e.target.value })}
                          placeholder="12"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Dofollowサイト率 (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={domainInput.linkingWebsitesDofollow}
                          onChange={(e) => setDomainInput({ ...domainInput, linkingWebsitesDofollow: e.target.value })}
                          placeholder="33"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    {domainError && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-800">{domainError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleSaveDomain}
                      disabled={savingDomain}
                      className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {savingDomain ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        '保存'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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
