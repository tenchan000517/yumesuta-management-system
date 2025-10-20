'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, RefreshCw, Search } from 'lucide-react';
import type {
  YumeMagaCompany,
  CompanySummary,
  CompanySearchParams,
} from '@/types/customer';

export default function CustomersDashboard() {
  const [companies, setCompanies] = useState<YumeMagaCompany[]>([]);
  const [summary, setSummary] = useState<CompanySummary>({
    total: 0,
    new: 0,
    updated: 0,
    existing: 0,
    archive: 0,
  });
  const [loading, setLoading] = useState(false);

  // フィルター・検索状態
  const [filters, setFilters] = useState<CompanySearchParams>({
    industry: undefined,
    area: undefined,
    status: undefined,
    search: undefined,
  });

  // データ取得
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.industry) params.set('industry', filters.industry);
      if (filters.area) params.set('area', filters.area);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/customers/list?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCompanies(data.companies || []);
        setSummary(data.summary || { total: 0, new: 0, updated: 0, existing: 0, archive: 0 });
      } else {
        console.error('企業一覧取得エラー:', data.error);
        alert(`エラー: ${data.error}`);
      }
    } catch (error) {
      console.error('企業一覧取得エラー:', error);
      alert('企業一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 検索・フィルター変更
  const handleFilterChange = (key: keyof CompanySearchParams, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  // フィルタークリア
  const handleClearFilters = () => {
    setFilters({
      industry: undefined,
      area: undefined,
      status: undefined,
      search: undefined,
    });
  };

  // 進捗率計算（簡易版）
  const calculateProgress = (company: YumeMagaCompany): number => {
    const fields = Object.values(company);
    const filled = fields.filter(f => f !== undefined && f !== '').length;
    return Math.round((filled / 51) * 100);
  };

  // ステータスバッジ
  const getStatusBadge = (status: YumeMagaCompany['status']) => {
    switch (status) {
      case 'new':
        return { label: '新規', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
      case 'updated':
        return { label: '変更', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'existing':
        return { label: '継続', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      case 'archive':
        return { label: 'アーカイブ', bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
      default:
        return { label: '未設定', bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">顧客管理</h1>
            </div>
            <button
              onClick={fetchCompanies}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-600 mb-1">総企業数</div>
            <div className="text-3xl font-bold text-gray-900">{summary.total}社</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs text-orange-700 mb-1">新規企業</div>
            <div className="text-3xl font-bold text-orange-900">{summary.new}社</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs text-blue-700 mb-1">変更企業</div>
            <div className="text-3xl font-bold text-blue-900">{summary.updated}社</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs text-green-700 mb-1">継続企業</div>
            <div className="text-3xl font-bold text-green-900">{summary.existing}社</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-700 mb-1">アーカイブ</div>
            <div className="text-3xl font-bold text-gray-900">{summary.archive}社</div>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* 検索バー */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                検索（企業名・業種）
              </label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="株式会社..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 業種フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">業種</label>
              <select
                value={filters.industry || ''}
                onChange={(e) => handleFilterChange('industry', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">すべて</option>
                <option value="IT・情報通信">IT・情報通信</option>
                <option value="製造業">製造業</option>
                <option value="サービス業">サービス業</option>
                <option value="小売業">小売業</option>
                <option value="建設業">建設業</option>
                <option value="その他">その他</option>
              </select>
            </div>

            {/* エリアフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">エリア</label>
              <select
                value={filters.area || ''}
                onChange={(e) => handleFilterChange('area', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">すべて</option>
                <option value="東京都">東京都</option>
                <option value="大阪府">大阪府</option>
                <option value="愛知県">愛知県</option>
                <option value="福岡県">福岡県</option>
                <option value="その他">その他</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* ステータスフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">すべて</option>
                <option value="new">新規</option>
                <option value="updated">変更</option>
                <option value="existing">継続</option>
                <option value="archive">アーカイブ</option>
              </select>
            </div>

            {/* フィルター適用・クリアボタン */}
            <div className="flex items-end gap-2 md:col-span-3">
              <button
                onClick={fetchCompanies}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                フィルター適用
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                クリア
              </button>
            </div>
          </div>
        </div>

        {/* 企業カードグリッド */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            企業一覧（{companies.length}社）
          </h2>

          {companies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">企業が見つかりません</p>
              <p className="text-sm mt-2">「更新」ボタンをクリックして企業一覧を取得してください</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {companies.map((company) => {
                const progress = calculateProgress(company);
                const statusBadge = getStatusBadge(company.status);

                return (
                  <div
                    key={company.companyId}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    {/* 企業名 */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 truncate" title={company.companyName}>
                      {company.companyName}
                    </h3>

                    {/* 業種・エリア */}
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-500">業種:</span>
                        <span>{company.industry || '未設定'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">エリア:</span>
                        <span>{company.area || '未設定'}</span>
                      </div>
                    </div>

                    {/* ステータスバッジ */}
                    <div className="mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bgColor} ${statusBadge.textColor}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* 進捗率 */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">入力進捗</span>
                        <span className="font-semibold text-gray-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* 詳細ボタン */}
                    <Link href={`/dashboard/customers/${company.companyId}`}>
                      <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm">
                        詳細を開く
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
