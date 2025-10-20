import type { YumeMagaCompany } from '@/types/customer';

interface SectionProps {
  editMode: boolean;
  displayData: YumeMagaCompany;
  editedData: Partial<YumeMagaCompany>;
  handleFieldChange: (field: keyof YumeMagaCompany, value: string) => void;
}

export default function SloganPresidentSection({
  editMode,
  displayData,
  editedData,
  handleFieldChange,
}: SectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500">スローガン・代表者情報</h2>

      <div className="space-y-6">
        {/* スローガン */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">スローガン</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.slogan || ''}
              onChange={(e) => handleFieldChange('slogan', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="企業のスローガン"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 italic">
              {displayData.slogan || '未設定'}
            </p>
          )}
        </div>

        {/* 代表者情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">代表者名</label>
            {editMode ? (
              <input
                type="text"
                value={editedData.presidentName || ''}
                onChange={(e) => handleFieldChange('presidentName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="代表者名"
              />
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                {displayData.presidentName || '未設定'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">代表者名（英語）</label>
            {editMode ? (
              <input
                type="text"
                value={editedData.presidentNameEn || ''}
                onChange={(e) => handleFieldChange('presidentNameEn', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="President Name"
              />
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                {displayData.presidentNameEn || '未設定'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">代表者役職</label>
            {editMode ? (
              <input
                type="text"
                value={editedData.presidentPosition || ''}
                onChange={(e) => handleFieldChange('presidentPosition', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="代表取締役"
              />
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                {displayData.presidentPosition || '未設定'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">代表者写真パス</label>
            {editMode ? (
              <input
                type="text"
                value={editedData.presidentPhoto || ''}
                onChange={(e) => handleFieldChange('presidentPhoto', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="/img/company/xxx/president.png"
              />
            ) : (
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 font-mono text-sm">
                {displayData.presidentPhoto || '未設定'}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
