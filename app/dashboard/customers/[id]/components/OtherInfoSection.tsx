import type { YumeMagaCompany } from '@/types/customer';

interface SectionProps {
  editMode: boolean;
  displayData: YumeMagaCompany;
  editedData: Partial<YumeMagaCompany>;
  handleFieldChange: (field: keyof YumeMagaCompany, value: string) => void;
}

export default function OtherInfoSection({
  editMode,
  displayData,
  editedData,
  handleFieldChange,
}: SectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500">その他</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 初掲載号 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">初掲載号</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.firstIssue || ''}
              onChange={(e) => handleFieldChange('firstIssue', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="2025年1月号"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.firstIssue || '未設定'}
            </p>
          )}
        </div>

        {/* 最終更新号 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">最終更新号</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.lastIssue || ''}
              onChange={(e) => handleFieldChange('lastIssue', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="2025年12月号"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.lastIssue || '未設定'}
            </p>
          )}
        </div>

        {/* 備考 */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">備考</label>
          {editMode ? (
            <textarea
              value={editedData.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="備考・メモ"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.notes || '未設定'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
