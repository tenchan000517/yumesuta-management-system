import { NextMonthCategoryCardProps } from '@/types/next-month';

export function NextMonthCategoryCard({
  category,
  expanded,
  onToggleExpand,
  onUpdateActualDate
}: NextMonthCategoryCardProps) {

  const getStatusBadge = (status: 'completed' | 'in_progress' | 'not_started') => {
    const statusConfig = {
      completed: {
        label: '完了',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800'
      },
      in_progress: {
        label: '進行中',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      },
      not_started: {
        label: '未着手',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600'
      }
    };

    const { label, bgColor, textColor } = statusConfig[status];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  // 工程名から月号表記を除去（簡略化）
  const simplifyProcessName = (name: string) => {
    return name
      .replace(/ゆめマガ\d+月号/, '')
      .replace(/【\d+月号】/, '');
  };

  // ステータス別の工程数を計算
  const statusSummary = {
    completed: category.processes.filter(p => p.status === 'completed').length,
    inProgress: category.processes.filter(p => p.status === 'in_progress').length,
    notStarted: category.processes.filter(p => p.status === 'not_started').length
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* カードヘッダー */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900 text-lg">
            {category.name}
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

      {/* ステータス別サマリー */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-around text-center text-sm">
          <div>
            <div className="font-semibold text-green-600">{statusSummary.completed}</div>
            <div className="text-xs text-gray-500">完了</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{statusSummary.inProgress}</div>
            <div className="text-xs text-gray-500">進行中</div>
          </div>
          <div>
            <div className="font-semibold text-gray-600">{statusSummary.notStarted}</div>
            <div className="text-xs text-gray-500">未着手</div>
          </div>
        </div>
      </div>

      {/* 展開ボタン */}
      <div className="p-4">
        <button
          onClick={onToggleExpand}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
        >
          {expanded ? '閉じる ▲' : '工程詳細を開く ▼'}
        </button>
      </div>

      {/* 工程詳細（展開時） */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {category.processes.map((process) => (
              <div
                key={process.processNo}
                className="border border-gray-200 rounded-lg p-3 bg-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {process.processNo}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900">
                      {simplifyProcessName(process.name)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      予定: {process.plannedDate}
                    </p>
                  </div>
                  <div className="ml-2">{getStatusBadge(process.status)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 flex-shrink-0">実績日:</label>
                  <input
                    type="text"
                    placeholder="MM/DD"
                    defaultValue={process.actualDate}
                    onBlur={(e) => {
                      if (e.target.value !== process.actualDate) {
                        onUpdateActualDate(process.processNo, e.target.value);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
