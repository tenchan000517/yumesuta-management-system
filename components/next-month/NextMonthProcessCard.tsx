import { NextMonthProcessCardProps } from '@/types/next-month';

export function NextMonthProcessCard({ process }: NextMonthProcessCardProps) {
  const statusConfig = {
    completed: {
      icon: '✅',
      label: '完了',
      color: 'bg-green-100 border-green-500'
    },
    in_progress: {
      icon: '🔵',
      label: '進行中',
      color: 'bg-blue-100 border-blue-500'
    },
    not_started: {
      icon: '⚪',
      label: '未着手',
      color: 'bg-gray-100 border-gray-300'
    }
  };

  const { icon, label, color } = statusConfig[process.status];

  // 工程名から月号表記を除去（簡略化）
  const simplifiedName = process.name
    .replace(/ゆめマガ\d+月号/, '')
    .replace(/【\d+月号】/, '');

  return (
    <div className={`border-2 rounded-lg p-4 ${color} transition-all hover:shadow-md`}>
      {/* 工程No */}
      <div className="font-bold text-sm mb-1 text-gray-800">
        {process.processNo}
      </div>

      {/* 工程名 */}
      <div className="text-xs text-gray-700 mb-3 line-clamp-2 min-h-[2.5rem]">
        {simplifiedName}
      </div>

      {/* ステータスと予定日 */}
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <div className="text-right">
          <div className="text-xs text-gray-500">予定</div>
          <div className="text-sm font-bold">{process.plannedDate}</div>
        </div>
      </div>

      {/* 実績日（完了時のみ表示） */}
      {process.actualDate && (
        <div className="mt-2 pt-2 border-t border-gray-300">
          <div className="text-xs text-gray-600">
            実績: <span className="font-semibold">{process.actualDate}</span>
          </div>
        </div>
      )}
    </div>
  );
}
