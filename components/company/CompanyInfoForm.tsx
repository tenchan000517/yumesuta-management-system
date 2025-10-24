'use client';
import { useState } from 'react';
import { Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { CompanyInfo } from '@/types/company-info';

interface CompanyInfoFormProps {
  companyId?: string;
  initialData?: Partial<CompanyInfo>;
  onSave: (data: CompanyInfo) => Promise<void>;
  onCancel: () => void;
}

export function CompanyInfoForm({
  companyId,
  initialData,
  onSave,
  onCancel,
}: CompanyInfoFormProps) {
  // フォームデータのstate
  const [formData, setFormData] = useState<Partial<CompanyInfo>>(
    initialData || {}
  );

  // セクションの開閉状態
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    basic: true,
    images: true,
    representative: true,
    services: true,
    presidentMessage: true,
    staffInterviews: true,
    initiatives: true,
    contact: true,
  });

  // 保存中のstate
  const [isSaving, setIsSaving] = useState(false);

  // セクションの開閉切り替え
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // フォームフィールドの変更
  const handleFieldChange = (field: keyof CompanyInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 保存処理
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData as CompanyInfo);
    } catch (error) {
      console.error('Failed to save company info:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-hidden flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          企業情報入力
          {companyId && (
            <span className="ml-3 text-sm font-normal text-gray-500">
              企業ID: {companyId}
            </span>
          )}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            キャンセル
          </button>
        </div>
      </div>

      {/* メインコンテンツ: 左右2カラム */}
      <div className="flex-1 overflow-hidden flex">
        {/* 左側: 入力フォーム */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-6 bg-white">
          <div className="space-y-6">
            {/* 基本情報セクション */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('basic')}
                className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  基本情報
                </h2>
                {expandedSections.basic ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.basic && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      企業名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.企業名 || ''}
                      onChange={(e) =>
                        handleFieldChange('企業名', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 株式会社ゆめスタ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      企業名（カナ）
                    </label>
                    <input
                      type="text"
                      value={formData.企業名_カナ || ''}
                      onChange={(e) =>
                        handleFieldChange('企業名_カナ', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: ユメスタ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      業種 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.業種 || ''}
                      onChange={(e) =>
                        handleFieldChange('業種', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: IT・テクノロジー"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      事業エリア
                    </label>
                    <input
                      type="text"
                      value={formData.事業エリア || ''}
                      onChange={(e) =>
                        handleFieldChange('事業エリア', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 東京都、全国"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      説明文（一覧用）
                    </label>
                    <textarea
                      value={formData.説明文_一覧用 || ''}
                      onChange={(e) =>
                        handleFieldChange('説明文_一覧用', e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="企業の簡単な説明（100文字程度）"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      スローガン
                    </label>
                    <input
                      type="text"
                      value={formData.スローガン || ''}
                      onChange={(e) =>
                        handleFieldChange('スローガン', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 夢を実現するパートナー"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* 画像セクション */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('images')}
                className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900">画像</h2>
                {expandedSections.images ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.images && (
                <div className="p-4 space-y-4">
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    画像アップロード機能は後で実装します。現在は画像パスを直接入力してください。
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ロゴ画像パス
                    </label>
                    <input
                      type="text"
                      value={formData.ロゴ画像パス || ''}
                      onChange={(e) =>
                        handleFieldChange('ロゴ画像パス', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="/images/companies/logo.png"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ヒーロー画像パス
                    </label>
                    <input
                      type="text"
                      value={formData.ヒーロー画像パス || ''}
                      onChange={(e) =>
                        handleFieldChange('ヒーロー画像パス', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="/images/companies/hero.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QRコード画像パス
                    </label>
                    <input
                      type="text"
                      value={formData.QRコード画像パス || ''}
                      onChange={(e) =>
                        handleFieldChange('QRコード画像パス', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="/images/companies/qr.png"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* 代表者情報セクション */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('representative')}
                className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  代表者情報
                </h2>
                {expandedSections.representative ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.representative && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      代表者名
                    </label>
                    <input
                      type="text"
                      value={formData.代表者名 || ''}
                      onChange={(e) =>
                        handleFieldChange('代表者名', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 山田太郎"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      代表者名（英語）
                    </label>
                    <input
                      type="text"
                      value={formData.代表者名_英語 || ''}
                      onChange={(e) =>
                        handleFieldChange('代表者名_英語', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: Taro Yamada"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      代表者役職
                    </label>
                    <input
                      type="text"
                      value={formData.代表者役職 || ''}
                      onChange={(e) =>
                        handleFieldChange('代表者役職', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 代表取締役社長"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      代表者写真パス
                    </label>
                    <input
                      type="text"
                      value={formData.代表者写真パス || ''}
                      onChange={(e) =>
                        handleFieldChange('代表者写真パス', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="/images/companies/ceo.jpg"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* サービス情報セクション */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('services')}
                className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  サービス情報（3つ）
                </h2>
                {expandedSections.services ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.services && (
                <div className="p-4 space-y-6">
                  {/* サービス1 */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      サービス1
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          画像パス
                        </label>
                        <input
                          type="text"
                          value={formData.サービス1_画像パス || ''}
                          onChange={(e) =>
                            handleFieldChange('サービス1_画像パス', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="/images/services/service1.jpg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          タイトル
                        </label>
                        <input
                          type="text"
                          value={formData.サービス1_タイトル || ''}
                          onChange={(e) =>
                            handleFieldChange('サービス1_タイトル', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: Webサイト制作"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          説明
                        </label>
                        <textarea
                          value={formData.サービス1_説明 || ''}
                          onChange={(e) =>
                            handleFieldChange('サービス1_説明', e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="サービスの説明（200文字程度）"
                        />
                      </div>
                    </div>
                  </div>

                  {/* サービス2 */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      サービス2
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          画像パス
                        </label>
                        <input
                          type="text"
                          value={formData.サービス2_画像パス || ''}
                          onChange={(e) =>
                            handleFieldChange('サービス2_画像パス', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="/images/services/service2.jpg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          タイトル
                        </label>
                        <input
                          type="text"
                          value={formData.サービス2_タイトル || ''}
                          onChange={(e) =>
                            handleFieldChange('サービス2_タイトル', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: システム開発"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          説明
                        </label>
                        <textarea
                          value={formData.サービス2_説明 || ''}
                          onChange={(e) =>
                            handleFieldChange('サービス2_説明', e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="サービスの説明（200文字程度）"
                        />
                      </div>
                    </div>
                  </div>

                  {/* サービス3 */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      サービス3
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          画像パス
                        </label>
                        <input
                          type="text"
                          value={formData.サービス3_画像パス || ''}
                          onChange={(e) =>
                            handleFieldChange('サービス3_画像パス', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="/images/services/service3.jpg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          タイトル
                        </label>
                        <input
                          type="text"
                          value={formData.サービス3_タイトル || ''}
                          onChange={(e) =>
                            handleFieldChange('サービス3_タイトル', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: コンサルティング"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          説明
                        </label>
                        <textarea
                          value={formData.サービス3_説明 || ''}
                          onChange={(e) =>
                            handleFieldChange('サービス3_説明', e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="サービスの説明（200文字程度）"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 社長メッセージセクション */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('presidentMessage')}
                className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  社長メッセージ
                </h2>
                {expandedSections.presidentMessage ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.presidentMessage && (
                <div className="p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      社長メッセージ
                    </label>
                    <textarea
                      value={formData.社長メッセージ || ''}
                      onChange={(e) =>
                        handleFieldChange('社長メッセージ', e.target.value)
                      }
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="社長からのメッセージを入力してください（500文字程度）"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* 社員インタビューセクション */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('staffInterviews')}
                className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  社員インタビュー（3名）
                </h2>
                {expandedSections.staffInterviews ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.staffInterviews && (
                <div className="p-4 space-y-6">
                  {/* 社員1 */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                    <h3 className="font-semibold text-gray-900 mb-3">社員1</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          画像パス
                        </label>
                        <input
                          type="text"
                          value={formData.社員1_画像パス || ''}
                          onChange={(e) =>
                            handleFieldChange('社員1_画像パス', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="/images/staff/staff1.jpg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          質問
                        </label>
                        <input
                          type="text"
                          value={formData.社員1_質問 || ''}
                          onChange={(e) =>
                            handleFieldChange('社員1_質問', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: この会社で働く魅力は？"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          回答
                        </label>
                        <textarea
                          value={formData.社員1_回答 || ''}
                          onChange={(e) =>
                            handleFieldChange('社員1_回答', e.target.value)
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="社員の回答（300文字程度）"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 社員2 */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                    <h3 className="font-semibold text-gray-900 mb-3">社員2</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          画像パス
                        </label>
                        <input
                          type="text"
                          value={formData.社員2_画像パス || ''}
                          onChange={(e) =>
                            handleFieldChange('社員2_画像パス', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="/images/staff/staff2.jpg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          質問
                        </label>
                        <input
                          type="text"
                          value={formData.社員2_質問 || ''}
                          onChange={(e) =>
                            handleFieldChange('社員2_質問', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 仕事のやりがいは？"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          回答
                        </label>
                        <textarea
                          value={formData.社員2_回答 || ''}
                          onChange={(e) =>
                            handleFieldChange('社員2_回答', e.target.value)
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="社員の回答（300文字程度）"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 社員3 */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                    <h3 className="font-semibold text-gray-900 mb-3">社員3</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          画像パス
                        </label>
                        <input
                          type="text"
                          value={formData.社員3_画像パス || ''}
                          onChange={(e) =>
                            handleFieldChange('社員3_画像パス', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="/images/staff/staff3.jpg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          質問
                        </label>
                        <input
                          type="text"
                          value={formData.社員3_質問 || ''}
                          onChange={(e) =>
                            handleFieldChange('社員3_質問', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 職場の雰囲気は？"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          回答
                        </label>
                        <textarea
                          value={formData.社員3_回答 || ''}
                          onChange={(e) =>
                            handleFieldChange('社員3_回答', e.target.value)
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="社員の回答（300文字程度）"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 取り組みセクション */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('initiatives')}
                className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  取り組み（3つ）
                </h2>
                {expandedSections.initiatives ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.initiatives && (
                <div className="p-4 space-y-4">
                  {/* 取り組み1 */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      取り組み1
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          タイトル
                        </label>
                        <input
                          type="text"
                          value={formData.取り組み1_タイトル || ''}
                          onChange={(e) =>
                            handleFieldChange('取り組み1_タイトル', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 環境保護活動"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          説明
                        </label>
                        <textarea
                          value={formData.取り組み1_説明 || ''}
                          onChange={(e) =>
                            handleFieldChange('取り組み1_説明', e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="取り組みの説明（200文字程度）"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 取り組み2 */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      取り組み2
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          タイトル
                        </label>
                        <input
                          type="text"
                          value={formData.取り組み2_タイトル || ''}
                          onChange={(e) =>
                            handleFieldChange('取り組み2_タイトル', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 地域貢献活動"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          説明
                        </label>
                        <textarea
                          value={formData.取り組み2_説明 || ''}
                          onChange={(e) =>
                            handleFieldChange('取り組み2_説明', e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="取り組みの説明（200文字程度）"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 取り組み3 */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      取り組み3
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          タイトル
                        </label>
                        <input
                          type="text"
                          value={formData.取り組み3_タイトル || ''}
                          onChange={(e) =>
                            handleFieldChange('取り組み3_タイトル', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 人材育成"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          説明
                        </label>
                        <textarea
                          value={formData.取り組み3_説明 || ''}
                          onChange={(e) =>
                            handleFieldChange('取り組み3_説明', e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="取り組みの説明（200文字程度）"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 連絡先情報セクション */}
            <section className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('contact')}
                className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  連絡先情報
                </h2>
                {expandedSections.contact ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedSections.contact && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      住所 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.住所 || ''}
                      onChange={(e) =>
                        handleFieldChange('住所', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 東京都渋谷区..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電話番号 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.電話番号 || ''}
                      onChange={(e) =>
                        handleFieldChange('電話番号', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 03-1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      FAX番号
                    </label>
                    <input
                      type="tel"
                      value={formData.FAX番号 || ''}
                      onChange={(e) =>
                        handleFieldChange('FAX番号', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 03-1234-5679"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ウェブサイト
                    </label>
                    <input
                      type="url"
                      value={formData.ウェブサイト || ''}
                      onChange={(e) =>
                        handleFieldChange('ウェブサイト', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      問い合わせメール
                    </label>
                    <input
                      type="email"
                      value={formData.問い合わせメール || ''}
                      onChange={(e) =>
                        handleFieldChange('問い合わせメール', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: info@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      設立年
                    </label>
                    <input
                      type="text"
                      value={formData.設立年 || ''}
                      onChange={(e) =>
                        handleFieldChange('設立年', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 2020年"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      従業員数
                    </label>
                    <input
                      type="text"
                      value={formData.従業員数 || ''}
                      onChange={(e) =>
                        handleFieldChange('従業員数', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: 50名"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      事業内容
                    </label>
                    <textarea
                      value={formData.事業内容 || ''}
                      onChange={(e) =>
                        handleFieldChange('事業内容', e.target.value)
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="詳細な事業内容（300文字程度）"
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* 右側: プレビュー */}
        <div className="w-1/2 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              プレビュー
            </h2>

            {/* 企業カードプレビュー */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* ヒーロー画像 */}
              {formData.ヒーロー画像パス ? (
                <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <p className="text-white text-sm">
                    ヒーロー画像: {formData.ヒーロー画像パス}
                  </p>
                </div>
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-400">ヒーロー画像未設定</p>
                </div>
              )}

              <div className="p-6">
                {/* ロゴと基本情報 */}
                <div className="flex items-start gap-4 mb-6">
                  {formData.ロゴ画像パス ? (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <p className="text-xs text-gray-500">Logo</p>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {formData.企業名 || '企業名未入力'}
                    </h3>
                    {formData.業種 && (
                      <p className="text-sm text-gray-600 mb-2">
                        {formData.業種}
                      </p>
                    )}
                    {formData.スローガン && (
                      <p className="text-sm text-blue-600 italic">
                        {formData.スローガン}
                      </p>
                    )}
                  </div>
                </div>

                {/* 説明文 */}
                {formData.説明文_一覧用 && (
                  <div className="mb-6">
                    <p className="text-gray-700">{formData.説明文_一覧用}</p>
                  </div>
                )}

                {/* 代表者情報 */}
                {(formData.代表者名 || formData.代表者役職) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      代表者
                    </h4>
                    <div className="flex items-center gap-3">
                      {formData.代表者写真パス ? (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <p className="text-xs text-gray-500">写真</p>
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {formData.代表者名 || '未入力'}
                        </p>
                        {formData.代表者役職 && (
                          <p className="text-sm text-gray-600">
                            {formData.代表者役職}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* プレビュー説明 */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                左側のフォームに入力すると、リアルタイムでプレビューが更新されます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
