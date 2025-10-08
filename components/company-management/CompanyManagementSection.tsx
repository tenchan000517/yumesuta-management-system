'use client';

import { useState } from 'react';
import { Building2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { CompanyCard } from './CompanyCard';

interface CompanyField {
  index: number;
  name: string;
  key: string;
  value: string;
  filled: boolean;
  required: boolean;
}

interface Company {
  companyId: string;
  companyName: string;
  logoPath: string;
  industry: string;
  area: string;
  status: 'new' | 'updated' | 'existing';
  statusDescription: string;
  statusBadge: {
    label: string;
    bgColor: string;
    textColor: string;
  };
  progress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    progressRate: number;
  };
  fields: CompanyField[];
}

interface CompanyManagementSectionProps {
  companies: Company[];
  loading?: boolean;
  onRefresh?: () => void;
  onUpdateField?: (companyId: string, fieldKey: string, value: string) => void;
  onUpdateStatus?: (companyId: string, status: string) => void;
}

export function CompanyManagementSection({
  companies,
  loading = false,
  onRefresh,
  onUpdateField,
  onUpdateStatus,
}: CompanyManagementSectionProps) {
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  const [showCompanyCards, setShowCompanyCards] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  const toggleCompanyExpand = (companyId: string) => {
    setExpandedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });
  };

  // 全社展開/折りたたみ
  const expandAll = () => {
    setExpandedCompanies(new Set(companies.map(c => c.companyId)));
  };

  const collapseAll = () => {
    setExpandedCompanies(new Set());
  };

  // サマリー計算
  const summary = {
    total: companies.length,
    new: companies.filter(c => c.status === 'new').length,
    updated: companies.filter(c => c.status === 'updated').length,
    existing: companies.filter(c => c.status === 'existing').length,
    avgProgress: companies.length > 0
      ? Math.round(companies.reduce((sum, c) => sum + c.progress.progressRate, 0) / companies.length)
      : 0,
  };

  return (
    <div className="bg-white rounded-xl shadow-md">
      {/* セクションヘッダー */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">企業紹介ページ管理</h2>
            {loading && (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {isSectionExpanded && (
              <>
                <button
                  onClick={expandAll}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  全社展開
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                >
                  全社折りたたみ
                </button>
              </>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                更新
              </button>
            )}
            <button
              onClick={() => setIsSectionExpanded(!isSectionExpanded)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              {isSectionExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">総企業数</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total}社</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-xs text-orange-700 mb-1">新規企業</div>
            <div className="text-2xl font-bold text-orange-900">{summary.new}社</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-700 mb-1">変更企業</div>
            <div className="text-2xl font-bold text-blue-900">{summary.updated}社</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-700 mb-1">継続企業</div>
            <div className="text-2xl font-bold text-green-900">{summary.existing}社</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-xs text-purple-700 mb-1">平均進捗</div>
            <div className="text-2xl font-bold text-purple-900">{summary.avgProgress}%</div>
          </div>
        </div>
      </div>

      {/* 折りたたみボタン */}
      {isSectionExpanded && (
        <div className="py-6">
          <div className="flex justify-center">
            <button
              onClick={() => setShowCompanyCards(!showCompanyCards)}
              className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              {showCompanyCards ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  企業詳細を閉じる
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  企業詳細を開く
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 企業カードリスト（折りたたみ可能） */}
      {isSectionExpanded && showCompanyCards && (
        <div className="p-6">
          {companies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">今号の掲載企業はありません</p>
              <p className="text-sm mt-2">企業マスターを確認してください</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {companies.map(company => (
                <CompanyCard
                  key={company.companyId}
                  company={company}
                  isExpanded={expandedCompanies.has(company.companyId)}
                  onToggleExpand={() => toggleCompanyExpand(company.companyId)}
                  onUpdateField={onUpdateField}
                  onUpdateStatus={onUpdateStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
