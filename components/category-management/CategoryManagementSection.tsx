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
  readyProcesses?: string[]; // Phase 2: 準備OK工程リスト
  delayedProcessesMap?: Record<string, number>; // Phase 2: 遅延工程マップ (processNo -> 遅延日数)
  onSave: () => void;
  onOpenDrive: (categoryId: string) => void;
  onOpenCanva: (url: string | null) => void;
  onUpdateConfirmation?: (categoryId: string, status: string) => void; // Phase 3: Optional (移行中)
  onToggleExpand: (categoryId: string) => void;
  onUpdateActualDate?: (processNo: string, date: string) => void;
  onUpdatePlannedDate?: (processNo: string, date: string) => void;
}

export function CategoryManagementSection({
  categories,
  confirmationStatus,
  expandedCategory,
  readyProcesses = [],
  delayedProcessesMap = {},
  onSave,
  onOpenDrive,
  onOpenCanva,
  onUpdateConfirmation,
  onToggleExpand,
  onUpdateActualDate,
  onUpdatePlannedDate
}: CategoryManagementSectionProps) {
  const [showCategoryCards, setShowCategoryCards] = useState(false);
  const [editingActualDates, setEditingActualDates] = useState<Record<string, string>>({});
  const [editingPlannedDates, setEditingPlannedDates] = useState<Record<string, string>>({});

  // 今日の日付を M/D 形式で取得
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getMonth() + 1}/${today.getDate()}`;
  };

  // 実績日の完了ボタンをクリック
  const handleCompleteActualDate = (processId: string) => {
    const todayDate = getTodayDate();
    onUpdateActualDate?.(processId, todayDate);
  };

  // 実績日の保存ボタンをクリック
  const handleSaveActualDate = (processId: string) => {
    const value = editingActualDates[processId] || '';
    onUpdateActualDate?.(processId, value);
    // 保存後、編集状態をクリア
    setEditingActualDates(prev => {
      const next = { ...prev };
      delete next[processId];
      return next;
    });
  };

  // 予定日の保存ボタンをクリック
  const handleSavePlannedDate = (processId: string) => {
    const value = editingPlannedDates[processId] || '';
    onUpdatePlannedDate?.(processId, value);
    // 保存後、編集状態をクリア
    setEditingPlannedDates(prev => {
      const next = { ...prev };
      delete next[processId];
      return next;
    });
  };

  // カテゴリを内部チェックへ遷移
  const handleMoveToInternalCheck = (categoryId: string) => {
    onUpdateConfirmation?.(categoryId, '内部チェック');
  };

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
          {categories.filter(c => c.id !== 'Z').map((category) => {
            // 最後の工程を取得
            const lastProcess = category.processes[category.processes.length - 1];
            // 最後の工程の予定日が今日より前で、まだ完了していない場合は遅延
            const isDelayedCategory = lastProcess && !lastProcess.actualDate && (() => {
              if (!lastProcess.plannedDate || lastProcess.plannedDate === '-') return false;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const [month, day] = lastProcess.plannedDate.split('/').map(Number);
              const plannedDate = new Date(today.getFullYear(), month - 1, day);
              return plannedDate < today;
            })();
            const isCompletedCategory = confirmationStatus[category.id] === '内部チェック' || confirmationStatus[category.id] === '確認送付済';

            return (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* カードヘッダー */}
              <div className={`p-4 border-b border-gray-200 ${
                isDelayedCategory
                  ? 'bg-red-300'
                  : isCompletedCategory
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-blue-50 to-blue-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-bold text-lg ${
                    isDelayedCategory || isCompletedCategory
                      ? 'text-white'
                      : 'text-gray-900'
                  }`}>
                    {category.name}
                  </h3>
                  <span className={`text-2xl font-bold ${
                    isDelayedCategory || isCompletedCategory
                      ? 'text-white'
                      : 'text-blue-600'
                  }`}>{category.progress}%</span>
                </div>
                <div className={`w-full rounded-full h-2.5 mb-2 ${
                  isDelayedCategory || isCompletedCategory
                    ? 'bg-white'
                    : 'bg-gray-200'
                }`}>
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${category.progress}%` }}
                  ></div>
                </div>
                <p className={`text-sm ${
                  isDelayedCategory || isCompletedCategory
                    ? 'text-white'
                    : 'text-gray-600'
                }`}>
                  {category.completed}/{category.total}工程完了
                </p>

                {/* 100%完了 & 先方確認ステータスが空欄の場合: 内部チェックへ進むボタン */}
                {category.progress === 100 &&
                 (!confirmationStatus[category.id] || confirmationStatus[category.id] === '制作中') && (
                  <button
                    onClick={() => handleMoveToInternalCheck(category.id)}
                    className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                  >
                    ✓ 内部チェックへ進む
                  </button>
                )}
              </div>

              {/* 操作ボタン */}
              <div className={`p-4 border-b border-gray-200 ${
                isDelayedCategory
                  ? 'bg-red-300'
                  : isCompletedCategory
                  ? 'bg-green-500'
                  : 'bg-gray-50'
              }`}>
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

              {/* Phase 3: 確認ステータスUIをZセクションに移行 */}

              {/* 展開ボタン */}
              <div className={`p-4 ${
                isDelayedCategory
                  ? 'bg-red-300'
                  : isCompletedCategory
                  ? 'bg-green-500'
                  : ''
              }`}>
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
                    {category.processes.map((process) => {
                      const isReady = readyProcesses.includes(process.id);
                      const delayDays = delayedProcessesMap[process.id];

                      // カテゴリ名を工程名から削除（例: "メイン文字起こし" → "文字起こし"）
                      const cleanProcessName = process.name
                        .replace(/^メイン/, '')
                        .replace(/^インタビュー②/, '')
                        .replace(/^STAR①/, '')
                        .replace(/^STAR②/, '')
                        .replace(/^記事L/, '')
                        .replace(/^記事M/, '')
                        .replace(/^新規企業①?/, '')
                        .replace(/^既存企業/, '')
                        .replace(/^パートナー一覧/, '')
                        .replace(/^全体/, '')
                        .replace(/^固定ページ/, '')
                        .trim();

                      const isDelayed = delayDays !== undefined && delayDays > 0;
                      const isNotCompleted = !process.actualDate;
                      const isCompleted = !!process.actualDate;

                      return (
                        <div
                          key={process.id}
                          className={`border rounded-lg p-3 ${
                            isDelayed && isNotCompleted
                              ? 'bg-red-50 border-red-200'
                              : isCompleted
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900">{cleanProcessName || process.name}</p>
                              {/* Phase 2: 準備OK・遅延バッジ */}
                              <div className="flex gap-2 mt-2">
                                {isReady && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    ✓ 準備OK
                                  </span>
                                )}
                                {delayDays !== undefined && delayDays > 0 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    ⚠ {delayDays}日遅延
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="ml-2">{getStatusBadge(process.status)}</div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">予定日</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="例: 10/15"
                                  value={editingPlannedDates[process.id] ?? (process.plannedDate !== '-' ? process.plannedDate : '')}
                                  onChange={(e) => setEditingPlannedDates(prev => ({ ...prev, [process.id]: e.target.value }))}
                                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {editingPlannedDates[process.id] !== undefined && editingPlannedDates[process.id] !== (process.plannedDate !== '-' ? process.plannedDate : '') ? (
                                  <button
                                    onClick={() => handleSavePlannedDate(process.id)}
                                    className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                                    title="入力した日付で保存"
                                  >
                                    保存
                                  </button>
                                ) : null}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">実績日</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="例: 10/16"
                                  value={editingActualDates[process.id] ?? process.actualDate}
                                  onChange={(e) => setEditingActualDates(prev => ({ ...prev, [process.id]: e.target.value }))}
                                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {!process.actualDate && editingActualDates[process.id] === undefined ? (
                                  <button
                                    onClick={() => handleCompleteActualDate(process.id)}
                                    className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors whitespace-nowrap"
                                    title="今日の日付で完了"
                                  >
                                    完了
                                  </button>
                                ) : editingActualDates[process.id] !== undefined && editingActualDates[process.id] !== process.actualDate ? (
                                  <button
                                    onClick={() => handleSaveActualDate(process.id)}
                                    className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                                    title="入力した日付で保存"
                                  >
                                    保存
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
