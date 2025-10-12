'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ExternalLink } from 'lucide-react';

const resources = [
  {
    id: 'info-form',
    label: '情報収集フォーマット',
    emoji: '📋',
    url: 'https://docs.google.com/document/d/[ID]/edit',
    description: '新規契約時に顧客に送信するフォーマット'
  },
  {
    id: 'basic-contract',
    label: '基本契約書（原本）',
    emoji: '📄',
    url: 'https://docs.google.com/document/d/1B_GK3cknmtgGgpKVjKUerOOgQ7RgQcwwdLMBy12gBDo/edit',
    description: 'ステップ②で使用'
  },
  {
    id: 'application-form',
    label: '申込書（原本）',
    emoji: '📄',
    url: 'https://docs.google.com/document/d/[ID]/edit',
    description: 'ステップ④で使用'
  },
  {
    id: 'moneyforward',
    label: 'マネーフォワード',
    emoji: '🔗',
    url: 'https://biz.moneyforward.com/',
    description: '契約書押印・請求書作成で使用'
  },
  {
    id: 'contract-sheet',
    label: '契約・入金管理シート',
    emoji: '📊',
    url: `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SALES_SPREADSHEET_ID}/edit#gid=791125447`,
    description: '契約データを直接確認・編集'
  }
];

export function ResourceMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm font-semibold">リソース</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
            <div className="p-2">
              {resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="text-2xl">{resource.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {resource.label}
                      </span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {resource.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
