// components/workflow/InformationFormModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';
import { informationFormTemplate } from '@/data/information-form-template';

interface InformationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InformationFormModal({ isOpen, onClose }: InformationFormModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(informationFormTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* モーダル本体 */}
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">情報収集フォーマット</h2>
                <p className="text-sm text-gray-600">契約に必要な情報を収集するためのフォーマット</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap border border-gray-200">
              {informationFormTemplate}
            </div>
          </div>

          {/* フッター */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              このフォーマットをコピーして顧客に送信してください
            </p>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>コピーしました</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>コピー</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
