'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, Calendar, ClipboardList, AlertCircle, ArrowLeft } from 'lucide-react';
import type { ProcessScheduleResponse } from '@/types/process';

export default function YumeMagaDashboardPage() {
  const [scheduleData, setScheduleData] = useState<ProcessScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string>('');

  const fetchScheduleData = async (issue?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = issue
        ? `/api/process-schedule?issue=${encodeURIComponent(issue)}`
        : '/api/process-schedule';
      const response = await fetch(url);
      const data: ProcessScheduleResponse = await response.json();

      if (data.success) {
        setScheduleData(data);
        if (!selectedIssue && data.ganttData.issueNumber) {
          setSelectedIssue(data.ganttData.issueNumber);
        }
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
    fetchScheduleData();
  }, []);

  const handleIssueChange = (issue: string) => {
    setSelectedIssue(issue);
    fetchScheduleData(issue);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scheduleData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold text-lg mb-2">
              エラーが発生しました
            </h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => fetchScheduleData()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { ganttData, progressData, availableIssues } = scheduleData;

  // 現在の日付を取得
  const today = new Date();
  const todayStr = `${today.getMonth() + 1}/${today.getDate()}`;

  // 遅延している工程を抽出
  const delayedTasks = progressData.filter((p) => p.status === 'delayed');
  const inProgressTasks = progressData.filter((p) => p.status === 'in_progress');

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
                ゆめマガ制作進捗管理ダッシュボード
              </h1>
              <p className="text-gray-600">{ganttData.issueNumber}の制作スケジュール</p>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => fetchScheduleData(selectedIssue)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                更新
              </button>
            </div>
          </div>

          {/* 月号選択 */}
          {availableIssues.length > 0 && (
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700">月号選択:</label>
              <select
                value={selectedIssue}
                onChange={(e) => handleIssueChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableIssues.map((issue) => (
                  <option key={issue} value={issue}>
                    {issue}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* アラート（遅延工程） */}
        {delayedTasks.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-2">⚠ 遅延している工程があります</h3>
                <ul className="space-y-1">
                  {delayedTasks.map((task, index) => (
                    <li key={index} className="text-red-700 text-sm">
                      {task.processName} - 予定: {task.plannedDate}
                      {task.assignee && ` (担当: ${task.assignee})`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 進行中の工程 */}
        {inProgressTasks.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex items-start">
              <ClipboardList className="w-6 h-6 text-blue-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-blue-800 font-semibold mb-2">進行中の工程</h3>
                <ul className="space-y-1">
                  {inProgressTasks.map((task, index) => (
                    <li key={index} className="text-blue-700 text-sm">
                      {task.processName} - 予定: {task.plannedDate}
                      {task.assignee && ` (担当: ${task.assignee})`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ガントチャート */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            工程スケジュール（ガントチャート）
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left sticky left-0 bg-gray-100 z-10">
                    工程
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left">レイヤー</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">配置理由</th>
                  {ganttData.dateHeaders.slice(0, 30).map((date) => (
                    <th
                      key={date}
                      className={`border border-gray-300 px-2 py-2 text-center text-xs ${
                        date === todayStr ? 'bg-yellow-100' : ''
                      }`}
                    >
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ganttData.tasks.map((task, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-semibold text-sm sticky left-0 bg-white">
                      {task.processName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                      {task.layer}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                      {task.reason}
                    </td>
                    {ganttData.dateHeaders.slice(0, 30).map((date) => {
                      const hasTask = task.dates[date];
                      const isExternal = task.reason?.includes('外部') || task.layer?.includes('外部');
                      return (
                        <td
                          key={date}
                          className={`border border-gray-300 px-2 py-2 text-center text-xs ${
                            hasTask
                              ? isExternal
                                ? 'bg-orange-200 font-semibold'
                                : 'bg-blue-200 font-semibold'
                              : date === todayStr
                              ? 'bg-yellow-50'
                              : ''
                          }`}
                        >
                          {hasTask || ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200"></div>
              <span>通常工程</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-200"></div>
              <span>外部依存工程</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100"></div>
              <span>本日</span>
            </div>
          </div>
        </div>

        {/* 進捗一覧テーブル */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            工程別進捗状況
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">工程名</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">予定日</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">実績日</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">担当者</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">ステータス</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">備考</th>
                </tr>
              </thead>
              <tbody>
                {progressData.map((progress, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {progress.processName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {progress.plannedDate}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {progress.actualDate || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {progress.assignee || '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          progress.status === 'completed'
                            ? 'bg-green-200 text-green-800'
                            : progress.status === 'in_progress'
                            ? 'bg-blue-200 text-blue-800'
                            : progress.status === 'delayed'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {progress.status === 'completed'
                          ? '✅完了'
                          : progress.status === 'in_progress'
                          ? '進行中'
                          : progress.status === 'delayed'
                          ? '⚠遅延'
                          : '未着手'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                      {progress.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
