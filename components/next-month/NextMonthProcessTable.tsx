import { NextMonthProcessTableProps } from '@/types/next-month';
import { useState } from 'react';

export function NextMonthProcessTable({ processes, onUpdateActualDate }: NextMonthProcessTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleDateChange = async (processNo: string, value: string) => {
    setUpdating(processNo);
    try {
      // YYYY-MM-DD → MM/DD形式に変換
      const date = value ? new Date(value) : null;
      const formattedDate = date
        ? `${date.getMonth() + 1}/${date.getDate()}`
        : '';

      await onUpdateActualDate(processNo, formattedDate);
    } catch (error) {
      console.error('実績日更新エラー:', error);
      alert('実績日の更新に失敗しました');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'in_progress':
        return '進行中';
      case 'not_started':
        return '未着手';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // MM/DD → YYYY-MM-DD形式に変換（input[type="date"]用）
  const convertToInputDate = (mmdd: string | undefined): string => {
    if (!mmdd) return '';
    const [month, day] = mmdd.split('/');
    const year = new Date().getFullYear();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
              工程No
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
              工程名
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
              予定日
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
              実績日
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">
              ステータス
            </th>
          </tr>
        </thead>
        <tbody>
          {processes.map(process => (
            <tr key={process.processNo} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                {process.processNo}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-sm">
                {process.name}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-sm">
                {process.plannedDate}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <input
                  type="date"
                  value={convertToInputDate(process.actualDate)}
                  onChange={(e) => handleDateChange(process.processNo, e.target.value)}
                  disabled={updating === process.processNo}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-full disabled:opacity-50"
                />
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(process.status)}`}>
                  {getStatusLabel(process.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
