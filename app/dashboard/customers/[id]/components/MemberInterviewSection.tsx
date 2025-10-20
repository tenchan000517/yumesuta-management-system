import type { YumeMagaCompany } from '@/types/customer';

interface SectionProps {
  editMode: boolean;
  displayData: YumeMagaCompany;
  editedData: Partial<YumeMagaCompany>;
  handleFieldChange: (field: keyof YumeMagaCompany, value: string) => void;
}

export default function MemberInterviewSection({
  editMode,
  displayData,
  editedData,
  handleFieldChange,
}: SectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500">社員インタビュー</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 社員1 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">社員1</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">画像パス</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.member1ImagePath || ''}
                  onChange={(e) => handleFieldChange('member1ImagePath', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="/img/company/xxx/member-01.png"
                />
              ) : (
                <p className="text-sm text-gray-700 font-mono">{displayData.member1ImagePath || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">質問</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.member1Question || ''}
                  onChange={(e) => handleFieldChange('member1Question', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="質問内容"
                />
              ) : (
                <p className="text-sm text-gray-900 font-semibold">{displayData.member1Question || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">回答</label>
              {editMode ? (
                <textarea
                  value={editedData.member1Answer || ''}
                  onChange={(e) => handleFieldChange('member1Answer', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="回答内容"
                />
              ) : (
                <p className="text-sm text-gray-700">{displayData.member1Answer || '未設定'}</p>
              )}
            </div>
          </div>
        </div>

        {/* 社員2 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">社員2</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">画像パス</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.member2ImagePath || ''}
                  onChange={(e) => handleFieldChange('member2ImagePath', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="/img/company/xxx/member-02.png"
                />
              ) : (
                <p className="text-sm text-gray-700 font-mono">{displayData.member2ImagePath || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">質問</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.member2Question || ''}
                  onChange={(e) => handleFieldChange('member2Question', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="質問内容"
                />
              ) : (
                <p className="text-sm text-gray-900 font-semibold">{displayData.member2Question || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">回答</label>
              {editMode ? (
                <textarea
                  value={editedData.member2Answer || ''}
                  onChange={(e) => handleFieldChange('member2Answer', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="回答内容"
                />
              ) : (
                <p className="text-sm text-gray-700">{displayData.member2Answer || '未設定'}</p>
              )}
            </div>
          </div>
        </div>

        {/* 社員3 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">社員3</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">画像パス</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.member3ImagePath || ''}
                  onChange={(e) => handleFieldChange('member3ImagePath', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="/img/company/xxx/member-03.png"
                />
              ) : (
                <p className="text-sm text-gray-700 font-mono">{displayData.member3ImagePath || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">質問</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedData.member3Question || ''}
                  onChange={(e) => handleFieldChange('member3Question', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="質問内容"
                />
              ) : (
                <p className="text-sm text-gray-900 font-semibold">{displayData.member3Question || '未設定'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">回答</label>
              {editMode ? (
                <textarea
                  value={editedData.member3Answer || ''}
                  onChange={(e) => handleFieldChange('member3Answer', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="回答内容"
                />
              ) : (
                <p className="text-sm text-gray-700">{displayData.member3Answer || '未設定'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
