'use client';

import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import type { QuickAccessButton, QuickAccessAPIResponse } from '@/types/quick-access';

type Category = '分析ツール' | 'スプレッドシート' | 'SNS管理' | 'CANVA' | 'AIツール' | '業務ツール' | 'HP・サーバー';

const CATEGORIES: Category[] = [
  '分析ツール',
  'スプレッドシート',
  'SNS管理',
  'CANVA',
  'AIツール',
  '業務ツール',
  'HP・サーバー',
];

const CATEGORY_COLORS: Record<Category, string> = {
  '分析ツール': 'bg-green-50 border-green-200',
  'スプレッドシート': 'bg-blue-50 border-blue-200',
  'SNS管理': 'bg-purple-50 border-purple-200',
  'CANVA': 'bg-orange-50 border-orange-200',
  'AIツール': 'bg-purple-50 border-purple-200',
  '業務ツール': 'bg-gray-50 border-gray-200',
  'HP・サーバー': 'bg-green-50 border-green-200',
};

const BG_COLOR_CLASSES = {
  blue: 'bg-blue-500 hover:bg-blue-600',
  green: 'bg-green-500 hover:bg-green-600',
  orange: 'bg-orange-500 hover:bg-orange-600',
  purple: 'bg-purple-500 hover:bg-purple-600',
  gray: 'bg-gray-500 hover:bg-gray-600',
};

export default function QuickAccessPage() {
  const [buttons, setButtons] = useState<QuickAccessButton[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quick-access');
      const json: QuickAccessAPIResponse = await response.json();

      if (json.success && json.data) {
        setButtons(json.data.buttons);
      } else {
        setError(json.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時に自動でデータ取得
  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // カテゴリー別にボタンをグルーピング
  const buttonsByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = buttons.filter((btn) => btn.category === category);
    return acc;
  }, {} as Record<Category, QuickAccessButton[]>);

  // アイコンコンポーネントを動的に取得
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">クイックアクセス</h1>
              <p className="text-gray-600">よく使うツールやリンクに素早くアクセス</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-md"
            >
              {loading ? '読み込み中...' : '更新'}
            </button>
          </div>
          <a
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <Icons.ArrowLeft className="w-4 h-4 mr-1" />
            ダッシュボードに戻る
          </a>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* データ未取得時のメッセージ */}
        {!loading && buttons.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Icons.MousePointer className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">「更新」ボタンをクリックしてデータを読み込んでください</p>
          </div>
        )}

        {/* カテゴリー別表示 */}
        {buttons.length > 0 && (
          <div className="space-y-6">
            {CATEGORIES.map((category) => {
              const categoryButtons = buttonsByCategory[category];
              if (categoryButtons.length === 0) return null;

              return (
                <div
                  key={category}
                  className={`p-6 rounded-lg border-2 ${CATEGORY_COLORS[category]} shadow-sm`}
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Icons.Folder className="w-5 h-5 mr-2" />
                    {category}
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({categoryButtons.length}件)
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {categoryButtons.map((button, index) => {
                      const bgColorClass = BG_COLOR_CLASSES[button.bgColor || 'blue'];

                      return (
                        <a
                          key={`${button.buttonName}-${index}`}
                          href={button.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-center gap-2 px-4 py-3 ${bgColorClass} text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium text-sm`}
                        >
                          {getIcon(button.iconName)}
                          <span className="truncate">{button.buttonName}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
