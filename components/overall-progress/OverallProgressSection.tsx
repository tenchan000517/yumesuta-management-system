'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  progress: number;
  completed: number;
  total: number;
  confirmationStatus: string;
}

interface OverallProgressSectionProps {
  categories: Category[];
  onUpdateConfirmationStatus: (categoryId: string, status: string) => void;
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
    '制作中': { label: '制作中', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
    '内部チェック': { label: '内部チェック', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    '確認送付': { label: '確認送付', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    '確認待ち': { label: '確認待ち', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
    '確認OK': { label: '確認OK', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  };

  const config = statusConfig[status] || statusConfig['制作中'];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
}

function getCardBackgroundColor(status: string): string {
  const colorMap: Record<string, string> = {
    '制作中': 'bg-gray-100',
    '内部チェック': 'bg-blue-100',
    '確認送付': 'bg-purple-100',
    '確認待ち': 'bg-yellow-100',
    '確認OK': 'bg-green-100',
  };
  return colorMap[status] || 'bg-gray-100';
}

function getHeaderBackgroundColor(status: string): string {
  const colorMap: Record<string, string> = {
    '制作中': 'bg-gray-200',
    '内部チェック': 'bg-blue-200',
    '確認送付': 'bg-purple-200',
    '確認待ち': 'bg-yellow-200',
    '確認OK': 'bg-green-200',
  };
  return colorMap[status] || 'bg-gray-200';
}

export function OverallProgressSection({
  categories,
  onUpdateConfirmationStatus,
}: OverallProgressSectionProps) {
  const [loadingCategories, setLoadingCategories] = useState<Record<string, boolean>>({});

  // ステータス変更ハンドラー（ローディング表示付き）
  const handleStatusChange = async (categoryId: string, status: string) => {
    setLoadingCategories(prev => ({ ...prev, [categoryId]: true }));
    try {
      await onUpdateConfirmationStatus(categoryId, status);
    } finally {
      setLoadingCategories(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  // Z以外のカテゴリを表示
  const displayCategories = categories.filter(c => c.id !== 'Z');

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">全体進捗管理（ディレクター）</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {displayCategories.map(category => (
          <div
            key={category.id}
            className={`border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all ${getCardBackgroundColor(category.confirmationStatus)}`}
          >
            {/* カードヘッダー */}
            <div className={`p-4 border-b border-gray-300 ${getHeaderBackgroundColor(category.confirmationStatus)}`}>
              <h3 className="font-bold text-gray-900 text-lg mb-2">
                {category.name}
              </h3>
              <div className="mb-2">
                {getStatusBadge(category.confirmationStatus)}
              </div>
            </div>

            {/* ステータス選択 */}
            <div className="p-4">
              <h4 className="font-semibold text-sm text-gray-900 mb-2">ステータス変更</h4>
              <div className="relative">
                <select
                  value={category.confirmationStatus}
                  onChange={(e) => handleStatusChange(category.id, e.target.value)}
                  disabled={loadingCategories[category.id]}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="制作中">制作中</option>
                  <option value="内部チェック">内部チェック</option>
                  <option value="確認送付">確認送付</option>
                  <option value="確認待ち">確認待ち</option>
                  <option value="確認OK">確認OK</option>
                </select>
                {loadingCategories[category.id] && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              {loadingCategories[category.id] && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  更新中...
                </p>
              )}
            </div>

            {/* 内部チェックアシスト（内部チェックステータスの場合のみ表示） */}
            {category.confirmationStatus === '内部チェック' && (
              <div className="p-4 border-t border-blue-300">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">内部チェックアシスト</h4>
                <div className="space-y-2">
                  <button className="w-full px-3 py-1.5 text-sm bg-white border border-blue-300 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all text-left">
                    チェックリスト
                  </button>
                  <button className="w-full px-3 py-1.5 text-sm bg-white border border-purple-300 rounded-lg hover:border-purple-500 hover:shadow-sm transition-all text-left">
                    AI誤字脱字チェック
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
