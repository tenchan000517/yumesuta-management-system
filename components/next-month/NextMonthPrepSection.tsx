import { NextMonthPrepSectionProps, NextMonthCategory } from '@/types/next-month';
import { NextMonthProgressSummary } from './NextMonthProgressSummary';
import { NextMonthCategoryCard } from './NextMonthCategoryCard';
import { Calendar, RefreshCw, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { useState, useMemo } from 'react';

// カテゴリ定義
const categoryDefinitions = [
  {
    id: 'PREP',
    name: '企画・準備',
    icon: '',
    processNos: ['S-1', 'S-2']
  },
  {
    id: 'A',
    name: 'メイン(A)',
    icon: '',
    processNos: ['A-1']
  },
  {
    id: 'K',
    name: 'インタビュー②(K)',
    icon: '',
    processNos: ['K-1']
  },
  {
    id: 'L',
    name: '学校取材①(L)',
    icon: '',
    processNos: ['L-1', 'L-2', 'L-3']
  },
  {
    id: 'M',
    name: '学校取材②(M)',
    icon: '',
    processNos: ['M-1', 'M-2', 'M-3']
  },
  {
    id: 'H',
    name: 'STAR①(H)',
    icon: '',
    processNos: ['H-1']
  },
  {
    id: 'I',
    name: 'STAR②(I)',
    icon: '',
    processNos: ['I-1']
  },
  {
    id: 'C',
    name: '新規企業①(C)',
    icon: '',
    processNos: ['C-1', 'C-3']
  }
];

export function NextMonthPrepSection({
  nextMonthIssue,
  processes,
  companyPrepTasks,
  onRefresh,
  onUpdateActualDate,
  onUpdateCompanyActualDate,
  onUpdateCompanyPlannedDate
}: NextMonthPrepSectionProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showCompanyCards, setShowCompanyCards] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  const handleRefresh = () => {
    setIsRefreshing(true);
    try {
      onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // 工程データをカテゴリ単位に集約
  const categories: NextMonthCategory[] = useMemo(() => {
    return categoryDefinitions.map(catDef => {
      const categoryProcesses = processes.filter(p =>
        catDef.processNos.includes(p.processNo)
      );

      const completed = categoryProcesses.filter(p => p.status === 'completed').length;
      const total = categoryProcesses.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: catDef.id,
        name: catDef.name,
        icon: catDef.icon,
        processNos: catDef.processNos,
        progress,
        completed,
        total,
        processes: categoryProcesses
      };
    });
  }, [processes]);

  // 次月号工程が存在しない場合は非表示
  if (!processes || processes.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 bg-white rounded-xl shadow-md p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
          <Calendar className="w-6 h-6 text-blue-600" />
          次月号事前準備（{nextMonthIssue}）
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          更新
        </button>
      </div>

      {/* 進捗サマリー */}
      <NextMonthProgressSummary processes={processes} />

      {/* 折りたたみボタン */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setShowCards(!showCards)}
          className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
        >
          {showCards ? (
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
      {showCards && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {categories.map(category => (
            <NextMonthCategoryCard
              key={category.id}
              category={category}
              expanded={expandedCategory === category.id}
              onToggleExpand={() =>
                setExpandedCategory(expandedCategory === category.id ? null : category.id)
              }
              onUpdateActualDate={onUpdateActualDate}
            />
          ))}
        </div>
      )}

      {/* 企業別準備タスク */}
      {companyPrepTasks && companyPrepTasks.length > 0 && (
        <>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <Building2 className="w-5 h-5 text-purple-600" />
                企業別準備タスク（{companyPrepTasks.length}社）
              </h3>
              <button
                onClick={() => setShowCompanyCards(!showCompanyCards)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
              >
                {showCompanyCards ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    企業詳細を閉じる
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    企業詳細を開く
                  </>
                )}
              </button>
            </div>

            {showCompanyCards && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {companyPrepTasks.map(company => {
                  const isExpanded = expandedCompanies.has(company.companyId);

                  return (
                    <div key={company.companyId} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="p-4 bg-purple-50 border-b border-purple-200">
                        <h4 className="font-bold text-gray-900">{company.companyName}</h4>
                        <span className="text-xs px-2 py-1 rounded font-semibold bg-purple-100 text-purple-800 inline-block mt-2">
                          {company.status}
                        </span>
                      </div>

                      <div className="p-4 space-y-3">
                        {company.tasks.map((task: any) => (
                          <div key={task.taskId}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-gray-900">{task.taskName}</span>
                            </div>
                            {task.details && task.details.length > 0 && task.details.map((detail: any, idx: number) => (
                              <div key={idx} className="mt-2">
                                {detail.type === 'process' && onUpdateCompanyActualDate && onUpdateCompanyPlannedDate && (
                                  <div className="border rounded-lg p-2 bg-gray-50">
                                    <div className="space-y-2">
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">予定日</label>
                                        <input
                                          type="text"
                                          placeholder="例: 10/15"
                                          defaultValue={detail.plannedDate !== '-' ? detail.plannedDate : ''}
                                          onBlur={(e) => {
                                            if (e.target.value && e.target.value !== detail.plannedDate) {
                                              onUpdateCompanyPlannedDate(detail.processNo, e.target.value);
                                            }
                                          }}
                                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">実績日</label>
                                        {detail.completed ? (
                                          <span className="block px-2 py-1 text-xs border border-gray-300 rounded bg-green-50 text-green-700 font-semibold">
                                            {detail.actualDate}
                                          </span>
                                        ) : (
                                          <div className="flex gap-2">
                                            <input
                                              type="text"
                                              placeholder="例: 10/16"
                                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.currentTarget.value) {
                                                  onUpdateCompanyActualDate(detail.processNo, e.currentTarget.value);
                                                }
                                              }}
                                            />
                                            <button
                                              onClick={() => {
                                                const today = new Date();
                                                const todayDate = `${today.getMonth() + 1}/${today.getDate()}`;
                                                onUpdateCompanyActualDate(detail.processNo, todayDate);
                                              }}
                                              className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors whitespace-nowrap"
                                            >
                                              完了
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
