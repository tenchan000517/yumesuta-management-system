'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface TaskDetail {
  type?: 'file' | 'form' | 'folder' | 'process';
  name?: string;
  folder?: string;
  fileCount?: number;
  filledCount?: number;
  totalCount?: number;
  completed?: boolean;
  hasFiles?: boolean;
  progress?: number;
  processNo?: string;
  plannedDate?: string;
  actualDate?: string;
}

interface Task {
  taskId: string;
  taskName: string;
  progress: number;
  details?: TaskDetail[];
  note?: string;
}

interface Company {
  companyId: string;
  companyName: string;
  status: string;
  categoryId: string;
  progress: number;
  tasks: Task[];
}

interface CompanyPageProductionSectionProps {
  newCompanies: Company[];
  updatedCompanies: Company[];
  summary: {
    totalNew: number;
    completedNew: number;
    totalUpdated: number;
    completedUpdated: number;
  };
  loading?: boolean;
  onRefresh?: () => void;
  onUpdateActualDate?: (processNo: string, date: string) => Promise<void>;
  onUpdatePlannedDate?: (processNo: string, date: string) => Promise<void>;
}

export function CompanyPageProductionSection({
  newCompanies,
  updatedCompanies,
  summary,
  loading = false,
  onRefresh,
  onUpdateActualDate,
  onUpdatePlannedDate,
}: CompanyPageProductionSectionProps) {
  const [showNewCompanies, setShowNewCompanies] = useState(true);
  const [showUpdatedCompanies, setShowUpdatedCompanies] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-md">
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">企業別ページ制作進捗</h2>
            {loading && (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          )}
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-xs text-orange-700 mb-1">新規企業</div>
            <div className="text-2xl font-bold text-orange-900">
              {summary.completedNew}/{summary.totalNew}社完了
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-700 mb-1">変更企業</div>
            <div className="text-2xl font-bold text-blue-900">
              {summary.completedUpdated}/{summary.totalUpdated}社完了
            </div>
          </div>
        </div>
      </div>

      {/* 新規企業セクション */}
      <div className="p-6 border-b border-gray-200">
        <button
          onClick={() => setShowNewCompanies(!showNewCompanies)}
          className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          {showNewCompanies ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
          新規企業（{newCompanies.length}社）
        </button>

        {showNewCompanies && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {newCompanies.map((company) => (
              <CompanyCard key={company.companyId} company={company} onUpdateActualDate={onUpdateActualDate} onUpdatePlannedDate={onUpdatePlannedDate} />
            ))}
          </div>
        )}
      </div>

      {/* 変更企業セクション */}
      <div className="p-6">
        <button
          onClick={() => setShowUpdatedCompanies(!showUpdatedCompanies)}
          className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          {showUpdatedCompanies ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
          変更企業（{updatedCompanies.length}社）
        </button>

        {showUpdatedCompanies && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {updatedCompanies.map((company) => (
              <CompanyCard key={company.companyId} company={company} onUpdateActualDate={onUpdateActualDate} onUpdatePlannedDate={onUpdatePlannedDate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 企業カードコンポーネント
function CompanyCard({ company, onUpdateActualDate, onUpdatePlannedDate }: {
  company: Company;
  onUpdateActualDate?: (processNo: string, date: string) => Promise<void>;
  onUpdatePlannedDate?: (processNo: string, date: string) => Promise<void>;
}) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingProcess, setEditingProcess] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>('');
  const isCompleted = company.progress === 100;

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleUpdateActualDate = async (processNo: string, date: string) => {
    if (!onUpdateActualDate) return;

    try {
      await onUpdateActualDate(processNo, date);
      setEditingProcess(null);
      setTempDate('');
    } catch (error) {
      console.error('実績日更新エラー:', error);
      alert('実績日の更新に失敗しました');
    }
  };

  const handleUpdatePlannedDate = async (processNo: string, date: string) => {
    if (!onUpdatePlannedDate) return;

    try {
      await onUpdatePlannedDate(processNo, date);
      setEditingProcess(null);
      setTempDate('');
    } catch (error) {
      console.error('予定日更新エラー:', error);
      alert('予定日の更新に失敗しました');
    }
  };

  const handleCompleteToday = async (processNo: string) => {
    const today = new Date().toISOString().split('T')[0];
    await handleUpdateActualDate(processNo, today);
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${
      isCompleted
        ? 'border-green-300 bg-green-50'
        : 'border-gray-200 bg-white'
    }`}>
      {/* カードヘッダー */}
      <div className={`p-4 border-b ${
        isCompleted
          ? 'bg-green-100 border-green-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900">{company.companyName}</h3>
          <span className={`text-xs px-2 py-1 rounded font-semibold ${
            company.status === '新規'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {company.status}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isCompleted ? 'bg-green-600' : 'bg-blue-600'
            }`}
            style={{ width: `${company.progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">{company.progress}%</p>
      </div>

      {/* タスクリスト */}
      <div className="p-4">
        <div className="space-y-3">
          {company.tasks.map((task) => {
            const isExpanded = expandedTasks.has(task.taskId);
            const hasDetails = task.details && task.details.length > 0;

            return (
              <div key={task.taskId}>
                {/* タスク名とプログレスバー */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">{task.taskName}</span>
                  <span className="text-xs text-gray-600">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>

                {/* 詳細表示トグルボタン */}
                {hasDetails && (
                  <button
                    onClick={() => toggleTaskExpansion(task.taskId)}
                    className="text-xs text-blue-600 hover:text-blue-800 mb-2"
                  >
                    {isExpanded ? '詳細を閉じる ▲' : '詳細を見る ▼'}
                  </button>
                )}

                {/* 詳細表示 */}
                {isExpanded && hasDetails && (
                  <div className="mt-2 pl-2 space-y-1">
                    {task.details!.map((detail, idx) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                        {detail.type === 'file' && (
                          <>
                            <span className={detail.completed ? 'text-green-600' : 'text-red-600'}>
                              {detail.completed ? '✅' : '❌'}
                            </span>
                            <span>{detail.name}: {detail.fileCount}ファイル</span>
                          </>
                        )}
                        {detail.type === 'form' && (
                          <>
                            <span>{detail.name}:</span>
                            <span className="font-semibold">{detail.filledCount}/{detail.totalCount}項目 ({detail.progress}%)</span>
                          </>
                        )}
                        {detail.type === 'folder' && (
                          <>
                            <span className={detail.hasFiles ? 'text-green-600' : 'text-gray-400'}>
                              {detail.hasFiles ? '✅' : '❌'}
                            </span>
                            <span>{detail.folder}: {detail.fileCount}ファイル</span>
                          </>
                        )}
                        {detail.type === 'process' && (
                          <div className="w-full border rounded-lg p-2 bg-white border-gray-200">
                            <p className="font-semibold text-sm text-gray-900 mb-2">{detail.name}</p>
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">予定日</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="例: 10/15"
                                    value={editingProcess === `${detail.processNo}-planned` ? tempDate : (detail.plannedDate !== '-' ? detail.plannedDate : '')}
                                    onChange={(e) => {
                                      setEditingProcess(`${detail.processNo}-planned`);
                                      setTempDate(e.target.value);
                                    }}
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  {editingProcess === `${detail.processNo}-planned` && tempDate !== (detail.plannedDate !== '-' ? detail.plannedDate : '') && (
                                    <button
                                      onClick={() => handleUpdatePlannedDate(detail.processNo || '', tempDate)}
                                      className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                                      title="入力した日付で保存"
                                    >
                                      保存
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">実績日</label>
                                <div className="flex gap-2">
                                  {detail.completed ? (
                                    <span className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded bg-green-50 text-green-700 font-semibold">
                                      {detail.actualDate}
                                    </span>
                                  ) : (
                                    <>
                                      <input
                                        type="text"
                                        placeholder="例: 10/16"
                                        value={editingProcess === `${detail.processNo}-actual` ? tempDate : ''}
                                        onChange={(e) => {
                                          setEditingProcess(`${detail.processNo}-actual`);
                                          setTempDate(e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && tempDate) {
                                            handleUpdateActualDate(detail.processNo || '', tempDate);
                                          }
                                        }}
                                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      {!tempDate || editingProcess !== `${detail.processNo}-actual` ? (
                                        <button
                                          onClick={() => handleCompleteToday(detail.processNo || '')}
                                          className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors whitespace-nowrap"
                                          title="今日の日付で完了"
                                        >
                                          完了
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleUpdateActualDate(detail.processNo || '', tempDate)}
                                          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                                          title="入力した日付で保存"
                                        >
                                          保存
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ノート */}
                {task.note && (
                  <p className="text-xs text-gray-500 mt-1">{task.note}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
