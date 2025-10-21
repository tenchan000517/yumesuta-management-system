'use client';

import React, { useState, useRef, useMemo } from 'react';
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
  Copy,
  Edit3,
} from 'lucide-react';
import type { ProcessDetail } from '@/types/yumemaga-process';
import {
  generateContentOrganizationPrompt,
  generateProfileSummaryPrompt,
} from '@/data/content-organization-prompt-template';

interface ProcessSidePanelProps {
  process: ProcessDetail | null;
  isOpen: boolean;
  onClose: () => void;
  issue?: string; // 月号（例: "2025年11月号"）
  onChecklistChange?: (processNo: string, checkId: string, checked: boolean) => void;
  onCompleteProcess?: (processNo: string) => void;
  onUploadDeliverable?: (processNo: string, file: File) => void;
  onUploadRequiredData?: (processNo: string, dataId: string, file: File) => void;
}

export function ProcessSidePanel({
  process,
  isOpen,
  onClose,
  issue,
  onChecklistChange,
  onCompleteProcess,
  onUploadDeliverable,
  onUploadRequiredData,
}: ProcessSidePanelProps) {
  const [showTranscriptionGuide, setShowTranscriptionGuide] = useState(false);
  const [uploadingDataId, setUploadingDataId] = useState<string | null>(null);
  const [filePath, setFilePath] = useState('');
  const [copiedVenvCommand, setCopiedVenvCommand] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [copiedCheckCommand, setCopiedCheckCommand] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requiredDataFileInputRef = useRef<HTMLInputElement>(null);

  // A-4工程（内容整理）用のstate
  const [interviewerRequests, setInterviewerRequests] = useState('');
  const [transcriptFilePath, setTranscriptFilePath] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [documentLink, setDocumentLink] = useState('');
  const [isSavingDocument, setIsSavingDocument] = useState(false);

  // 人物概要作成用のstate
  const [organizedInterview, setOrganizedInterview] = useState('');
  const [copiedProfilePrompt, setCopiedProfilePrompt] = useState(false);

  // コマンド自動生成
  const { generatedCommand, outputPath } = useMemo(() => {
    if (!filePath) return { generatedCommand: '', outputPath: '' };

    // 既存のクォートを除去してトリム
    const cleanPath = filePath.trim().replace(/^["']|["']$/g, '');

    // パスから親ディレクトリを抽出
    const isWindows = cleanPath.includes('\\');
    const separator = isWindows ? '\\' : '/';
    const lastSeparatorIndex = cleanPath.lastIndexOf(separator);
    const directory = lastSeparatorIndex > 0 ? cleanPath.substring(0, lastSeparatorIndex) : '';

    // ファイル名から拡張子を除去してoutputPathを生成
    const fileName = cleanPath.substring(lastSeparatorIndex + 1);
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const output = directory ? `${directory}${separator}${fileNameWithoutExt}.txt` : `${fileNameWithoutExt}.txt`;

    // Pythonスクリプトを実行するコマンドを生成
    const command = `python ~/transcribe.py "${cleanPath}"`;

    return { generatedCommand: command, outputPath: output };
  }, [filePath]);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(generatedCommand);
  };

  const handleCopyVenvCommand = () => {
    navigator.clipboard.writeText('cd ~\nsource whisper-env/Scripts/activate');
    setCopiedVenvCommand(true);
    setTimeout(() => setCopiedVenvCommand(false), 2000);
  };

  const handleCopyCheckCommand = () => {
    navigator.clipboard.writeText('pip show faster-whisper');
    setCopiedCheckCommand(true);
    setTimeout(() => setCopiedCheckCommand(false), 2000);
  };

  // A-4工程用: プロンプト自動生成
  const generatedPrompt = useMemo(() => {
    if (!transcriptFilePath) return '';
    return generateContentOrganizationPrompt(transcriptFilePath, interviewerRequests);
  }, [transcriptFilePath, interviewerRequests]);

  // A-4工程用: プロンプトコピー
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // 人物概要作成用: プロンプト自動生成
  const generatedProfilePrompt = useMemo(() => {
    if (!organizedInterview) return '';
    return generateProfileSummaryPrompt(organizedInterview);
  }, [organizedInterview]);

  // 人物概要作成用: プロンプトコピー
  const handleCopyProfilePrompt = () => {
    navigator.clipboard.writeText(generatedProfilePrompt);
    setCopiedProfilePrompt(true);
    setTimeout(() => setCopiedProfilePrompt(false), 2000);
  };

  // A-4工程用: Googleドキュメント新規作成
  const handleCreateDocument = () => {
    window.open('https://docs.google.com/document/create', '_blank');
  };

  // A-4工程用: ドキュメント保存（フォルダ移動）
  const handleSaveDocument = async () => {
    if (!documentLink.trim()) {
      alert('Googleドキュメントのリンクを入力してください');
      return;
    }

    // リンクからドキュメントIDを抽出
    const match = documentLink.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      alert('正しいGoogleドキュメントのリンクを入力してください');
      return;
    }

    const documentId = match[1];

    setIsSavingDocument(true);
    try {
      const res = await fetch('/api/yumemaga-v2/move-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          processNo: process?.processNo,
          issue: issue || '',
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('✅ Googleドキュメントを所定のフォルダに移動しました！');
        setDocumentLink('');
      } else {
        alert(`❌ 保存に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error('ドキュメント保存エラー:', error);
      alert('❌ 保存に失敗しました');
    } finally {
      setIsSavingDocument(false);
    }
  };

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

  const handleRequiredDataFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUploadRequiredData && uploadingDataId) {
      onUploadRequiredData(process.processNo, uploadingDataId, file);
      setUploadingDataId(null);
    }
    // リセット
    if (requiredDataFileInputRef.current) {
      requiredDataFileInputRef.current.value = '';
    }
  };

  const handleRequiredDataUploadClick = (dataId: string) => {
    setUploadingDataId(dataId);
    requiredDataFileInputRef.current?.click();
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
              {/* 必要データ用のファイル入力（hidden） */}
              <input
                ref={requiredDataFileInputRef}
                type="file"
                onChange={handleRequiredDataFileUpload}
                className="hidden"
              />
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
                        <div className="flex gap-2 mt-3">
                          {/* アップロードボタン（pending/none の場合表示） */}
                          {(data.status === 'pending' || data.status === 'none') && onUploadRequiredData && (
                            <button
                              onClick={() => handleRequiredDataUploadClick(data.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              <Upload className="w-4 h-4" />
                              アップロード
                            </button>
                          )}
                          {/* Driveで開く・ダウンロードボタン（submitted の場合表示） */}
                          {data.driveUrl && (
                            <a
                              href={data.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <FolderOpen className="w-4 h-4" />
                              Driveで開く
                            </a>
                          )}
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 文字起こし実行ガイド（工程A-3など文字起こし工程のみ表示） */}
          {process.processNo.endsWith('-3') && process.processName.includes('文字起こし') && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-purple-600" />
                文字起こし実行（transcribe.py）
              </h3>

              {/* 初めての方へ（展開型） */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg mb-3">
                <button
                  onClick={() => setShowSetupGuide(!showSetupGuide)}
                  className="w-full p-3 text-left flex items-center justify-between hover:bg-blue-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-blue-900">
                    📘 初めての方へ（セットアップが必要です）
                  </span>
                  <span className="text-blue-600">
                    {showSetupGuide ? '▼' : '▶'}
                  </span>
                </button>

                {showSetupGuide && (
                  <div className="p-3 pt-0 space-y-3">
                    {/* セットアップガイドへのリンク */}
                    <div className="bg-white border border-blue-300 rounded-lg p-3">
                      <p className="text-xs text-blue-900 font-semibold mb-2">
                        まだセットアップが完了していない方
                      </p>
                      <p className="text-xs text-blue-800 mb-2">
                        以下の2つが必要です：
                      </p>
                      <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside mb-3">
                        <li>faster-whisperのインストール（仮想環境内）</li>
                        <li>transcribe.pyスクリプトの作成</li>
                      </ul>
                      <a
                        href="/guides/faster-whisper-setup"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        セットアップガイドを開く
                      </a>
                    </div>

                    {/* インストール確認 */}
                    <div className="bg-white border border-blue-300 rounded-lg p-3">
                      <p className="text-xs text-blue-900 font-semibold mb-2">
                        インストール確認コマンド
                      </p>
                      <p className="text-xs text-blue-800 mb-2">
                        以下のコマンドで faster-whisper がインストールされているか確認できます：
                      </p>
                      <div className="relative">
                        <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                          pip show faster-whisper
                        </div>
                        <button
                          onClick={handleCopyCheckCommand}
                          className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
                          title="コピー"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedCheckCommand ? '✓' : ''}
                        </button>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        ✓ インストール済みの場合：バージョン情報が表示されます<br />
                        ✗ 未インストールの場合：WARNING が表示されます
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 実行前の準備 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-yellow-900 mb-2">
                  ⚠️ 実行前の準備
                </p>
                <p className="text-xs text-yellow-800 mb-2">
                  <strong>VSCodeのターミナル</strong>で以下のコマンドを実行し、仮想環境を有効化してください：
                </p>
                <div className="relative mb-2">
                  <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                    cd ~<br />
                    source whisper-env/Scripts/activate
                  </div>
                  <button
                    onClick={handleCopyVenvCommand}
                    className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
                    title="コピー"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedVenvCommand ? '✓' : ''}
                  </button>
                </div>
                <p className="text-xs text-yellow-800">
                  ✓ プロンプトに <code className="bg-white px-1 py-0.5 rounded">(whisper-env)</code> が表示されればOK
                </p>
              </div>

              {/* パス入力 */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ダウンロードしたmp3ファイルのパスを貼り付け
                </label>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="例: C:\Users\YourName\Downloads\interview.mp3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                />
              </div>

              {/* 生成されたコマンド */}
              {generatedCommand && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    実行コマンド
                  </label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-nowrap">
                      {generatedCommand}
                    </code>
                    <button
                      onClick={handleCopyCommand}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                      title="コピー"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 出力先パス */}
              {outputPath && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-purple-900 font-medium mb-1">生成されるファイル:</p>
                  <code className="text-xs text-purple-800 font-mono">{outputPath}</code>
                </div>
              )}
            </section>
          )}

          {/* 内容整理ガイド（工程A-4など内容整理工程のみ表示） */}
          {process.processNo.endsWith('-4') && process.processName.includes('内容整理') && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                内容整理プロンプト生成
              </h3>

              {/* 文字起こしファイルパス入力 */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文字起こしファイルのパス
                </label>
                <input
                  type="text"
                  value={transcriptFilePath}
                  onChange={(e) => setTranscriptFilePath(e.target.value)}
                  placeholder="例: C:\Users\YourName\Downloads\interview.txt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A-3工程で生成された文字起こしテキストファイルのパスを入力してください
                </p>
              </div>

              {/* インタビュワー要望入力 */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  インタビュワーからの要望（任意）
                </label>
                <textarea
                  value={interviewerRequests}
                  onChange={(e) => setInterviewerRequests(e.target.value)}
                  placeholder={'例:\n・昔の中高時代の黒歴史のところはがっつり削って大丈夫。\n・高校生へのメッセージを強く聞く取材にしたし、本人もポイントをしっかり押さえてほしいとのことだった。'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  口頭やチャットで受け取った要望をそのまま貼り付けてください
                </p>
              </div>

              {/* 生成されたプロンプト */}
              {generatedPrompt && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      生成されたプロンプト
                    </label>
                    <button
                      onClick={handleCopyPrompt}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-xs font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedPrompt ? 'コピー済み ✓' : 'コピー'}
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                      {generatedPrompt}
                    </pre>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    💡 このプロンプトをコピーして、Claude Codeに貼り付けてください
                  </p>
                </div>
              )}

              {/* Googleドキュメント連携 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-blue-900">
                  Googleドキュメント作成・保存
                </h4>

                {/* ステップ1: 新規作成 */}
                <div>
                  <p className="text-xs text-blue-800 mb-2">
                    <strong>ステップ1:</strong> Googleドキュメントを新規作成
                  </p>
                  <button
                    onClick={handleCreateDocument}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <FileText className="w-4 h-4" />
                    Googleドキュメント新規作成
                  </button>
                </div>

                {/* ステップ2: リンク貼り付け */}
                <div>
                  <p className="text-xs text-blue-800 mb-2">
                    <strong>ステップ2:</strong> 作成したドキュメントのリンクを貼り付け
                  </p>
                  <input
                    type="text"
                    value={documentLink}
                    onChange={(e) => setDocumentLink(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                  />
                </div>

                {/* ステップ3: 保存 */}
                <div>
                  <p className="text-xs text-blue-800 mb-2">
                    <strong>ステップ3:</strong> 所定のフォルダに移動
                  </p>
                  <button
                    onClick={handleSaveDocument}
                    disabled={!documentLink.trim() || isSavingDocument}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FolderOpen className="w-4 h-4" />
                    {isSavingDocument ? '保存中...' : '保存してフォルダに移動'}
                  </button>
                </div>

                <p className="text-xs text-blue-700 bg-blue-100 rounded p-2">
                  💡 保存すると、カテゴリフォルダ/録音データ/月号/ に自動的に移動されます
                </p>
              </div>
            </section>
          )}

          {/* 人物概要作成ガイド（工程A-4など内容整理工程のみ表示） */}
          {process.processNo.endsWith('-4') && process.processName.includes('内容整理') && (
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600" />
                人物概要作成プロンプト生成
              </h3>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-3">
                <p className="text-xs text-purple-900 font-semibold mb-2">
                  📝 内容整理後の次のステップ
                </p>
                <p className="text-xs text-purple-800">
                  整理したインタビュー内容をもとに、レジェンド/STARページ用の人物概要（キャッチコピー・リード文・プロフィール）を作成します。
                </p>
              </div>

              {/* 整理済みインタビュー内容入力 */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  整理済みインタビュー内容
                </label>
                <textarea
                  value={organizedInterview}
                  onChange={(e) => setOrganizedInterview(e.target.value)}
                  placeholder={'内容整理プロンプトで生成した、Q./A. 形式のインタビュー内容をここに貼り付けてください。\n\n例：\nQ. これまでのキャリアのスタートを教えてください。\n\nA. 工業高校から専門学校を経てソニーに入社しました...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-y min-h-[150px] font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  上の「内容整理プロンプト生成」で作成した整理済みの内容を貼り付けてください
                </p>
              </div>

              {/* 生成されたプロンプト */}
              {generatedProfilePrompt && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      生成されたプロンプト
                    </label>
                    <button
                      onClick={handleCopyProfilePrompt}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 text-xs font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedProfilePrompt ? 'コピー済み ✓' : 'コピー'}
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                      {generatedProfilePrompt}
                    </pre>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    💡 このプロンプトをコピーして、Claude Codeに貼り付けてください
                  </p>
                </div>
              )}

              {/* 出力内容の説明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900 font-semibold mb-2">
                  📋 生成される内容
                </p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• キャッチコピー（20-30文字）</li>
                  <li>• リード文（240-260文字）</li>
                  <li>• プロフィール（190-210文字）</li>
                </ul>
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
