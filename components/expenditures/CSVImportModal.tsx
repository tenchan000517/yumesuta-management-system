// components/expenditures/CSVImportModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    imported?: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/expenditures/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: `${data.imported}件のデータを正常にインポートしました`,
          imported: data.imported,
        });
        setCsvText('');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || 'インポートに失敗しました',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'インポート中にエラーが発生しました',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-600" />
            CSV一括インポート
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {/* 説明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  CSVフォーマット
                </p>
                <p className="text-sm text-blue-700 mb-2">
                  以下の形式でCSVデータを入力してください（ヘッダー行は不要）：
                </p>
                <code className="text-xs bg-white px-2 py-1 rounded text-blue-900 block">
                  日付,項目名,金額,カテゴリ,支払方法,立替者名,清算ステータス,清算日,備考,支払予定日
                </code>
                <p className="text-xs text-blue-600 mt-2">
                  例: 2024/10/01,印刷費,50000,経費,会社カード,,-,-,ゆめマガ印刷,2024/10/27
                </p>
              </div>
            </div>
          </div>

          {/* ファイルアップロード */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSVファイルを選択
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
          </div>

          {/* テキストエリア */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                またはCSVデータを直接入力
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="2024/10/01,印刷費,50000,経費,会社カード,,-,-,ゆめマガ印刷,2024/10/27"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={10}
                required
              />
            </div>

            {/* 結果メッセージ */}
            {result && (
              <div
                className={`mb-4 rounded-lg p-4 flex items-start gap-3 ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.message}
                  </p>
                </div>
              </div>
            )}

            {/* 送信ボタン */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading || !csvText.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                {loading ? 'インポート中...' : 'インポート'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
