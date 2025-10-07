'use client';

import { useState, useMemo } from 'react';
import { Save, Folder, ChevronDown, ChevronUp } from 'lucide-react';

interface Process {
  id: string;
  name: string;
  plannedDate: string;
  actualDate: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
  progress: number;
  completed: number;
  total: number;
  canvaUrl: string | null;
  confirmationRequired: boolean;
  processes: Process[];
}

interface CategoryManagementSectionProps {
  categories: Category[];
  confirmationStatus: Record<string, string>;
  expandedCategory: string | null;
  onSave: () => void;
  onOpenDrive: (categoryId: string) => void;
  onOpenCanva: (url: string | null) => void;
  onUpdateConfirmation: (categoryId: string, status: string) => void;
  onToggleExpand: (categoryId: string) => void;
  onUpdateActualDate?: (processNo: string, date: string) => void;
}

export function CategoryManagementSection({
  categories,
  confirmationStatus,
  expandedCategory,
  onSave,
  onOpenDrive,
  onOpenCanva,
  onUpdateConfirmation,
  onToggleExpand,
  onUpdateActualDate
}: CategoryManagementSectionProps) {
  const [showCategoryCards, setShowCategoryCards] = useState(false);

  // 全体進捗を計算（カテゴリZを除く全カテゴリの平均）
  const overallProgress = useMemo(() => {
    const validCategories = categories.filter(c => c.id !== 'Z');

    // 全工程を集計
    const allProcesses = validCategories.flatMap(c => c.processes);
    const completed = allProcesses.filter(p => p.status === 'completed').length;
    const inProgress = allProcesses.filter(p => p.status === 'in_progress').length;
    const notStarted = allProcesses.filter(p => p.status === 'not_started').length;
    const delayed = allProcesses.filter(p => p.status === 'delayed').length;
    const total = allProcesses.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      progress,
      completed,
      inProgress,
      notStarted,
      delayed,
      total
    };
  }, [categories]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: '完了', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      in_progress: { label: '進行中', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      not_started: { label: '未着手', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
      delayed: { label: '遅延', bgColor: 'bg-red-100', textColor: 'text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  const getConfirmationStatusBadge = (status: string) => {
    const statusConfig = {
      '未送付': { label: '未送付', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
      '確認待ち': { label: '⏳ 確認待ち', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
      '確認OK': { label: '✅ 確認OK', bgColor: 'bg-green-100', textColor: 'text-green-700' },
      '-': { label: '-', bgColor: 'bg-gray-50', textColor: 'text-gray-400' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['未送付'];

    return (
      <span className={`text-xs px-2 py-1 ${config.bgColor} ${config.textColor} rounded font-semibold`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Folder className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">カテゴリ別予実管理</h2>
        </div>
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <Save className="w-5 h-5" />
          一括保存
        </button>
      </div>

      {/* 全体進捗（常に表示） */}
      <div className="mb-6">
        {/* プログレスバー */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-purple-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress.progress}%` }}
            />
          </div>
          <span className="font-bold text-lg whitespace-nowrap">
            {overallProgress.completed}/{overallProgress.total} ({overallProgress.progress}%)
          </span>
        </div>

        {/* 内訳 */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">
              完了: <span className="font-semibold text-gray-900">{overallProgress.completed}工程</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-gray-600">
              進行中: <span className="font-semibold text-gray-900">{overallProgress.inProgress}工程</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="text-gray-600">
              未着手: <span className="font-semibold text-gray-900">{overallProgress.notStarted}工程</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600">
              遅延: <span className="font-semibold text-gray-900">{overallProgress.delayed}工程</span>
            </span>
          </div>
        </div>
      </div>

      {/* 折りたたみボタン */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setShowCategoryCards(!showCategoryCards)}
          className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
        >
          {showCategoryCards ? (
            <>
              <ChevronUp className="w-5 h-5" />
              カテゴリ詳細を閉じる
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              カテゴリ詳細を開く
            </>
          )}
        </button>
      </div>

      {/* カテゴリカード一覧（折りたたみ可能） */}
      {showCategoryCards && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.filter(c => c.id !== 'Z').map((category) => (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* カードヘッダー */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">
                    カテゴリ{category.id}: {category.name}
                  </h3>
                  <span className="text-2xl font-bold text-blue-600">{category.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${category.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {category.completed}/{category.total}工程完了
                </p>
              </div>

              {/* 操作ボタン */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => onOpenDrive(category.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                  >
                    <Folder className="w-4 h-4" />
                    Drive
                  </button>
                  <button
                    onClick={() => onOpenCanva(category.canvaUrl)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                  >
                    Canva
                  </button>
                </div>
                {!category.canvaUrl && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    ※未登録のためメインページへ移動
                  </p>
                )}
              </div>

              {/* 先方確認ステータス */}
              {category.confirmationRequired && (
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h4 className="font-semibold text-sm text-gray-900 mb-2">先方確認ステータス</h4>
                  <div className="mb-2">
                    {getConfirmationStatusBadge(confirmationStatus[category.id] || '未送付')}
                  </div>
                  <select
                    value={confirmationStatus[category.id] || '未送付'}
                    onChange={(e) => onUpdateConfirmation(category.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="未送付">未送付</option>
                    <option value="確認待ち">確認待ち</option>
                    <option value="確認OK">確認OK</option>
                  </select>
                </div>
              )}

              {/* 展開ボタン */}
              <div className="p-4">
                <button
                  onClick={() => onToggleExpand(category.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  {expandedCategory === category.id ? '閉じる ▲' : '工程詳細を開く ▼'}
                </button>
              </div>

              {/* 工程詳細（展開時） */}
              {expandedCategory === category.id && (
                <div className="px-4 pb-4">
                  <div className="space-y-2">
                    {category.processes.map((process) => (
                      <div
                        key={process.id}
                        className="border border-gray-200 rounded-lg p-3 bg-white"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900">{process.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              予定: {process.plannedDate}
                            </p>
                          </div>
                          <div className="ml-2">{getStatusBadge(process.status)}</div>
                        </div>
                        <input
                          type="text"
                          placeholder="実績日を入力"
                          defaultValue={process.actualDate}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
