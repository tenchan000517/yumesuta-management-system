import type { YumeMagaCompany } from '@/types/customer';

interface SectionProps {
  editMode: boolean;
  displayData: YumeMagaCompany;
  editedData: Partial<YumeMagaCompany>;
  handleFieldChange: (field: keyof YumeMagaCompany, value: string) => void;
}

export default function InitiativesSection({
  editMode,
  displayData,
  editedData,
  handleFieldChange,
}: SectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500">会社の取り組み</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 取り組み1 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">取り組み1</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">タイトル</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.initiative1Title || ''}
                  onChange={(e) => handleFieldChange('initiative1Title', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="取り組みタイトル"
                />
              ) : (
                <p className="text-sm text-gray-900 font-semibold">{displayData.initiative1Title || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">説明</label>
              {editMode ? (
                <textarea
                  value={editedData.initiative1Desc || ''}
                  onChange={(e) => handleFieldChange('initiative1Desc', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="取り組みの説明"
                />
              ) : (
                <p className="text-sm text-gray-700">{displayData.initiative1Desc || '未設定'}</p>
              )}
            </div>
          </div>
        </div>

        {/* 取り組み2 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">取り組み2</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">タイトル</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.initiative2Title || ''}
                  onChange={(e) => handleFieldChange('initiative2Title', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="取り組みタイトル"
                />
              ) : (
                <p className="text-sm text-gray-900 font-semibold">{displayData.initiative2Title || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">説明</label>
              {editMode ? (
                <textarea
                  value={editedData.initiative2Desc || ''}
                  onChange={(e) => handleFieldChange('initiative2Desc', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="取り組みの説明"
                />
              ) : (
                <p className="text-sm text-gray-700">{displayData.initiative2Desc || '未設定'}</p>
              )}
            </div>
          </div>
        </div>

        {/* 取り組み3 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">取り組み3</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">タイトル</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.initiative3Title || ''}
                  onChange={(e) => handleFieldChange('initiative3Title', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="取り組みタイトル"
                />
              ) : (
                <p className="text-sm text-gray-900 font-semibold">{displayData.initiative3Title || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">説明</label>
              {editMode ? (
                <textarea
                  value={editedData.initiative3Desc || ''}
                  onChange={(e) => handleFieldChange('initiative3Desc', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="取り組みの説明"
                />
              ) : (
                <p className="text-sm text-gray-700">{displayData.initiative3Desc || '未設定'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
