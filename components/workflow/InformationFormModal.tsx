// components/workflow/InformationFormModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Copy, Check, FileText, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { informationFormTemplate } from '@/data/information-form-template';
import type { ParsedContractForm } from '@/types/workflow';

interface InformationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId?: number; // 契約ID（更新用）
  onSuccess?: () => void; // 更新成功時のコールバック
}

type ViewMode = 'template' | 'paste';

export function InformationFormModal({ isOpen, onClose, contractId, onSuccess }: InformationFormModalProps) {
  const [mode, setMode] = useState<ViewMode>('template');
  const [copied, setCopied] = useState(false);

  // 貼り付けモード用の状態
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedContractForm | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  // パース処理
  const handleParse = async () => {
    if (!rawText.trim()) {
      setParseErrors(['フォーマットを貼り付けてください']);
      return;
    }

    setIsParsing(true);
    setParseErrors([]);
    setParsedData(null);

    try {
      const response = await fetch('/api/contract/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      });

      const result = await response.json();

      if (result.success) {
        setParsedData(result.parsed);
        setShowConfirm(true);
      } else {
        setParseErrors(result.errors || ['パースに失敗しました']);
      }
    } catch (error) {
      console.error('Parse error:', error);
      setParseErrors(['通信エラーが発生しました']);
    } finally {
      setIsParsing(false);
    }
  };

  // 保存処理
  const handleSave = async () => {
    if (!parsedData || !contractId) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/contract/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsedData })
      });

      const result = await response.json();

      if (result.success) {
        alert('契約情報を更新しました');
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      } else {
        alert(`保存に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('通信エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // モーダルを閉じる
  const handleClose = () => {
    setMode('template');
    setRawText('');
    setParsedData(null);
    setParseErrors([]);
    setShowConfirm(false);
    onClose();
  };

  return (
    <>
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* モーダル本体 */}
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
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
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* タブ切り替え */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setMode('template')}
              className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                mode === 'template'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              テンプレート表示
            </button>
            <button
              onClick={() => setMode('paste')}
              className={`flex-1 px-6 py-3 font-semibold transition-colors ${
                mode === 'paste'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              記入済みフォーマット貼り付け
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            {mode === 'template' ? (
              // テンプレート表示モード
              <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap border border-gray-200">
                {informationFormTemplate}
              </div>
            ) : (
              // 貼り付けモード
              <div className="space-y-4">
                {!showConfirm ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        記入済みフォーマットを貼り付けてください
                      </label>
                      <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="顧客から返信された情報収集フォーマットの内容を貼り付けてください"
                        className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>

                    {parseErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-red-900 mb-2">パースエラー</h4>
                            <ul className="space-y-1">
                              {parseErrors.map((error, index) => (
                                <li key={index} className="text-sm text-red-800">• {error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // パース結果確認画面
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <h4 className="text-sm font-bold text-green-900">パース成功</h4>
                      </div>
                      <p className="text-sm text-green-800">
                        以下の内容で契約情報を更新します。内容をご確認ください。
                      </p>
                    </div>

                    {parsedData && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 基本情報 */}
                        <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h5 className="text-sm font-bold text-blue-900 mb-3">基本情報</h5>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-blue-600 font-semibold">企業名:</span>
                              <span className="ml-2 text-blue-900">{parsedData.companyName}</span>
                            </div>
                            <div>
                              <span className="text-blue-600 font-semibold">代表者:</span>
                              <span className="ml-2 text-blue-900">{parsedData.representativeTitle} {parsedData.representativeName}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-blue-600 font-semibold">住所:</span>
                              <span className="ml-2 text-blue-900">{parsedData.address}</span>
                            </div>
                            <div>
                              <span className="text-blue-600 font-semibold">電話:</span>
                              <span className="ml-2 text-blue-900">{parsedData.phone}</span>
                            </div>
                            <div>
                              <span className="text-blue-600 font-semibold">メール:</span>
                              <span className="ml-2 text-blue-900">{parsedData.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* 担当者情報 */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h5 className="text-sm font-bold text-gray-900 mb-3">担当者情報</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600 font-semibold">担当者名:</span>
                              <span className="ml-2 text-gray-900">{parsedData.contactPerson}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 font-semibold">メール:</span>
                              <span className="ml-2 text-gray-900">{parsedData.contactEmail}</span>
                            </div>
                          </div>
                        </div>

                        {/* 契約情報 */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h5 className="text-sm font-bold text-gray-900 mb-3">契約情報</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600 font-semibold">契約日:</span>
                              <span className="ml-2 text-gray-900">{parsedData.contractDate}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 font-semibold">支払期限:</span>
                              <span className="ml-2 text-gray-900">{parsedData.paymentDeadline}</span>
                            </div>
                          </div>
                        </div>

                        {/* 掲載プラン */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h5 className="text-sm font-bold text-gray-900 mb-3">掲載プラン</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600 font-semibold">契約料金:</span>
                              <span className="ml-2 text-gray-900">¥{parsedData.annualFee.toLocaleString()}/年</span>
                            </div>
                            <div>
                              <span className="text-gray-600 font-semibold">月額料金:</span>
                              <span className="ml-2 text-gray-900">¥{parsedData.monthlyFee.toLocaleString()}/月</span>
                            </div>
                          </div>
                        </div>

                        {/* 掲載期間 */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h5 className="text-sm font-bold text-gray-900 mb-3">掲載期間</h5>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600 font-semibold">開始:</span>
                              <span className="ml-2 text-gray-900">{parsedData.publicationStart}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 font-semibold">終了:</span>
                              <span className="ml-2 text-gray-900">{parsedData.publicationEnd}</span>
                            </div>
                          </div>
                        </div>

                        {/* 広告仕様 */}
                        <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h5 className="text-sm font-bold text-gray-900 mb-3">広告仕様</h5>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600 font-semibold">サイズ:</span>
                              <span className="ml-2 text-gray-900">{parsedData.adSize}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 font-semibold">位置:</span>
                              <span className="ml-2 text-gray-900">{parsedData.adPosition}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 font-semibold">デザイン:</span>
                              <span className="ml-2 text-gray-900">{parsedData.designFormat}</span>
                            </div>
                          </div>
                        </div>

                        {/* 送付設定 */}
                        <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h5 className="text-sm font-bold text-gray-900 mb-3">送付設定</h5>
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-gray-600 font-semibold">基本契約書:</span>
                              <span className="ml-2 text-gray-900">{parsedData.sendBasicContract ? '送付する' : '送付しない'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 font-semibold">申込書:</span>
                              <span className="ml-2 text-gray-900">{parsedData.sendApplication ? '送付する' : '送付しない'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {mode === 'template' ? (
              <div className="flex items-center justify-between gap-4">
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
            ) : (
              <div className="flex gap-3">
                {!showConfirm ? (
                  <>
                    <button
                      onClick={handleClose}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleParse}
                      disabled={isParsing || !rawText.trim()}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      {isParsing ? '解析中...' : 'パースして確認'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowConfirm(false)}
                      disabled={isSaving}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
                    >
                      戻る
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !contractId}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isSaving ? '保存中...' : '契約情報を更新'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
