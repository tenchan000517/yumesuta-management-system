'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  ExternalLink,
  Square,
  CheckSquare,
  CheckCircle2,
  Upload,
  FileText,
  Music,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  Download,
  FolderOpen,
  Play,
  FileCode,
} from 'lucide-react';
import type { ProcessDetail } from '@/types/yumemaga-process';

interface ProcessSidePanelProps {
  process: ProcessDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onChecklistChange?: (processNo: string, checkId: string, checked: boolean) => void;
  onCompleteProcess?: (processNo: string) => void;
  onUploadDeliverable?: (processNo: string, file: File) => void;
}

export function ProcessSidePanel({
  process,
  isOpen,
  onClose,
  onChecklistChange,
  onCompleteProcess,
  onUploadDeliverable,
}: ProcessSidePanelProps) {
  const [showTranscriptionGuide, setShowTranscriptionGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !process) {
    return null;
  }

  const handleChecklistToggle = (checkId: string, checked: boolean) => {
    if (onChecklistChange) {
      onChecklistChange(process.processNo, checkId, checked);
    }
  };

  const handleCompleteProcess = () => {
    if (onCompleteProcess && confirm('この工程を完了にしますか？')) {
      onCompleteProcess(process.processNo);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUploadDeliverable) {
      onUploadDeliverable(process.processNo, file);
    }
  };

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <Music className="w-5 h-5" />;
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const checkedCount = process.checklist.filter((item) => item.checked).length;
  const totalCount = process.checklist.length;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>

      {/* サイドパネル */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* ヘッダー */}
          <div className="flex items-start justify-between border-b border-gray-200 pb-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">
                {process.categoryName} / {process.issue}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {process.processNo}: {process.processName}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* ステータス */}
          <section>
            <div className="flex items-center gap-3">
              {process.status === 'completed' && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  完了
                </span>
              )}
              {process.status === 'in_progress' && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  <Play className="w-4 h-4" />
                  進行中
                </span>
              )}
              {process.status === 'delayed' && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  遅延（{process.delayDays}日）
                </span>
              )}
              {process.status === 'not_started' && (
                <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                  未着手
                </span>
              )}
            </div>
          </section>

          {/* 日程管理 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              日程管理
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">予定日:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {process.plannedDate || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">実績日:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {process.actualDate || '未完了'}
                </span>
              </div>
            </div>
          </section>

          {/* 概要 */}
          {process.overview && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">概要</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">{process.overview}</p>
              </div>
            </section>
          )}

          {/* チェックリスト */}
          {process.checklist.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                チェックリスト ({checkedCount}/{totalCount}完了)
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                {process.checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleChecklistToggle(item.id, !item.checked)}
                    className="w-full flex items-center gap-3 p-3 bg-white hover:bg-gray-50 rounded-lg transition-colors text-left border border-gray-200"
                  >
                    {item.checked ? (
                      <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        item.checked
                          ? 'text-gray-500 line-through'
                          : 'text-gray-900 font-medium'
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 必要データ */}
          {process.requiredData && process.requiredData.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">必要データ</h3>
              <div className="space-y-3">
                {process.requiredData.map((data) => (
                  <div
                    key={data.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        data.type === 'audio' ? 'bg-green-100 text-green-600' :
                        data.type === 'image' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {getDataTypeIcon(data.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{data.name}</p>
                        {data.fileName && (
                          <p className="text-sm text-gray-600 mt-1">
                            ファイル: {data.fileName}
                          </p>
                        )}
                        {data.fileSize && (
                          <p className="text-xs text-gray-500">
                            サイズ: {data.fileSize}
                          </p>
                        )}
                        {data.deadline && (
                          <p className="text-xs text-gray-500 mt-1">
                            期限: {data.deadline}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {data.status === 'submitted' ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                              ✅ 提出済み
                            </span>
                          ) : data.status === 'pending' ? (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-semibold">
                              ⚠️ 未提出
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                              －
                            </span>
                          )}
                          {data.optional && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                              任意
                            </span>
                          )}
                        </div>
                        {data.driveUrl && (
                          <div className="flex gap-2 mt-3">
                            <a
                              href={data.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <FolderOpen className="w-4 h-4" />
                              Driveで開く
                            </a>
                            {data.driveFileId && (
                              <a
                                href={`https://drive.google.com/uc?export=download&id=${data.driveFileId}`}
                                download
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                              >
                                <Download className="w-4 h-4" />
                                ダウンロード
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* faster-whisper実行ガイド（工程A-3など文字起こし工程のみ表示） */}
          {process.processNo.endsWith('-3') && process.processName.includes('文字起こし') && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-purple-600" />
                faster-whisper実行ガイド
              </h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <button
                  onClick={() => setShowTranscriptionGuide(!showTranscriptionGuide)}
                  className="w-full text-left flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-purple-900">
                    {showTranscriptionGuide ? '▼ 手順を閉じる' : '▶ 詳細な手順を表示'}
                  </span>
                </button>
                {showTranscriptionGuide && (
                  <div className="mt-4 space-y-3 text-sm text-gray-700">
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">1. mp3ファイルをダウンロード</p>
                      <p>上記「必要データ」セクションから録音データをダウンロードしてください。</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">2. faster-whisperを実行</p>
                      <p className="mb-2">ダウンロードしたmp3ファイルがあるフォルダで、以下のコマンドを実行:</p>
                      <code className="block bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
                        python transcribe.py your_audio.mp3
                      </code>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">3. 文字起こしテキストを確認</p>
                      <p>生成された <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">your_audio_transcript.txt</code> を確認してください。</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <p className="font-semibold text-purple-900 mb-2">4. テキストファイルをアップロード</p>
                      <p>下記「成果物」セクションからテキストファイルをアップロードしてください。</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 成果物 */}
          {process.deliverables && process.deliverables.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">成果物</h3>
              <div className="space-y-3">
                {process.deliverables.map((deliverable) => (
                  <div
                    key={deliverable.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{deliverable.name}</p>
                        {deliverable.updatedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            更新: {deliverable.updatedAt}
                          </p>
                        )}
                      </div>
                      <div>
                        {deliverable.status === 'completed' && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                            ✅ 完了
                          </span>
                        )}
                        {deliverable.status === 'in_progress' && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                            🔵 進行中
                          </span>
                        )}
                        {deliverable.status === 'not_started' && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            ⚪ 未作成
                          </span>
                        )}
                      </div>
                    </div>

                    {deliverable.driveUrl ? (
                      <a
                        href={deliverable.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Driveで開く
                      </a>
                    ) : (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".txt,.md,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                        >
                          <Upload className="w-4 h-4" />
                          テキストファイルをアップロード
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          対応形式: .txt, .md, .docx
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ガイド・リンク */}
          {process.guides && process.guides.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">ガイド・リンク</h3>
              <div className="space-y-2">
                {process.guides.map((guide) => (
                  <a
                    key={guide.id}
                    href={guide.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                  >
                    <span className="text-2xl">{guide.icon || '📄'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900">{guide.label}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 工程完了ボタン */}
          <section>
            <button
              onClick={handleCompleteProcess}
              disabled={process.status === 'completed'}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                process.status === 'completed'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {process.status === 'completed' ? '✅ 完了済み' : 'この工程を完了にする'}
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
