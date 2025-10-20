import type { YumeMagaCompany } from '@/types/customer';

interface SectionProps {
  editMode: boolean;
  displayData: YumeMagaCompany;
  editedData: Partial<YumeMagaCompany>;
  handleFieldChange: (field: keyof YumeMagaCompany, value: string) => void;
}

export default function ServicesSection({
  editMode,
  displayData,
  editedData,
  handleFieldChange,
}: SectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500">サービス</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* サービス1 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">サービス1</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">画像パス</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.service1ImagePath || ''}
                  onChange={(e) => handleFieldChange('service1ImagePath', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="/img/company/xxx/service-01.png"
                />
              ) : (
                <p className="text-sm text-gray-700 font-mono">{displayData.service1ImagePath || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">タイトル</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.service1Title || ''}
                  onChange={(e) => handleFieldChange('service1Title', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="サービス名"
                />
              ) : (
                <p className="text-sm text-gray-900 font-semibold">{displayData.service1Title || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">説明</label>
              {editMode ? (
                <textarea
                  value={editedData.service1Desc || ''}
                  onChange={(e) => handleFieldChange('service1Desc', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="サービスの説明"
                />
              ) : (
                <p className="text-sm text-gray-700">{displayData.service1Desc || '未設定'}</p>
              )}
            </div>
          </div>
        </div>

        {/* サービス2 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">サービス2</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">画像パス</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.service2ImagePath || ''}
                  onChange={(e) => handleFieldChange('service2ImagePath', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="/img/company/xxx/service-02.png"
                />
              ) : (
                <p className="text-sm text-gray-700 font-mono">{displayData.service2ImagePath || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">タイトル</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.service2Title || ''}
                  onChange={(e) => handleFieldChange('service2Title', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="サービス名"
                />
              ) : (
                <p className="text-sm text-gray-900 font-semibold">{displayData.service2Title || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">説明</label>
              {editMode ? (
                <textarea
                  value={editedData.service2Desc || ''}
                  onChange={(e) => handleFieldChange('service2Desc', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="サービスの説明"
                />
              ) : (
                <p className="text-sm text-gray-700">{displayData.service2Desc || '未設定'}</p>
              )}
            </div>
          </div>
        </div>

        {/* サービス3 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">サービス3</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">画像パス</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.service3ImagePath || ''}
                  onChange={(e) => handleFieldChange('service3ImagePath', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="/img/company/xxx/service-03.png"
                />
              ) : (
                <p className="text-sm text-gray-700 font-mono">{displayData.service3ImagePath || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">タイトル</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.service3Title || ''}
                  onChange={(e) => handleFieldChange('service3Title', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="サービス名"
                />
              ) : (
                <p className="text-sm text-gray-900 font-semibold">{displayData.service3Title || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">説明</label>
              {editMode ? (
                <textarea
                  value={editedData.service3Desc || ''}
                  onChange={(e) => handleFieldChange('service3Desc', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="サービスの説明"
                />
              ) : (
                <p className="text-sm text-gray-700">{displayData.service3Desc || '未設定'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
