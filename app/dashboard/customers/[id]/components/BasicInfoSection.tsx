import type { YumeMagaCompany } from '@/types/customer';

interface SectionProps {
  editMode: boolean;
  displayData: YumeMagaCompany;
  editedData: Partial<YumeMagaCompany>;
  handleFieldChange: (field: keyof YumeMagaCompany, value: string) => void;
}

export default function BasicInfoSection({
  editMode,
  displayData,
  editedData,
  handleFieldChange,
}: SectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500">基本情報</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 企業ID */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">企業ID</label>
          <div className="px-4 py-2 bg-gray-100 rounded text-gray-900 font-mono">
            {displayData.companyId}
          </div>
        </div>

        {/* 説明文 */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">説明文（一覧用）</label>
          {editMode ? (
            <textarea
              value={editedData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="企業の説明文"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.description || '未設定'}
            </p>
          )}
        </div>

        {/* 画像パス */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">ロゴ画像パス</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.logoPath || ''}
              onChange={(e) => handleFieldChange('logoPath', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="/img/company/xxx/logo.png"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 font-mono text-sm">
              {displayData.logoPath || '未設定'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">ヒーロー画像パス</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.heroPath || ''}
              onChange={(e) => handleFieldChange('heroPath', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="/img/company/xxx/hero.png"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 font-mono text-sm">
              {displayData.heroPath || '未設定'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">QRコード画像パス</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.qrPath || ''}
              onChange={(e) => handleFieldChange('qrPath', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="/img/company/xxx/qr.png"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 font-mono text-sm">
              {displayData.qrPath || '未設定'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
