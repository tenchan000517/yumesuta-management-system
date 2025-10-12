'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import type { ParsedContractForm } from '@/types/workflow';

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contractId: number) => void;
}

export function NewContractModal({ isOpen, onClose, onSuccess }: NewContractModalProps) {
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedContractForm | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleParse = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/contract/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      });

      const data = await res.json();

      if (data.success) {
        setParsedData(data.parsed);
        setParseErrors([]);
      } else {
        setParsedData(null);
        setParseErrors(data.errors || ['パースに失敗しました']);
      }
    } catch (error) {
      setParseErrors(['通信エラーが発生しました']);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!parsedData) return;

    setLoading(true);

    try {
      const res = await fetch('/api/contract/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsedData })
      });

      const data = await res.json();

      if (data.success) {
        onSuccess(data.contractId);
        onClose();
        // リセット
        setRawText('');
        setParsedData(null);
        setParseErrors([]);
      } else {
        setParseErrors([data.error || '契約作成に失敗しました']);
      }
    } catch (error) {
      setParseErrors(['通信エラーが発生しました']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">新規契約作成</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 情報収集フォーマットへの案内 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  情報収集フォーマットを顧客に送信済みですか？
                </h4>
                <p className="text-xs text-blue-700 mb-2">
                  まだの場合は、先に情報収集フォーマットを顧客に送信し、記入してもらってください。
                </p>
                <a
                  href="https://docs.google.com/document/d/[ID]/edit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  📋 情報収集フォーマットを開く
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* テキストエリア */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              情報収集フォーマットの内容を貼り付けてください
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="【◎基本情報】&#10;企業名・団体名: &#10;代表者役職: &#10;..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* パース確認ボタン */}
          <button
            onClick={handleParse}
            disabled={!rawText.trim() || loading}
            className="w-full mb-4 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {loading ? 'パース中...' : 'パース確認'}
          </button>

          {/* パース結果 */}
          {parsedData && (
            <div className="border border-green-300 bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="text-sm font-bold text-green-900">パース成功</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-semibold text-gray-700">企業名:</span>
                  <span className="ml-2 text-gray-900">{parsedData.companyName}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">代表者:</span>
                  <span className="ml-2 text-gray-900">{parsedData.representativeTitle} {parsedData.representativeName}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">契約金額:</span>
                  <span className="ml-2 text-gray-900">¥{parsedData.annualFee.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">掲載開始:</span>
                  <span className="ml-2 text-gray-900">{parsedData.publicationStart}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">契約締結日:</span>
                  <span className="ml-2 text-gray-900">{parsedData.contractDate}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">支払期限:</span>
                  <span className="ml-2 text-gray-900">{parsedData.paymentDeadline}</span>
                </div>
              </div>
            </div>
          )}

          {/* パースエラー */}
          {parseErrors.length > 0 && (
            <div className="border border-red-300 bg-red-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h4 className="text-sm font-bold text-red-900">パースエラー</h4>
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                {parseErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={!parsedData || loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {loading ? '作成中...' : '契約開始'}
          </button>
        </div>
      </div>
    </div>
  );
}
