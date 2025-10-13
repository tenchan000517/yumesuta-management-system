// components/workflow/SidePanel.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, ExternalLink, Square, CheckSquare, Building2, MapPin, Phone, User, CheckCircle2, Upload, FileText } from 'lucide-react';
import type { WorkflowStep, CompanyMasterData } from '@/types/workflow';

interface SidePanelProps {
  step: WorkflowStep | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateChecklist: (itemId: string) => void;
  onOpenEmailModal: (templateId: string) => void;
  companyId?: number; // 企業ID（Phase 1.6で追加）
  contractId?: number; // 契約ID（Phase 2.1で追加）
  companyName?: string; // 企業名（Phase 2.2で追加）
  onStepCompleted?: (stepNumber: number) => void; // ステップ完了コールバック（Phase 2.1で追加）
}

export function SidePanel({
  step,
  isOpen,
  onClose,
  onUpdateChecklist,
  onOpenEmailModal,
  companyId,
  contractId,
  companyName,
  onStepCompleted,
}: SidePanelProps) {
  const [companyInfo, setCompanyInfo] = useState<CompanyMasterData | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [showCompanyDetailModal, setShowCompanyDetailModal] = useState(false);

  // Phase 2.1: ステップ完了機能の状態管理
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Phase 2.2: エビデンス保存機能の状態管理
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // URL入力用（ステップ2, 4）
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [isMovingDocument, setIsMovingDocument] = useState(false);

  // 企業情報を取得
  useEffect(() => {
    if (companyId && step?.stepNumber === 1) {
      setIsLoadingCompany(true);
      fetch(`/api/company-master/${companyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCompanyInfo(data.company);
          }
        })
        .catch((error) => {
          console.error('企業情報取得エラー:', error);
        })
        .finally(() => {
          setIsLoadingCompany(false);
        });
    } else {
      setCompanyInfo(null);
    }
  }, [companyId, step?.stepNumber]);

  // Phase 2.2: ファイル一覧取得
  useEffect(() => {
    const loadFiles = async () => {
      if (!contractId || !companyId) {
        setFiles([]);
        setDriveFolderUrl('');
        return;
      }

      try {
        const res = await fetch(
          `/api/contract/drive/list?contractId=${contractId}&companyId=${companyId}`
        );
        const data = await res.json();

        if (data.success) {
          setFiles(data.files || []);
          setDriveFolderUrl(data.driveFolderUrl || '');
        }
      } catch (error) {
        console.error('ファイル一覧取得エラー:', error);
      }
    };

    loadFiles();
  }, [contractId, companyId]);

  // Phase 2.2: ファイルアップロード処理
  const handleFileUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0 || !contractId || !companyId) return;

    setIsUploading(true);

    try {
      const file = selectedFiles[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contractId', contractId.toString());
      formData.append('companyId', companyId.toString());

      const res = await fetch('/api/contract/drive/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert(`アップロード成功: ${data.file.name}`);
        // ファイル一覧を再取得
        const listRes = await fetch(
          `/api/contract/drive/list?contractId=${contractId}&companyId=${companyId}`
        );
        const listData = await listRes.json();
        if (listData.success) {
          setFiles(listData.files || []);
          setDriveFolderUrl(listData.driveFolderUrl || '');
        }
      } else {
        alert(`アップロード失敗: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('アップロードエラーが発生しました');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Phase 2.2: ドキュメント移動処理（ステップ2, 4用）
  const handleMoveDocument = async () => {
    if (!documentUrl || !contractId || !companyId) return;

    setIsMovingDocument(true);

    try {
      const res = await fetch('/api/contract/drive/move-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: documentUrl,
          contractId,
          companyId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`移動成功: ${data.file.name}`);
        setDocumentUrl('');
        // ファイル一覧を再取得
        const listRes = await fetch(
          `/api/contract/drive/list?contractId=${contractId}&companyId=${companyId}`
        );
        const listData = await listRes.json();
        if (listData.success) {
          setFiles(listData.files || []);
          setDriveFolderUrl(listData.driveFolderUrl || '');
        }
      } else {
        alert(`移動失敗: ${data.error}`);
      }
    } catch (error) {
      console.error('Move document error:', error);
      alert('ドキュメント移動エラーが発生しました');
    } finally {
      setIsMovingDocument(false);
    }
  };

  // Phase 2.1: ステップ完了処理
  const handleComplete = async () => {
    if (!step || !contractId) return;

    setIsCompleting(true);
    setCompleteError(null);

    try {
      const res = await fetch('/api/contract/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          stepNumber: step.stepNumber
        })
      });

      const data = await res.json();

      if (data.success) {
        // 成功時の処理
        if (onStepCompleted) {
          onStepCompleted(step.stepNumber);
        }
        setShowCompleteConfirm(false);
        onClose();
      } else {
        setCompleteError(data.error || 'エラーが発生しました');
      }
    } catch (error) {
      setCompleteError('通信エラーが発生しました');
    } finally {
      setIsCompleting(false);
    }
  };

  // Phase 2.1: 完了ボタンの表示条件
  const canComplete = () => {
    // 契約が選択されている場合のみ表示
    return contractId !== undefined && contractId > 0;
  };

  // チェックリスト更新関数（API連携）
  const handleChecklistUpdate = async (itemId: string, checked: boolean) => {
    // 1. ローカル状態を即座に更新（UXのため）
    onUpdateChecklist(itemId);

    // 2. APIに保存
    if (contractId) {
      try {
        const response = await fetch(`/api/contract/checklist/${contractId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkId: itemId,
            checked: !checked, // 反転（クリック前の状態から反転させる）
          }),
        });

        const result = await response.json();
        if (!result.success) {
          console.error('チェックリスト更新エラー:', result.error);
          alert('チェックリストの保存に失敗しました');
          // 失敗したら元に戻す
          onUpdateChecklist(itemId);
        }
      } catch (error) {
        console.error('チェックリスト更新エラー:', error);
        alert('チェックリストの保存に失敗しました');
        // 失敗したら元に戻す
        onUpdateChecklist(itemId);
      }
    }
  };

  if (!isOpen || !step) return null;

  return (
    <>
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* サイドパネル */}
      <div className="fixed inset-y-0 right-0 w-full md:w-2/3 lg:w-1/2 xl:w-1/3 bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                ステップ {step.stepNumber}: {step.title}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  step.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : step.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {step.status === 'completed' ? '完了' : step.status === 'in_progress' ? '進行中' : '未着手'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* ステータス表示（読み取り専用） */}
          <div className="flex gap-2">
            <div
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-center transition-opacity ${
                step.status === 'pending'
                  ? 'bg-gray-200 text-gray-900 opacity-100'
                  : 'bg-gray-100 text-gray-400 opacity-50'
              }`}
            >
              未着手
            </div>
            <div
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-center transition-opacity ${
                step.status === 'in_progress'
                  ? 'bg-blue-500 text-white opacity-100'
                  : 'bg-blue-100 text-blue-400 opacity-50'
              }`}
            >
              進行中
            </div>
            <div
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-center transition-opacity ${
                step.status === 'completed'
                  ? 'bg-green-500 text-white opacity-100'
                  : 'bg-green-100 text-green-400 opacity-50'
              }`}
            >
              完了
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* 概要 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">概要</h3>
            <p className="text-sm text-gray-700">{step.overview}</p>
          </section>

          {/* 企業情報（ステップ①のみ表示） */}
          {step.stepNumber === 1 && companyId && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">企業情報</h3>
              {isLoadingCompany ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">読み込み中...</p>
                </div>
              ) : companyInfo ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  {/* 企業正式名称 */}
                  <div className="flex items-start gap-2">
                    <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-semibold">企業正式名称</p>
                      <p className="text-sm text-blue-900 font-bold">{companyInfo.officialName}</p>
                    </div>
                  </div>

                  {/* 住所 */}
                  {companyInfo.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 font-semibold">住所</p>
                        <p className="text-sm text-blue-900">
                          {companyInfo.postalCode && `〒${companyInfo.postalCode} `}
                          {companyInfo.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 電話番号 */}
                  {companyInfo.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 font-semibold">電話番号</p>
                        <p className="text-sm text-blue-900">{companyInfo.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* メールアドレス */}
                  {companyInfo.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 font-semibold">メールアドレス</p>
                        <p className="text-sm text-blue-900">{companyInfo.email}</p>
                      </div>
                    </div>
                  )}

                  {/* 担当者 */}
                  {companyInfo.contactPerson && (
                    <div className="flex items-start gap-2">
                      <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 font-semibold">担当者</p>
                        <p className="text-sm text-blue-900">
                          {companyInfo.contactPerson}
                          {companyInfo.contactEmail && ` (${companyInfo.contactEmail})`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 詳細表示ボタン */}
                  <div className="pt-2 border-t border-blue-200">
                    <button
                      onClick={() => setShowCompanyDetailModal(true)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      詳細を表示
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500">企業情報が見つかりません</p>
                </div>
              )}
            </section>
          )}

          {/* やることリスト */}
          {step.actions.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">やることリスト</h3>
              <ul className="space-y-2">
                {step.actions.map((action, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <div
                      className="flex-1"
                      dangerouslySetInnerHTML={{ __html: action }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* チェックリスト */}
          {step.checklist.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">チェックリスト</h3>
              <div className="space-y-2">
                {step.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleChecklistUpdate(item.id, item.checked)}
                  >
                    {item.checked ? (
                      <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${
                      item.checked ? 'text-gray-500 line-through' : 'text-gray-700'
                    }`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ガイド・リンク */}
          {step.guides.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">ガイド・リンク</h3>
              <div className="space-y-2">
                {step.guides.map((guide) => (
                  <button
                    key={guide.id}
                    onClick={() => {
                      if (guide.type === 'modal' && guide.target) {
                        onOpenEmailModal(guide.target);
                      } else if (guide.type === 'external' && guide.target) {
                        window.open(guide.target, '_blank');
                      }
                    }}
                    className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                  >
                    <span className="text-2xl">{guide.icon || '📄'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900">{guide.label}</p>
                      <p className="text-xs text-blue-600">
                        {guide.type === 'modal' ? 'メール例文を開く' : '新しいタブで開く'}
                      </p>
                    </div>
                    {guide.type === 'modal' ? (
                      <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Phase 2.2: エビデンス保存セクション（ステップ2, 4, 7, 8のみ表示） */}
          {contractId && companyId && step && [2, 4, 7, 8].includes(step.stepNumber) && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">エビデンス保存</h3>

              {/* ステップ2, 4: URL入力欄 */}
              {[2, 4].includes(step.stepNumber) && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {step.stepNumber === 2 ? 'Googleドキュメント（基本契約書）のURL' : 'スプレッドシート（申込書）のURL'}
                  </label>
                  <input
                    type="text"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                  />
                  <button
                    onClick={handleMoveDocument}
                    disabled={isMovingDocument || !documentUrl}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isMovingDocument ? '移動中...' : '契約フォルダに移動して保存'}
                  </button>
                </div>
              )}

              {/* ステップ7, 8: ファイルアップロード */}
              {[7, 8].includes(step.stepNumber) && (
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'アップロード中...' : 'ファイルを選択'}
                  </button>
                </div>
              )}

              {/* 保存済みファイル（最大5件） */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">保存済みファイル</h4>
                {files.length === 0 ? (
                  <p className="text-sm text-gray-500">ファイルはありません</p>
                ) : (
                  <div className="space-y-2">
                    {files.slice(0, 5).map((file) => (
                      <a
                        key={file.id}
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                      >
                        <FileText className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                        <span className="text-sm text-gray-700 group-hover:text-blue-600 truncate">
                          {file.name}
                        </span>
                      </a>
                    ))}
                    {files.length > 5 && (
                      <p className="text-xs text-gray-500">他{files.length - 5}件</p>
                    )}
                  </div>
                )}
              </div>

              {/* Google Driveリンク */}
              {driveFolderUrl && (
                <div className="mt-4">
                  <a
                    href={driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Google Driveで開く
                  </a>
                </div>
              )}
            </section>
          )}

          {/* 注意事項 */}
          {step.notes && step.notes.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">注意事項</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {step.notes.map((note, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-yellow-900">
                      <span className="flex-shrink-0 mt-1">⚠️</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Phase 2.1: ステップ完了ボタン */}
          {canComplete() && (
            <section>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {!showCompleteConfirm ? (
                  <button
                    onClick={() => setShowCompleteConfirm(true)}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    このステップを完了にする
                  </button>
                ) : (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">完了確認</h4>
                    <p className="text-xs text-gray-600 mb-3">
                      完了すると以下の情報が契約・入金管理シートに記録されます:
                    </p>
                    <ul className="text-xs text-gray-700 mb-4 space-y-1">
                      {getUpdateInfo(step.stepNumber).map((info, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{info}</span>
                        </li>
                      ))}
                    </ul>
                    {completeError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-800">{completeError}</p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowCompleteConfirm(false);
                          setCompleteError(null);
                        }}
                        disabled={isCompleting}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-semibold disabled:opacity-50 transition-colors"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleComplete}
                        disabled={isCompleting}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:bg-gray-300 transition-colors"
                      >
                        {isCompleting ? '処理中...' : '完了する'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* 企業情報詳細モーダル */}
      {showCompanyDetailModal && companyInfo && (
        <>
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setShowCompanyDetailModal(false)}
          />

          {/* モーダル */}
          <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* ヘッダー */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">企業詳細情報</h3>
                <button
                  onClick={() => setShowCompanyDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* コンテンツ */}
              <div className="p-6 space-y-6">
                {/* 基本情報 */}
                <section>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">基本情報</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">企業ID</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.companyId}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">企業正式名称</label>
                      <p className="text-sm text-gray-900 mt-1 font-bold">{companyInfo.officialName}</p>
                    </div>
                    {companyInfo.shortName && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600">企業略称</label>
                        <p className="text-sm text-gray-900 mt-1">{companyInfo.shortName}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-gray-600">代表者役職</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.representativeTitle || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">代表者名</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.representativeName || '-'}</p>
                    </div>
                  </div>
                </section>

                {/* 連絡先情報 */}
                <section>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">連絡先情報</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">郵便番号</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.postalCode || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600">住所</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.address || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">電話番号</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">FAX番号</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.fax || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">メールアドレス</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">HP URL</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {companyInfo.websiteUrl ? (
                          <a href={companyInfo.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {companyInfo.websiteUrl}
                          </a>
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* 担当者情報 */}
                <section>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">担当者情報</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">担当者名</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.contactPerson || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">担当者メールアドレス</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.contactEmail || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">担当者電話番号</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.contactPhone || '-'}</p>
                    </div>
                  </div>
                </section>

                {/* その他情報 */}
                <section>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">その他情報</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {companyInfo.industry && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600">業種</label>
                        <p className="text-sm text-gray-900 mt-1">{companyInfo.industry}</p>
                      </div>
                    )}
                    {companyInfo.employeeCount && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600">従業員数</label>
                        <p className="text-sm text-gray-900 mt-1">{companyInfo.employeeCount}名</p>
                      </div>
                    )}
                    {companyInfo.capital && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600">資本金</label>
                        <p className="text-sm text-gray-900 mt-1">{companyInfo.capital}</p>
                      </div>
                    )}
                    {companyInfo.establishedDate && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600">設立年月日</label>
                        <p className="text-sm text-gray-900 mt-1">{companyInfo.establishedDate}</p>
                      </div>
                    )}
                    {companyInfo.notes && (
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-gray-600">備考</label>
                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{companyInfo.notes}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* メタ情報 */}
                <section>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">登録情報</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">登録日</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.registeredDate || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">最終更新日</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.lastUpdatedDate || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">データソース</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.dataSource || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">契約実績</label>
                      <p className="text-sm text-gray-900 mt-1">{companyInfo.contractCount}件</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* フッター */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                <button
                  onClick={() => setShowCompanyDetailModal(false)}
                  className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/**
 * Phase 2.1: ステップ番号に応じた更新情報を取得
 */
function getUpdateInfo(stepNumber: number): string[] {
  const mapping: Record<number, string[]> = {
    1: ['ステップ1完了日（R列）'],
    2: ['ステップ2完了日（S列）'],
    3: ['契約書送付日（H列）', 'ステップ3完了日（T列）'],
    4: ['ステップ4完了日（U列）'],
    5: ['申込書送付日（J列）', 'ステップ5完了日（V列）'],
    6: ['ステップ6完了日（W列）'],
    7: ['契約書回収日（I列）', '申込書回収日（K列）', 'ステップ7完了日（X列）'],
    8: ['ステップ8完了日（Y列）'],
    9: ['入金実績日（M列）', '入金ステータス（N列）: 入金済', 'ステップ9完了日（Z列）'],
    10: ['ステップ10完了日（AA列）'],
    11: ['ステップ11完了日（AB列）'],
    12: ['ステップ12完了日（AC列）'],
    13: ['ステップ13完了日（AD列）']
  };

  return mapping[stepNumber] || [];
}
