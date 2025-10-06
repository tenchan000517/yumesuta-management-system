'use client';

import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import type { Competitor, CompetitiveAnalysisAPIResponse } from '@/types/competitive-analysis';

export default function CompetitiveAnalysisPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set());

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/competitive-analysis');
      const json: CompetitiveAnalysisAPIResponse = await response.json();

      if (json.success && json.data) {
        setCompetitors(json.data.competitors);
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

  // アイコンコンポーネントを動的に取得
  const getIcon = (iconName?: string) => {
    if (!iconName) return <Icons.Globe className="w-4 h-4" />;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <Icons.ExternalLink className="w-4 h-4" />;
  };

  const toggleDocs = (index: number) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDocs(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Icons.Radar className="w-8 h-8 text-orange-600" />
                競合分析
              </h1>
              <p className="text-gray-600">競合企業のHP・SNS等の情報を一元管理</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-md"
            >
              {loading ? '読み込み中...' : '更新'}
            </button>
          </div>
          <a
            href="/"
            className="inline-flex items-center text-orange-600 hover:text-orange-800 font-medium"
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
        {!loading && competitors.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Icons.MousePointer className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">「更新」ボタンをクリックしてデータを読み込んでください</p>
          </div>
        )}

        {/* 競合企業カード表示 */}
        {competitors.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-700">
                <span className="font-semibold text-xl">{competitors.length}</span>社の競合企業
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitors.map((competitor, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  {/* 企業名 */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{competitor.companyName}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Icons.Tag className="w-3 h-3" />
                      {competitor.category}
                    </p>
                  </div>

                  {/* リンクボタン */}
                  <div className="space-y-2 mb-4">
                    {competitor.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg transition-colors group"
                      >
                        {getIcon(link.iconName)}
                        <span className="font-medium flex-1">{link.linkName}</span>
                        <Icons.ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>

                  {/* 資料セクション（アコーディオン） */}
                  {competitor.documents && competitor.documents.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => toggleDocs(index)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icons.FolderOpen className="w-4 h-4 text-gray-600" />
                          <h4 className="text-sm font-semibold text-gray-700">資料</h4>
                          <span className="text-xs text-gray-500">({competitor.documents.length}件)</span>
                        </div>
                        {expandedDocs.has(index) ? (
                          <Icons.ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Icons.ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      {expandedDocs.has(index) && (
                        <div className="mt-2 space-y-1">
                          {competitor.documents.map((doc, docIndex) => (
                            <a
                              key={docIndex}
                              href={doc.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded text-xs transition-colors group"
                            >
                              <Icons.FileText className="w-3 h-3 text-gray-500 flex-shrink-0" />
                              <span className="flex-1 truncate text-gray-700">{doc.name}</span>
                              <Icons.ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* メモ */}
                  {competitor.notes && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600 flex items-start gap-1">
                        <Icons.FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{competitor.notes}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
