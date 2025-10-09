'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Upload, ChevronDown, ChevronUp, Music, FileText, Image, Folder } from 'lucide-react';
import type { DataType, UploadMode, CompanyMode, CompanyFolderType } from '@/types/data-submission';

interface RequiredData {
  type: string;
  name: string;
  status: string;
  deadline: string;
  optional?: boolean;
}

interface Category {
  id: string;
  name: string;
  requiredData: RequiredData[];
  deadline?: string;
}

interface Company {
  name: string;
}

interface IssueOption {
  issue: string;
  isNew: boolean;
}

interface DataSubmissionSectionProps {
  categories: Category[];
  companies: Company[];
  availableIssues: IssueOption[]; // 利用可能な月号一覧
  defaultIssue: string; // デフォルトの月号（ページ全体の選択月号）
}

export function DataSubmissionSection({
  categories,
  companies,
  availableIssues,
  defaultIssue,
}: DataSubmissionSectionProps) {
  const [showCards, setShowCards] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('category');
  const [selectedIssue, setSelectedIssue] = useState(defaultIssue); // アップロード先の月号
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 'A');
  const [selectedDataType, setSelectedDataType] = useState<DataType>('recording');
  const [companyMode, setCompanyMode] = useState<CompanyMode>('existing');
  const [selectedCompany, setSelectedCompany] = useState(companies[0]?.name || '');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [companyFolder, setCompanyFolder] = useState<CompanyFolderType>('メイン');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submissionData, setSubmissionData] = useState<Category[]>(categories);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  // フォルダ内ファイル一覧
  const [folderFiles, setFolderFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesExpanded, setFilesExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  // 月号変更時にデータ提出状況を取得
  useEffect(() => {
    const fetchSubmissionStatus = async () => {
      setLoadingSubmission(true);
      try {
        // TODO: Phase 8.3で実装予定
        // const response = await fetch(`/api/yumemaga-v2/data-submission?issue=${encodeURIComponent(selectedIssue)}`);
        // const result = await response.json();
        // if (result.success) {
        //   setSubmissionData(result.categories);
        // }

        // 暫定: 既存のカテゴリデータを使用
        setSubmissionData(categories);
      } catch (error) {
        console.error('Failed to fetch submission status:', error);
      } finally {
        setLoadingSubmission(false);
      }
    };

    fetchSubmissionStatus();
  }, [selectedIssue, categories]);

  // 選択されたフォルダのファイル一覧を取得
  useEffect(() => {
    const fetchFolderFiles = async () => {
      if (uploadMode !== 'category' || !selectedCategory || !selectedDataType || !selectedIssue) {
        setFolderFiles([]);
        setSelectedFile(null); // プレビューをクリア
        return;
      }

      setLoadingFiles(true);
      setSelectedFile(null); // フォルダ変更時にプレビューをクリア
      try {
        // 月号フォーマット変換: "2025年11月号" → "2025_11"
        const issueFormatted = selectedIssue.replace(/(\d{4})年(\d{1,2})月号/, (_, year, month) => {
          const paddedMonth = month.padStart(2, '0');
          return `${year}_${paddedMonth}`;
        });

        const response = await fetch(
          `/api/yumemaga-v2/data-submission/list-files?categoryId=${selectedCategory}&dataType=${selectedDataType}&issue=${issueFormatted}`
        );
        const data = await response.json();

        if (data.success) {
          setFolderFiles(data.files || []);
        } else {
          console.error('Failed to fetch folder files:', data.error);
          setFolderFiles([]);
        }
      } catch (error) {
        console.error('Error fetching folder files:', error);
        setFolderFiles([]);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchFolderFiles();
  }, [uploadMode, selectedCategory, selectedDataType, selectedIssue]);

  // 全体進捗を計算（submissionDataを使用）
  const overallProgress = useMemo(() => {
    const allData = submissionData.flatMap(c => c.requiredData);
    const submitted = allData.filter(d => d.status === 'submitted').length;
    const pending = allData.filter(d => d.status === 'pending').length;
    const none = allData.filter(d => d.status === 'none').length;
    const total = allData.length;
    const progress = total > 0 ? Math.round((submitted / total) * 100) : 0;

    return { progress, submitted, pending, none, total };
  }, [submissionData]);

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'audio':
      case 'recording':
        return <Music className="w-4 h-4" />;
      case 'document':
      case 'planning':
        return <FileText className="w-4 h-4" />;
      case 'image':
      case 'photo':
        return <Image className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // ファイルアップロード処理
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('mode', uploadMode);

      // ファイル追加
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      if (uploadMode === 'category') {
        // カテゴリモード
        formData.append('categoryId', selectedCategory);
        formData.append('dataType', selectedDataType);

        // 月号を "2025_11" 形式に変換
        const issue = selectedIssue.replace('年', '_').replace('月号', '');
        formData.append('issue', issue);

      } else {
        // 企業モード
        formData.append('companyMode', companyMode);
        formData.append('companyName', companyMode === 'existing' ? selectedCompany : newCompanyName);
        formData.append('companyFolder', companyFolder);
      }

      // API呼び出し
      const response = await fetch('/api/yumemaga-v2/data-submission/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(`アップロード成功: ${result.uploadedFiles.length}件のファイルがアップロードされました`);
        // TODO: データ提出状況を再取得してUIを更新
      } else {
        alert(`アップロード失敗: ${result.error}`);
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`アップロードエラー: ${error.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ファイル選択ハンドラー
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
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
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">データ提出進捗管理</h2>
      </div>

      {/* 全体進捗（常に表示） */}
      <div className="mb-6">
        {/* プログレスバー */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress.progress}%` }}
            />
          </div>
          <span className="font-bold text-lg whitespace-nowrap">
            {overallProgress.submitted}/{overallProgress.total} ({overallProgress.progress}%)
          </span>
        </div>

        {/* 内訳 */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">
              提出済み: <span className="font-semibold text-gray-900">{overallProgress.submitted}件</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600">
              未提出: <span className="font-semibold text-gray-900">{overallProgress.pending}件</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="text-gray-600">
              任意未提出: <span className="font-semibold text-gray-900">{overallProgress.none}件</span>
            </span>
          </div>
        </div>
      </div>

      {/* アップロードモード選択 */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        {/* タブ＆選択UI（1行） */}
        <div className="flex items-center gap-4 mb-6">
          {/* モード選択タブ */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setUploadMode('category')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                uploadMode === 'category'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              カテゴリ別
            </button>
            <button
              onClick={() => setUploadMode('company')}
              className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                uploadMode === 'company'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              企業別
            </button>
          </div>

          {/* カテゴリモード時の選択UI */}
          {uploadMode === 'category' && (
            <>
              {/* カテゴリ選択 */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {categories
                  .filter(category => category.requiredData && category.requiredData.length > 0)
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.id}: {category.name}
                    </option>
                  ))}
              </select>

              {/* 月号選択 */}
              <select
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {availableIssues.map((option) => (
                  <option key={option.issue} value={option.issue}>
                    {option.issue}{option.isNew ? ' (新)' : ''}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* カテゴリモード - フォルダアイコングリッド */}
        {uploadMode === 'category' && (
          <div className="mb-4">

            {/* ステップ2: データ種別フォルダ選択 */}
            {selectedCategory && (() => {
              const category = categories.find(c => c.id === selectedCategory);
              if (!category) return null;

              // カテゴリの必要データから利用可能なデータ種別を取得
              const availableDataTypes = category.requiredData.map(rd => {
                const name = (rd?.name || rd?.type || '').toString();
                if (name.includes('録音') || name.includes('音声')) return 'recording';
                if (name.includes('写真') || name.includes('画像')) return 'photo';
                if (name.includes('企画') || name.includes('資料')) return 'planning';
                return null;
              }).filter((dt): dt is DataType => dt !== null);

              const uniqueDataTypes = Array.from(new Set(availableDataTypes));
              const dataTypesToShow = uniqueDataTypes.length > 0
                ? uniqueDataTypes
                : ['recording', 'photo', 'planning'] as DataType[];

              return (
                <div className="grid grid-cols-4 gap-4">
                    {/* フォルダアイコン（3カラム） */}
                    {dataTypesToShow.map((dataType) => {
                      const isSelected = selectedDataType === dataType;
                      const folderName = getDataTypeFolderName(dataType);
                      const FolderIcon = dataType === 'recording' ? Music : dataType === 'photo' ? Image : FileText;

                      return (
                        <button
                          key={dataType}
                          onClick={() => setSelectedDataType(dataType)}
                          className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <Folder className={`w-16 h-16 mb-2 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                          <FolderIcon className={`w-6 h-6 mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                          <span className={`text-sm text-center font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                            {folderName}
                          </span>

                          {/* 選択中インジケーター */}
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                          )}
                        </button>
                      );
                    })}

                    {/* 4カラム目: ファイルプレビュー */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex gap-3">
                      {/* 左側: ファイル一覧 */}
                      <div className="flex-1">
                        {loadingFiles ? (
                          <div className="text-sm text-gray-500">読込中...</div>
                        ) : folderFiles.length > 0 ? (
                          <div>
                            {/* ファイルが6件以下の場合はそのまま表示 */}
                            {folderFiles.length <= 6 ? (
                              <div className="space-y-1.5">
                                {folderFiles.map((file) => (
                                  <button
                                    key={file.id}
                                    onClick={() => setSelectedFile(file)}
                                    className={`block w-full text-left text-sm truncate px-2 py-1 rounded transition-colors ${
                                      selectedFile?.id === file.id
                                        ? 'bg-blue-100 text-blue-900 font-medium'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                    }`}
                                    title={`${file.name}\n更新: ${new Date(file.modifiedTime).toLocaleString('ja-JP')}`}
                                  >
                                    {file.name}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              /* ファイルが7件以上の場合は折りたたみ表示 */
                              <div>
                                <button
                                  onClick={() => setFilesExpanded(!filesExpanded)}
                                  className="w-full text-left text-sm text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
                                >
                                  <ChevronDown className={`w-4 h-4 transition-transform ${filesExpanded ? 'rotate-180' : ''}`} />
                                  {folderFiles.length}ファイル
                                </button>

                                {filesExpanded && (
                                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                    {folderFiles.map((file) => (
                                      <button
                                        key={file.id}
                                        onClick={() => setSelectedFile(file)}
                                        className={`block w-full text-left text-sm truncate px-2 py-1 rounded transition-colors ${
                                          selectedFile?.id === file.id
                                            ? 'bg-blue-100 text-blue-900 font-medium'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                        }`}
                                        title={`${file.name}\n更新: ${new Date(file.modifiedTime).toLocaleString('ja-JP')}`}
                                      >
                                        {file.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center">ファイルなし</p>
                        )}
                      </div>

                      {/* 右側: プレビューエリア */}
                      {selectedFile && (
                        <div className="w-40 border-l border-gray-300 pl-3 flex flex-col">
                          <a
                            href={selectedFile.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex flex-col items-center justify-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors group"
                            title="Google Driveで開く"
                          >
                            {/* ファイルタイプ別アイコン */}
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
                </div>
              );
            })()}

            {/* 選択中の情報を表示 */}
            {selectedCategory && selectedDataType && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">選択中:</span>{' '}
                  {categories.find(c => c.id === selectedCategory)?.name} / {getDataTypeFolderName(selectedDataType)} / {selectedIssue}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 企業モード */}
        {uploadMode === 'company' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                企業選択
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="companyMode"
                    value="existing"
                    checked={companyMode === 'existing'}
                    onChange={(e) => setCompanyMode(e.target.value as CompanyMode)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">既存企業から選択</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="companyMode"
                    value="new"
                    checked={companyMode === 'new'}
                    onChange={(e) => setCompanyMode(e.target.value as CompanyMode)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">新規企業を追加</span>
                </label>
              </div>

              {companyMode === 'existing' ? (
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {companies.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="新規企業名を入力"
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                保存先フォルダ
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="companyFolder"
                    value="メイン"
                    checked={companyFolder === 'メイン'}
                    onChange={(e) => setCompanyFolder(e.target.value as CompanyFolderType)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">メイン（ロゴ・ヒーロー・QR等）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="companyFolder"
                    value="サブ"
                    checked={companyFolder === 'サブ'}
                    onChange={(e) => setCompanyFolder(e.target.value as CompanyFolderType)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">サブ（その他素材）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="companyFolder"
                    value="情報シート"
                    checked={companyFolder === '情報シート'}
                    onChange={(e) => setCompanyFolder(e.target.value as CompanyFolderType)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">情報シート</span>
                </label>
              </div>
            </div>
          </>
        )}

        {/* ドラッグ&ドロップエリア */}
        <div
          className={`bg-blue-50 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-100' : 'border-blue-300'
          } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
          onDragEnter={uploading ? undefined : handleDrag}
          onDragLeave={uploading ? undefined : handleDrag}
          onDragOver={uploading ? undefined : handleDrag}
          onDrop={uploading ? undefined : handleDrop}
        >
          {uploading ? (
            <>
              <div className="w-12 h-12 mx-auto mb-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-blue-700 font-semibold mb-2">アップロード中...</p>
              <p className="text-sm text-gray-600">
                ファイルをGoogle Driveにアップロードしています
              </p>
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
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {' '}または ドラッグ&ドロップ
              </p>
              <p className="text-sm text-gray-500">
                {uploadMode === 'category'
                  ? `${selectedIssue} / ${categories.find(c => c.id === selectedCategory)?.name} / ${getDataTypeFolderName(selectedDataType)}`
                  : `企業: ${companyMode === 'existing' ? selectedCompany : newCompanyName || '（未入力）'} / ${companyFolder}`
                }
              </p>
            </>
          )}
        </div>
      </div>

      {/* 折りたたみボタン */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setShowCards(!showCards)}
          className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
        >
          {showCards ? (
            <>
              <ChevronUp className="w-5 h-5" />
              カテゴリ詳細を閉じる
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              カテゴリ詳細を開く
            </>
          )}
        </button>
      </div>

      {/* カテゴリ別データ提出状況（折りたたみ可能） */}
      {showCards && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {loadingSubmission ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              {selectedIssue} のデータ提出状況を読み込み中...
            </div>
          ) : (
            submissionData.filter(c => c.requiredData.length > 0).map((category) => {
            const hasDeadlinePassed = category.requiredData.some(
              (data) => data.status === 'pending' && !data.optional
            );
            const allSubmitted = category.requiredData.every(
              (data) => data.status === 'submitted' || data.optional
            );

            return (
              <div
                key={category.id}
                className={`border rounded-lg overflow-hidden ${
                  hasDeadlinePassed
                    ? 'border-red-300 bg-red-50'
                    : allSubmitted
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* カテゴリヘッダー */}
                <div
                  className={`p-4 border-b ${
                    hasDeadlinePassed
                      ? 'bg-red-100 border-red-200'
                      : allSubmitted
                      ? 'bg-green-100 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <h3 className="font-bold text-gray-900">
                    {category.name}
                  </h3>
                  {category.deadline && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      締切: {category.deadline}
                    </p>
                  )}
                  <p
                    className={`text-sm mt-1 ${
                      hasDeadlinePassed
                        ? 'text-red-700 font-semibold'
                        : allSubmitted
                        ? 'text-green-700 font-semibold'
                        : 'text-gray-600'
                    }`}
                  >
                    {hasDeadlinePassed ? '期限超過あり' : allSubmitted ? '完了' : '進行中'}
                  </p>
                </div>

                {/* データ一覧 */}
                <div className="p-4 space-y-2">
                  {category.requiredData.map((data, index) => {
                    return (
                      <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {getDataTypeIcon(data.type)}
                            <p className="font-semibold text-sm text-gray-900">{data.name}</p>
                          </div>
                          <p className="text-xs text-gray-500">〆切: {data.deadline}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {data.status === 'submitted' ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                              提出済み
                            </span>
                          ) : data.status === 'pending' ? (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-semibold">
                              未提出
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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
          )}
        </div>
      )}
    </div>
  );
}

// ヘルパー関数
function getDataTypeFolderName(dataType: DataType): string {
  const map: Record<DataType, string> = {
    recording: '録音データ',
    photo: '写真データ',
    planning: '企画内容',
  };
  return map[dataType];
}
