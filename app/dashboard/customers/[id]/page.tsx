'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit3, Save, X, Building2 } from 'lucide-react';
import type { YumeMagaCompany, CompanyField } from '@/types/customer';
import BasicInfoSection from './components/BasicInfoSection';
import SloganPresidentSection from './components/SloganPresidentSection';
import ServicesSection from './components/ServicesSection';
import PresidentMessageSection from './components/PresidentMessageSection';
import MemberInterviewSection from './components/MemberInterviewSection';
import InitiativesSection from './components/InitiativesSection';
import ContactInfoSection from './components/ContactInfoSection';
import OtherInfoSection from './components/OtherInfoSection';

interface CompanyDetailWithProgress extends YumeMagaCompany {
  progress: {
    total: number;
    filled: number;
    notFilled: number;
    progressRate: number;
  };
  fields: CompanyField[];
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string>('');
  const [company, setCompany] = useState<CompanyDetailWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Partial<YumeMagaCompany>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(p => {
      setCompanyId(p.id);
      fetchCompanyDetail(p.id);
    });
  }, [params]);

  const fetchCompanyDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      const data = await res.json();

      if (data.success) {
        setCompany(data.company);
        setEditedData(data.company);
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch (error) {
      console.error('企業詳細取得エラー:', error);
      alert('企業詳細の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!company) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData),
      });

      const data = await res.json();

      if (data.success) {
        setCompany({ ...company, ...data.company });
        setEditMode(false);
        alert('保存しました');
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(company || {});
    setEditMode(false);
  };

  const handleFieldChange = (field: keyof YumeMagaCompany, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-semibold text-gray-900">企業が見つかりません</p>
          <Link href="/dashboard/customers" className="mt-4 inline-block text-blue-600 hover:underline">
            顧客一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(editMode ? editedData.status : company.status);
  const displayData = editMode ? editedData : company;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/customers"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">顧客一覧に戻る</span>
            </Link>

            <div className="flex items-center gap-4">
              {/* 進捗率 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">入力進捗:</span>
                <span className="text-lg font-bold text-blue-600">{company.progress.progressRate}%</span>
                <span className="text-sm text-gray-500">({company.progress.filled}/{company.progress.total}列)</span>
              </div>

              {/* 編集モード切替 */}
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <Edit3 className="w-4 h-4" />
                  編集モード
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    キャンセル
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* メインコンテンツ（CompanyTemplateスタイル） */}
        <div className="bg-white rounded-lg shadow-lg mt-6">
          {/* ヘッダー（青グラデーション） */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* ロゴ */}
                {displayData.logoPath && (
                  <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                    <img
                      src={displayData.logoPath}
                      alt={`${displayData.companyName} ロゴ`}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* 企業名 */}
                <div>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedData.companyName || ''}
                      onChange={(e) => handleFieldChange('companyName', e.target.value)}
                      className="text-2xl font-bold text-white bg-white/20 border border-white/30 rounded px-3 py-1"
                      placeholder="企業名"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-white">{displayData.companyName}</h1>
                  )}

                  {editMode ? (
                    <input
                      type="text"
                      value={editedData.companyNameKana || ''}
                      onChange={(e) => handleFieldChange('companyNameKana', e.target.value)}
                      className="text-sm text-white bg-white/20 border border-white/30 rounded px-2 py-1 mt-1"
                      placeholder="企業名(カナ)"
                    />
                  ) : (
                    displayData.companyNameKana && (
                      <p className="text-sm text-white/90 mt-1">{displayData.companyNameKana}</p>
                    )
                  )}
                </div>
              </div>

              {/* タグ・ステータス */}
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <input
                        type="text"
                        value={editedData.industry || ''}
                        onChange={(e) => handleFieldChange('industry', e.target.value)}
                        className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-semibold"
                        placeholder="業種"
                      />
                      <input
                        type="text"
                        value={editedData.area || ''}
                        onChange={(e) => handleFieldChange('area', e.target.value)}
                        className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-semibold"
                        placeholder="エリア"
                      />
                    </>
                  ) : (
                    <>
                      {displayData.industry && (
                        <span className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-semibold">
                          {displayData.industry}
                        </span>
                      )}
                      {displayData.area && (
                        <span className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-semibold">
                          {displayData.area}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* ステータス */}
                {editMode ? (
                  <select
                    value={editedData.status || ''}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.bgColor} ${statusBadge.textColor}`}
                  >
                    <option value="">未設定</option>
                    <option value="new">新規</option>
                    <option value="updated">変更</option>
                    <option value="existing">継続</option>
                    <option value="archive">アーカイブ</option>
                  </select>
                ) : (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.bgColor} ${statusBadge.textColor}`}>
                    {statusBadge.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* コンテンツエリア */}
          <div className="p-8 space-y-12">
            <BasicInfoSection
              editMode={editMode}
              displayData={displayData}
              editedData={editedData}
              handleFieldChange={handleFieldChange}
            />

            <SloganPresidentSection
              editMode={editMode}
              displayData={displayData}
              editedData={editedData}
              handleFieldChange={handleFieldChange}
            />

            <ServicesSection
              editMode={editMode}
              displayData={displayData}
              editedData={editedData}
              handleFieldChange={handleFieldChange}
            />

            <PresidentMessageSection
              editMode={editMode}
              displayData={displayData}
              editedData={editedData}
              handleFieldChange={handleFieldChange}
            />

            <MemberInterviewSection
              editMode={editMode}
              displayData={displayData}
              editedData={editedData}
              handleFieldChange={handleFieldChange}
            />

            <InitiativesSection
              editMode={editMode}
              displayData={displayData}
              editedData={editedData}
              handleFieldChange={handleFieldChange}
            />

            <ContactInfoSection
              editMode={editMode}
              displayData={displayData}
              editedData={editedData}
              handleFieldChange={handleFieldChange}
            />

            <OtherInfoSection
              editMode={editMode}
              displayData={displayData}
              editedData={editedData}
              handleFieldChange={handleFieldChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
