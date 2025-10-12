// components/workflow/EmailModal.tsx
'use client';

import React from 'react';
import { X, Copy } from 'lucide-react';
import type { EmailTemplate } from '@/types/workflow';

interface EmailModalProps {
  email: EmailTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  companyName?: string; // 企業名（オプション）
}

export function EmailModal({ email, isOpen, onClose, companyName }: EmailModalProps) {
  if (!isOpen || !email) return null;

  // 企業名を置き換える関数
  const replaceCompanyName = (text: string): string => {
    if (!companyName) return text;
    // 「〇〇株式会社」や「〇〇様」を実際の企業名に置き換え
    return text.replace(/〇〇株式会社/g, companyName).replace(/〇〇様/g, companyName + '様');
  };

  const displaySubject = replaceCompanyName(email.subject);
  const displayBody = replaceCompanyName(email.body);

  const handleCopy = () => {
    const text = `件名: ${displaySubject}\n\n${displayBody}`;
    navigator.clipboard.writeText(text);
    alert('クリップボードにコピーしました');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">メール例文</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-700 mb-1 block">件名:</label>
            <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded">{displaySubject}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">本文:</label>
            <pre className="text-sm text-gray-900 p-4 bg-gray-50 rounded whitespace-pre-wrap font-sans">
              {displayBody}
            </pre>
          </div>
        </div>
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            閉じる
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Copy className="w-5 h-5" />
            コピー
          </button>
        </div>
      </div>
    </div>
  );
}
