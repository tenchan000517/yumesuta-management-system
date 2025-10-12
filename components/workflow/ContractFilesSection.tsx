'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, ChevronDown, FileText, Image, Music, ExternalLink } from 'lucide-react';

interface ContractFilesSectionProps {
  contractId: number;
  companyId: number;
  companyName: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: string;
  webViewLink: string;
}

export function ContractFilesSection({
  contractId,
  companyId,
  companyName,
}: ContractFilesSectionProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [filesExpanded, setFilesExpanded] = useState(false);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル一覧取得
  useEffect(() => {
    const loadFiles = async () => {
      if (!contractId || !companyId) return;

      setLoading(true);
      try {
        const res = await fetch(
          `/api/contract/drive/list?contractId=${contractId}&companyId=${companyId}`
        );
        const data = await res.json();

        if (data.success) {
          setFiles(data.files || []);
          setDriveFolderUrl(data.driveFolderUrl || '');
        } else {
          console.error('ファイル一覧取得エラー:', data.error);
        }
      } catch (error) {
        console.error('ファイル一覧取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [contractId, companyId]);

  // ファイルアップロード処理
  const handleFileUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const file = selectedFiles[0]; // 1ファイルずつアップロード
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

  // ドラッグ&ドロップハンドラー
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">エビデンスファイル管理</h2>
      </div>

      {/* ファイル一覧 + プレビュー */}
      <div className="flex gap-4 mb-6">
        {/* 左側: ファイル一覧 */}
        <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-gray-50">
          {loading ? (
            <p className="text-sm text-gray-500 text-center">読込中...</p>
          ) : files.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">ファイルなし</p>
          ) : files.length <= 6 ? (
            <div className="space-y-1.5">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`block w-full text-left text-sm truncate px-2 py-1 rounded transition-colors ${
                    selectedFile?.id === file.id
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                  title={file.name}
                >
                  {file.name}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button
                onClick={() => setFilesExpanded(!filesExpanded)}
                className="w-full text-left text-sm text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${filesExpanded ? 'rotate-180' : ''}`} />
                {files.length}ファイル
              </button>

              {filesExpanded && (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className={`block w-full text-left text-sm truncate px-2 py-1 rounded transition-colors ${
                        selectedFile?.id === file.id
                          ? 'bg-blue-100 text-blue-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                      }`}
                      title={file.name}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右側: プレビュー */}
        {selectedFile && (
          <div className="w-80 border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center">
            <a
              href={selectedFile.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors group"
              title="Google Driveで開く"
            >
              {selectedFile.mimeType?.startsWith('image/') ? (
                <Image className="w-12 h-12 text-blue-500 group-hover:text-blue-600" />
              ) : selectedFile.mimeType?.startsWith('audio/') ? (
                <Music className="w-12 h-12 text-green-500 group-hover:text-green-600" />
              ) : selectedFile.mimeType === 'application/pdf' ? (
                <FileText className="w-12 h-12 text-red-500 group-hover:text-red-600" />
              ) : (
                <FileText className="w-12 h-12 text-gray-500 group-hover:text-gray-600" />
              )}

              <div className="text-xs text-center text-gray-600 group-hover:text-blue-600 break-all">
                {selectedFile.name}
              </div>

              <div className="text-xs text-gray-400 group-hover:text-blue-500">
                クリックで開く
              </div>
            </a>
          </div>
        )}
      </div>

      {/* ドラッグ&ドロップエリア */}
      <div
        className={`bg-blue-50 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-100' : 'border-blue-300'
        } ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        onDragEnter={isUploading ? undefined : handleDrag}
        onDragLeave={isUploading ? undefined : handleDrag}
        onDragOver={isUploading ? undefined : handleDrag}
        onDrop={isUploading ? undefined : handleDrop}
      >
        {isUploading ? (
          <>
            <div className="w-12 h-12 mx-auto mb-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-blue-700 font-semibold mb-2">アップロード中...</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <p className="text-gray-700 mb-2">
              <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold">
                ファイルを選択
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              {' '}または ドラッグ&ドロップ
            </p>
            <p className="text-sm text-gray-500">
              選択中: {companyName} / 契約{String(contractId).padStart(2, '0')}
            </p>
          </>
        )}
      </div>

      {/* Google Driveで開くボタン */}
      {driveFolderUrl && (
        <div className="mt-4">
          <a
            href={driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Google Driveでフォルダを開く
          </a>
        </div>
      )}
    </div>
  );
}
