import { useState } from 'react';
import { FileText, AlertCircle, Building2, Copy, Check } from 'lucide-react';
import type { NewCompany, RenewalReminder } from '@/types/contract';
import { NewCompanySidePanel } from './NewCompanySidePanel';

interface ContractManagementSectionProps {
  newCompanies: NewCompany[];
  renewalReminders: RenewalReminder[];
}

export function ContractManagementSection({
  newCompanies,
  renewalReminders,
}: ContractManagementSectionProps) {
  const [copiedMailId, setCopiedMailId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<NewCompany | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const handleCopyMail = (contractId: string, mailTemplate: string) => {
    navigator.clipboard.writeText(mailTemplate);
    setCopiedMailId(contractId);
    setTimeout(() => setCopiedMailId(null), 2000);
  };

  if (newCompanies.length === 0 && renewalReminders.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 mb-4">
        <FileText className="w-5 h-5 text-green-600" />
        契約管理
      </h3>

      {/* 新規企業セクション */}
      {newCompanies.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold flex items-center gap-2 text-gray-800 mb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            新規掲載企業（{newCompanies.length}社）
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newCompanies.map((company) => (
              <div
                key={company.契約ID}
                className="border border-blue-200 rounded-lg p-4 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => {
                  setSelectedCompany(company);
                  setIsSidePanelOpen(true);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-bold text-gray-900">{company.企業名}</h5>
                  <span className="text-xs px-2 py-1 rounded font-semibold bg-blue-100 text-blue-800">
                    新規
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">サービス:</span> {company.契約サービス}
                  </p>
                  <p>
                    <span className="font-semibold">掲載開始:</span> {company.掲載開始号}
                  </p>
                  <p>
                    <span className="font-semibold">契約金額:</span> {company.契約金額}
                  </p>
                  <p>
                    <span className="font-semibold">契約開始:</span> {company.契約開始日}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 契約更新リマインドセクション */}
      {renewalReminders.length > 0 && (
        <div>
          <h4 className="text-md font-semibold flex items-center gap-2 text-gray-800 mb-3">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            契約期間終了リマインド（{renewalReminders.length}社）
          </h4>
          <div className="space-y-4">
            {renewalReminders.map((reminder) => {
              const isUrgent = reminder.daysUntilEnd <= 30;
              const borderColor = isUrgent ? 'border-red-200' : 'border-orange-200';
              const bgColor = isUrgent ? 'bg-red-50' : 'bg-orange-50';
              const badgeColor = isUrgent
                ? 'bg-red-100 text-red-800'
                : 'bg-orange-100 text-orange-800';

              return (
                <div
                  key={reminder.契約ID}
                  className={`border ${borderColor} rounded-lg p-4 ${bgColor}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="font-bold text-gray-900">{reminder.企業名}</h5>
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${badgeColor}`}>
                      あと{reminder.daysUntilEnd}日
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-700">
                    <div>
                      <span className="font-semibold">サービス:</span> {reminder.契約サービス}
                    </div>
                    <div>
                      <span className="font-semibold">契約終了日:</span>{' '}
                      {reminder.契約終了日}
                    </div>
                    <div>
                      <span className="font-semibold">自動更新:</span>{' '}
                      {reminder.自動更新有無 === '〇' ? 'あり' : 'なし'}
                    </div>
                    {reminder.自動更新後の金額 && (
                      <div>
                        <span className="font-semibold">更新後金額:</span>{' '}
                        {reminder.自動更新後の金額}
                      </div>
                    )}
                  </div>

                  {/* メール文 */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        送信メール文
                      </span>
                      <button
                        onClick={() => handleCopyMail(reminder.契約ID, reminder.mailTemplate)}
                        className={`flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors ${
                          copiedMailId === reminder.契約ID
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-700 text-white hover:bg-gray-800'
                        }`}
                      >
                        {copiedMailId === reminder.契約ID ? (
                          <>
                            <Check className="w-3 h-3" />
                            コピー完了
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            コピー
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-white border border-gray-300 rounded p-3 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {reminder.mailTemplate}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* サイドパネル */}
      {selectedCompany && (
        <NewCompanySidePanel
          company={selectedCompany}
          isOpen={isSidePanelOpen}
          onClose={() => {
            setIsSidePanelOpen(false);
            setSelectedCompany(null);
          }}
        />
      )}
    </div>
  );
}
