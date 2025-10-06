'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  RefreshCw,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Link as LinkIcon,
  Folder,
  Terminal,
  Lock,
  AlertCircle,
  PlayCircle,
  CheckCircle,
  SkipForward,
} from 'lucide-react';
import type { TaskDashboardData, TodayTask, TaskMaster } from '@/types/task';

type TabType = 'today' | 'scheduled' | 'projects' | 'master';

export default function TasksPage() {
  const [data, setData] = useState<TaskDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks');
      const json = await response.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
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

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // TODO: トースト通知を追加
    console.log(`${label}をコピーしました: ${text}`);
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank');
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-8 h-8" />
                タスク管理
              </h1>
              <p className="text-gray-600 mt-2">
                マネージャーの全作業を一元管理（35タスク）
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* タブナビゲーション */}
        {data && (
          <div className="mb-6">
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('today')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'today'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                今日のタスク
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'scheduled'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                定期タスク管理
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'projects'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                プロジェクトタスク管理
              </button>
              <button
                onClick={() => setActiveTab('master')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'master'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                タスクマスタ
              </button>
            </div>
          </div>
        )}

        {/* タブコンテンツ */}
        {data && (
          <>
            {/* 今日のタスクタブ */}
            {activeTab === 'today' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">今日のタスク</h2>

                {/* 期限超過タスク */}
                {(data.overdueScheduledTasks.length > 0 ||
                  data.overdueProjectTasks.length > 0) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-red-800 mb-3">
                      🔴 期限超過タスク（最優先）
                    </h3>
                    <div className="space-y-4">
                      {data.overdueScheduledTasks.map((task) => {
                        const master = data.allTaskMasters.find(
                          (tm) => tm.taskId === task.taskId
                        );
                        if (!master) return null;
                        return (
                          <TaskCard
                            key={task.taskId}
                            task={master}
                            alert="期限超過"
                            canStart={true}
                            onCopyToClipboard={handleCopyToClipboard}
                            onOpenUrl={handleOpenUrl}
                          />
                        );
                      })}
                      {data.overdueProjectTasks.map((task) => {
                        const master = data.allTaskMasters.find(
                          (tm) => tm.taskId === task.taskId
                        );
                        if (!master) return null;
                        return (
                          <TaskCard
                            key={task.taskId}
                            task={master}
                            alert="期限超過"
                            canStart={task.dependsCompleted}
                            onCopyToClipboard={handleCopyToClipboard}
                            onOpenUrl={handleOpenUrl}
                            delayDays={task.delayDays}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 今日のタスク */}
                {data.todayTasks.length > 0 ? (
                  <div className="space-y-4">
                    {data.todayTasks.map((todayTask) => (
                      <TaskCard
                        key={todayTask.task.taskId}
                        task={todayTask.task}
                        alert={todayTask.alert}
                        canStart={todayTask.canStart}
                        onCopyToClipboard={handleCopyToClipboard}
                        onOpenUrl={handleOpenUrl}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">今日のタスクはありません</p>
                  </div>
                )}
              </div>
            )}

            {/* 定期タスク管理タブ */}
            {activeTab === 'scheduled' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">定期タスク管理</h2>
                <p className="text-gray-600">実装予定：カレンダー表示・リスト表示</p>
              </div>
            )}

            {/* プロジェクトタスク管理タブ */}
            {activeTab === 'projects' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  プロジェクトタスク管理
                </h2>
                <p className="text-gray-600">実装予定：プロジェクト一覧・ガントチャート</p>
              </div>
            )}

            {/* タスクマスタタブ */}
            {activeTab === 'master' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">タスクマスタ</h2>

                {/* フィルター */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリ
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">全て</option>
                    <option value="パートナー管理">パートナー管理</option>
                    <option value="営業管理">営業管理</option>
                    <option value="ゆめマガ制作">ゆめマガ制作</option>
                    <option value="HP・LLMO">HP・LLMO</option>
                    <option value="SNS">SNS</option>
                    <option value="請求書">請求書</option>
                  </select>
                </div>

                {/* タスク一覧 */}
                <div className="space-y-4">
                  {data.allTaskMasters
                    .filter((task) =>
                      filterCategory === 'all' ? true : task.category === filterCategory
                    )
                    .map((task) => (
                      <TaskCard
                        key={task.taskId}
                        task={task}
                        alert=""
                        canStart={true}
                        onCopyToClipboard={handleCopyToClipboard}
                        onOpenUrl={handleOpenUrl}
                        showDetails={true}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 初期メッセージ */}
        {!data && !loading && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              「更新」ボタンをクリックしてタスクデータを読み込んでください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// タスクカードコンポーネント
interface TaskCardProps {
  task: TaskMaster;
  alert: string;
  canStart: boolean;
  onCopyToClipboard: (text: string, label: string) => void;
  onOpenUrl: (url: string) => void;
  delayDays?: number;
  showDetails?: boolean;
}

function TaskCard({
  task,
  alert,
  canStart,
  onCopyToClipboard,
  onOpenUrl,
  delayDays,
  showDetails = false,
}: TaskCardProps) {
  const isOverdue = alert === '期限超過';
  const isToday = alert === '本日実施';
  const isHighRisk = task.riskLevel === '最高' || task.riskLevel === '高';

  return (
    <div
      className={`p-6 border rounded-lg ${
        isHighRisk || isOverdue
          ? 'border-red-400 bg-red-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* アラート表示 */}
      {isOverdue && (
        <div className="bg-red-100 border-l-4 border-red-500 p-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-bold">期限超過</span>
            {delayDays && delayDays > 0 && (
              <span className="text-red-600">{delayDays}日遅延</span>
            )}
          </div>
        </div>
      )}

      {isToday && !isOverdue && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800 font-bold">本日実施</span>
          </div>
        </div>
      )}

      {/* 高リスクタスク強調 */}
      {isHighRisk && (
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800 font-bold">抜けもれリスク: {task.riskLevel}</span>
        </div>
      )}

      {/* タスク情報 */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span
            className={`px-3 py-1 rounded text-xs font-medium ${
              task.priority === '最高'
                ? 'bg-red-100 text-red-800'
                : task.priority === '高'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {task.priority}
          </span>
          <h3 className="text-lg font-bold text-gray-900">{task.taskName}</h3>
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>カテゴリ: {task.category}</span>
          <span>頻度: {task.frequencyDetail || task.frequencyType}</span>
          <span>所要時間: {task.estimatedTime}</span>
        </div>
      </div>

      {/* 関連URL・パス・コマンド */}
      <div className="mb-4 space-y-2">
        {/* 関連URL */}
        {task.relatedUrls.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {task.relatedUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => onOpenUrl(url.url)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
              >
                <LinkIcon className="h-4 w-4" />
                {url.name}
              </button>
            ))}
          </div>
        )}

        {/* 関連パス */}
        {task.relatedPaths.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {task.relatedPaths.map((path, index) => (
              <button
                key={index}
                onClick={() => onCopyToClipboard(path.path, path.name)}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
              >
                <Folder className="h-4 w-4" />
                {path.name}
              </button>
            ))}
          </div>
        )}

        {/* コマンド */}
        {task.relatedCommand && (
          <button
            onClick={() => onCopyToClipboard(task.relatedCommand!, 'コマンド')}
            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm"
          >
            <Terminal className="h-4 w-4" />
            コマンドコピー
          </button>
        )}
      </div>

      {/* 依存タスク表示 */}
      {!canStart && task.dependsOnTaskIds && (
        <div className="bg-orange-100 border-l-4 border-orange-500 p-3 mb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            <span className="text-orange-800 font-bold">依存タスク未完了</span>
          </div>
          <div className="text-sm text-orange-700 mt-1">
            {task.dependsOnTaskIds.map((depId) => (
              <div key={depId}>- {depId}</div>
            ))}
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex gap-2">
        <button
          disabled={!canStart}
          className={`flex items-center gap-2 px-4 py-2 rounded ${
            canStart
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <PlayCircle className="h-4 w-4" />
          開始する
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          <CheckCircle className="h-4 w-4" />
          完了する
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          <SkipForward className="h-4 w-4" />
          スキップ
        </button>
      </div>

      {/* 詳細情報（タスクマスタタブのみ） */}
      {showDetails && task.relatedInfo && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
          <strong>関連情報:</strong> {task.relatedInfo}
        </div>
      )}
    </div>
  );
}
