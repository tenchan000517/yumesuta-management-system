'use client';

import { useState, useEffect } from 'react';
import { Building2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CompanyFormPage() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [companyMode, setCompanyMode] = useState<'new' | 'existing'>('new');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);

  // フォームフィールド定義（企業マスター51列に対応）
  const formFields = [
    { key: 'companyId', label: '企業ID', type: 'text', required: true, column: 'A' },
    { key: 'companyName', label: '企業名', type: 'text', required: true, column: 'B' },
    { key: 'companyNameKana', label: '企業名（カナ）', type: 'text', required: true, column: 'C' },
    { key: 'industry', label: '業種', type: 'text', required: true, column: 'D' },
    { key: 'area', label: '事業エリア', type: 'text', required: false, column: 'E' },
    { key: 'description', label: '説明文（一覧用）', type: 'textarea', required: false, column: 'F' },
    { key: 'logoPath', label: 'ロゴ画像パス', type: 'text', required: false, column: 'G' },
    { key: 'heroPath', label: 'ヒーロー画像パス', type: 'text', required: false, column: 'H' },
    { key: 'qrPath', label: 'QRコード画像パス', type: 'text', required: false, column: 'I' },
    { key: 'slogan', label: 'スローガン', type: 'textarea', required: false, column: 'J' },
    { key: 'presidentName', label: '代表者名', type: 'text', required: false, column: 'K' },
    { key: 'presidentNameEn', label: '代表者名（英語）', type: 'text', required: false, column: 'L' },
    { key: 'presidentPosition', label: '代表者役職', type: 'text', required: false, column: 'M' },
    { key: 'presidentPhoto', label: '代表者写真パス', type: 'text', required: false, column: 'N' },
    { key: 'service1ImagePath', label: 'サービス1_画像パス', type: 'text', required: false, column: 'O' },
    { key: 'service1Title', label: 'サービス1_タイトル', type: 'text', required: false, column: 'P' },
    { key: 'service1Desc', label: 'サービス1_説明', type: 'textarea', required: false, column: 'Q' },
    { key: 'service2ImagePath', label: 'サービス2_画像パス', type: 'text', required: false, column: 'R' },
    { key: 'service2Title', label: 'サービス2_タイトル', type: 'text', required: false, column: 'S' },
    { key: 'service2Desc', label: 'サービス2_説明', type: 'textarea', required: false, column: 'T' },
    { key: 'service3ImagePath', label: 'サービス3_画像パス', type: 'text', required: false, column: 'U' },
    { key: 'service3Title', label: 'サービス3_タイトル', type: 'text', required: false, column: 'V' },
    { key: 'service3Desc', label: 'サービス3_説明', type: 'textarea', required: false, column: 'W' },
    { key: 'presidentMessage', label: '社長メッセージ', type: 'textarea', required: false, column: 'X' },
    { key: 'member1ImagePath', label: '社員1_画像パス', type: 'text', required: false, column: 'Y' },
    { key: 'member1Question', label: '社員1_質問', type: 'text', required: false, column: 'Z' },
    { key: 'member1Answer', label: '社員1_回答', type: 'textarea', required: false, column: 'AA' },
    { key: 'member2ImagePath', label: '社員2_画像パス', type: 'text', required: false, column: 'AB' },
    { key: 'member2Question', label: '社員2_質問', type: 'text', required: false, column: 'AC' },
    { key: 'member2Answer', label: '社員2_回答', type: 'textarea', required: false, column: 'AD' },
    { key: 'member3ImagePath', label: '社員3_画像パス', type: 'text', required: false, column: 'AE' },
    { key: 'member3Question', label: '社員3_質問', type: 'text', required: false, column: 'AF' },
    { key: 'member3Answer', label: '社員3_回答', type: 'textarea', required: false, column: 'AG' },
    { key: 'initiative1Title', label: '取り組み1_タイトル', type: 'text', required: false, column: 'AH' },
    { key: 'initiative1Desc', label: '取り組み1_説明', type: 'textarea', required: false, column: 'AI' },
    { key: 'initiative2Title', label: '取り組み2_タイトル', type: 'text', required: false, column: 'AJ' },
    { key: 'initiative2Desc', label: '取り組み2_説明', type: 'textarea', required: false, column: 'AK' },
    { key: 'initiative3Title', label: '取り組み3_タイトル', type: 'text', required: false, column: 'AL' },
    { key: 'initiative3Desc', label: '取り組み3_説明', type: 'textarea', required: false, column: 'AM' },
    { key: 'address', label: '住所', type: 'text', required: false, column: 'AN' },
    { key: 'phone', label: '電話番号', type: 'text', required: false, column: 'AO' },
    { key: 'fax', label: 'FAX番号', type: 'text', required: false, column: 'AP' },
    { key: 'website', label: 'ウェブサイト', type: 'text', required: false, column: 'AQ' },
    { key: 'email', label: '問い合わせメール', type: 'text', required: false, column: 'AR' },
    { key: 'established', label: '設立年', type: 'text', required: false, column: 'AS' },
    { key: 'employees', label: '従業員数', type: 'text', required: false, column: 'AT' },
    { key: 'business', label: '事業内容', type: 'textarea', required: false, column: 'AU' },
    { key: 'firstIssue', label: '初掲載号', type: 'text', required: false, column: 'AV' },
    { key: 'lastIssue', label: '最終更新号', type: 'text', required: false, column: 'AW' },
    { key: 'status', label: 'ステータス', type: 'select', required: false, column: 'AX', options: ['新規', '変更', '継続', 'active', 'inactive', 'アーカイブ'] },
    { key: 'notes', label: '備考', type: 'textarea', required: false, column: 'AY' },
  ];

  // 進捗率計算
  useEffect(() => {
    const requiredFields = formFields.filter(f => f.required);
    const filledRequired = requiredFields.filter(f => formData[f.key]?.trim()).length;
    const calculatedProgress = Math.round((filledRequired / requiredFields.length) * 100);
    setProgress(calculatedProgress);
  }, [formData]);

  // 既存企業一覧取得
  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/yumemaga-v2/companies');
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies.map((c: any) => c.companyName));
      }
    } catch (error) {
      console.error('企業一覧取得エラー:', error);
    }
  };

  // 既存企業データ読み込み
  const loadCompanyData = async (companyName: string) => {
    try {
      const res = await fetch(`/api/yumemaga-v2/companies/${encodeURIComponent(companyName)}`);
      const data = await res.json();
      if (data.success) {
        setFormData(data.company);
      }
    } catch (error) {
      console.error('企業データ読み込みエラー:', error);
    }
  };

  // フォーム送信
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/yumemaga-v2/companies/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: companyMode,
          companyName: companyMode === 'existing' ? selectedCompany : formData.companyName,
          data: formData,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert('企業情報を保存しました');
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      alert(`送信エラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ヘッダー */}
      <div className="max-w-4xl mx-auto mb-6">
        <Link href="/dashboard/yumemaga-v2" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          ゆめマガ制作管理に戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          企業情報入力フォーム
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          企業マスターに登録する情報を入力してください
        </p>
      </div>

      {/* 進捗バー */}
      <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">入力進捗（必須項目のみ）</span>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* モード選択 */}
      <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          企業登録モード
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setCompanyMode('new');
              setFormData({}); // フォームデータをクリア
              setSelectedCompany(''); // 選択企業もクリア
            }}
            className={`px-4 py-2 rounded ${
              companyMode === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            新規企業
          </button>
          <button
            onClick={() => {
              setCompanyMode('existing');
              fetchCompanies();
            }}
            className={`px-4 py-2 rounded ${
              companyMode === 'existing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            既存企業を編集
          </button>
        </div>

        {companyMode === 'existing' && (
          <select
            value={selectedCompany}
            onChange={(e) => {
              setSelectedCompany(e.target.value);
              if (e.target.value) {
                loadCompanyData(e.target.value);
              }
            }}
            className="mt-3 w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="">企業を選択...</option>
            {companies.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {/* フォームフィールド */}
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formFields.map((field) => (
            <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                <span className="ml-2 text-xs text-gray-500">({field.column}列)</span>
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              ) : field.type === 'select' ? (
                <select
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">選択...</option>
                  {(field as any).options?.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>

        {/* 送信ボタン */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading || progress < 100}
            className={`flex-1 px-6 py-3 rounded font-semibold flex items-center justify-center gap-2 ${
              loading || progress < 100
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save className="w-5 h-5" />
            {loading ? '送信中...' : '企業マスターに保存'}
          </button>
        </div>
        {progress < 100 && (
          <p className="mt-2 text-sm text-gray-600 text-center">
            必須項目をすべて入力してください（進捗: {progress}%）
          </p>
        )}
      </div>
    </div>
  );
}
