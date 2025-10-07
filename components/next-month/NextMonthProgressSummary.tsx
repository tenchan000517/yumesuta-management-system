import { NextMonthProgressSummaryProps } from '@/types/next-month';

export function NextMonthProgressSummary({ processes }: NextMonthProgressSummaryProps) {
  const completed = processes.filter(p => p.status === 'completed').length;
  const inProgress = processes.filter(p => p.status === 'in_progress').length;
  const notStarted = processes.filter(p => p.status === 'not_started').length;
  const total = processes.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="mb-6">
      {/* プログレスバー */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-blue-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-bold text-lg whitespace-nowrap">
          {completed}/{total} ({progress.toFixed(0)}%)
        </span>
      </div>

      {/* 内訳 */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="text-gray-600">
            完了: <span className="font-semibold text-gray-900">{completed}工程</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span className="text-gray-600">
            進行中: <span className="font-semibold text-gray-900">{inProgress}工程</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-400"></span>
          <span className="text-gray-600">
            未着手: <span className="font-semibold text-gray-900">{notStarted}工程</span>
          </span>
        </div>
      </div>
    </div>
  );
}
