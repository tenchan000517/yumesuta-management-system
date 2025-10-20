import type { YumeMagaCompany } from '@/types/customer';

interface SectionProps {
  editMode: boolean;
  displayData: YumeMagaCompany;
  editedData: Partial<YumeMagaCompany>;
  handleFieldChange: (field: keyof YumeMagaCompany, value: string) => void;
}

export default function ContactInfoSection({
  editMode,
  displayData,
  editedData,
  handleFieldChange,
}: SectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500">連絡先情報</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 住所 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">住所</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.address || ''}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="〒000-0000 東京都..."
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.address || '未設定'}
            </p>
          )}
        </div>

        {/* 電話番号 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">電話番号</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.phone || ''}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="03-1234-5678"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.phone || '未設定'}
            </p>
          )}
        </div>

        {/* FAX番号 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">FAX番号</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.fax || ''}
              onChange={(e) => handleFieldChange('fax', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="03-1234-5679"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.fax || '未設定'}
            </p>
          )}
        </div>

        {/* ウェブサイト */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">ウェブサイト</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.website || ''}
              onChange={(e) => handleFieldChange('website', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.website || '未設定'}
            </p>
          )}
        </div>

        {/* 問い合わせメール */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">問い合わせメール</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="info@example.com"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.email || '未設定'}
            </p>
          )}
        </div>

        {/* 設立年 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">設立年</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.established || ''}
              onChange={(e) => handleFieldChange('established', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="2000年"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.established || '未設定'}
            </p>
          )}
        </div>

        {/* 従業員数 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">従業員数</label>
          {editMode ? (
            <input
              type="text"
              value={editedData.employees || ''}
              onChange={(e) => handleFieldChange('employees', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="100名"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.employees || '未設定'}
            </p>
          )}
        </div>

        {/* 事業内容 */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">事業内容</label>
          {editMode ? (
            <textarea
              value={editedData.business || ''}
              onChange={(e) => handleFieldChange('business', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="事業内容の詳細"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
              {displayData.business || '未設定'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
