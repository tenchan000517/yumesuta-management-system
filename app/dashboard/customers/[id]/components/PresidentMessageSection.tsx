import type { YumeMagaCompany } from '@/types/customer';

interface SectionProps {
  editMode: boolean;
  displayData: YumeMagaCompany;
  editedData: Partial<YumeMagaCompany>;
  handleFieldChange: (field: keyof YumeMagaCompany, value: string) => void;
}

export default function PresidentMessageSection({
  editMode,
  displayData,
  editedData,
  handleFieldChange,
}: SectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500">社長メッセージ</h2>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">メッセージ</label>
        {editMode ? (
          <textarea
            value={editedData.presidentMessage || ''}
            onChange={(e) => handleFieldChange('presidentMessage', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={6}
            placeholder="社長からのメッセージ"
          />
        ) : (
          <p className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-wrap">
            {displayData.presidentMessage || '未設定'}
          </p>
        )}
      </div>
    </section>
  );
}
