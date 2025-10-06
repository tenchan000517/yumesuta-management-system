'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Calendar, TrendingUp, AlertTriangle, Instagram } from 'lucide-react';
import type { SNSData, PostHistory, PostSchedule } from '@/types/sns';

export default function SNSManagementDashboard() {
  const [data, setData] = useState<SNSData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表示フィルター
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Instagram' | 'X'>('all');
  const [scheduleFilter, setScheduleFilter] = useState<'all' | '予定' | '完了' | '期限切れ'>('all');

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sns');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('データの取得中にエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時に自動でデータ取得
  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // フィルタリング済みデータ
  const filteredHistory =
    data?.history.filter((item) => historyFilter === 'all' || item.snsType === historyFilter) ||
    [];
  const filteredSchedule =
    data?.schedule.filter((item) => scheduleFilter === 'all' || item.status === scheduleFilter) ||
    [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          トップページに戻る
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">SNS投稿管理</h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '更新中...' : '更新'}
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* データ未取得の場合 */}
      {!data && !loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">「更新」ボタンをクリックしてSNS投稿データを取得してください</p>
        </div>
      )}

      {/* サマリーカード */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* 期限切れ投稿 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">期限切れ投稿</h3>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-600">{data.overdueCount}</p>
              <p className="text-xs text-gray-500 mt-1">要対応</p>
            </div>

            {/* 今日の投稿予定 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">今日の投稿予定</h3>
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.todayScheduledCount}</p>
              <p className="text-xs text-gray-500 mt-1">予定あり</p>
            </div>

            {/* 今週の投稿予定 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">今週の投稿予定</h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.weekScheduledCount}</p>
              <p className="text-xs text-gray-500 mt-1">予定あり</p>
            </div>

            {/* 総投稿履歴件数 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">総投稿履歴</h3>
                <Instagram className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{data.history.length}</p>
              <p className="text-xs text-gray-500 mt-1">投稿済み</p>
            </div>
          </div>

          {/* 投稿予定セクション */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">投稿予定</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setScheduleFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    scheduleFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setScheduleFilter('予定')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    scheduleFilter === '予定'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  予定
                </button>
                <button
                  onClick={() => setScheduleFilter('期限切れ')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    scheduleFilter === '期限切れ'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  期限切れ
                </button>
              </div>
            </div>

            {filteredSchedule.length === 0 ? (
              <p className="text-gray-500 text-center py-8">投稿予定がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        投稿予定日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        SNS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        アカウント
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        投稿内容
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        備考
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSchedule.map((item, index) => (
                      <PostScheduleRow key={index} post={item} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 投稿履歴セクション */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">投稿履歴</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    historyFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setHistoryFilter('Instagram')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    historyFilter === 'Instagram'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Instagram
                </button>
                <button
                  onClick={() => setHistoryFilter('X')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    historyFilter === 'X'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  X
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">投稿履歴がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        投稿日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        SNS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        アカウント
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        投稿内容
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        エンゲージメント
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        備考
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistory.map((item, index) => (
                      <PostHistoryRow key={index} post={item} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 投稿予定行コンポーネント
 */
function PostScheduleRow({ post }: { post: PostSchedule }) {
  const scheduledDate = new Date(post.scheduledAt);
  const formattedDate = `${scheduledDate.getMonth() + 1}/${scheduledDate.getDate()} ${scheduledDate.getHours()}:${String(scheduledDate.getMinutes()).padStart(2, '0')}`;

  const statusColor =
    post.status === '完了'
      ? 'bg-green-100 text-green-800'
      : post.status === '期限切れ'
      ? 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-800';

  const snsColor =
    post.snsType === 'Instagram' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';

  return (
    <tr className={post.isOverdue ? 'bg-red-50' : ''}>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formattedDate}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${snsColor}`}>
          {post.snsType}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{post.accountName}</td>
      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">{post.content}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
          {post.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{post.note || '-'}</td>
    </tr>
  );
}

/**
 * 投稿履歴行コンポーネント
 */
function PostHistoryRow({ post }: { post: PostHistory }) {
  const postedDate = new Date(post.postedAt);
  const formattedDate = `${postedDate.getMonth() + 1}/${postedDate.getDate()} ${postedDate.getHours()}:${String(postedDate.getMinutes()).padStart(2, '0')}`;

  const snsColor =
    post.snsType === 'Instagram' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formattedDate}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${snsColor}`}>
          {post.snsType}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{post.accountName}</td>
      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">{post.content}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {post.likes !== undefined || post.engagements !== undefined ? (
          <div>
            {post.likes !== undefined && (
              <div className="text-xs">
                <span className="font-semibold">❤️ {post.likes}</span>
              </div>
            )}
            {post.engagements !== undefined && (
              <div className="text-xs">
                <span className="font-semibold">💬 {post.engagements}</span>
              </div>
            )}
          </div>
        ) : (
          '-'
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{post.note || '-'}</td>
    </tr>
  );
}
