'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Upload, ChevronDown, ChevronUp, Music, FileText, Image, Building2 } from 'lucide-react';
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
  const [selectedIssue, setSelectedIssue] = useState(defaultIssue); // セクション独立の月号選択
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Upload className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">データ提出進捗管理</h2>
        </div>

        {/* セクション独立の月号選択 */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">対象月号:</label>
          <select
            value={selectedIssue}
            onChange={(e) => setSelectedIssue(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            {availableIssues.map((option) => (
              <option key={option.issue} value={option.issue}>
                {option.issue}{option.isNew ? ' (新)' : ''}
              </option>
            ))}
          </select>
        </div>
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
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            アップロードモード
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMode"
                value="category"
                checked={uploadMode === 'category'}
                onChange={(e) => setUploadMode(e.target.value as UploadMode)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">カテゴリ系（録音・写真・企画）</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMode"
                value="company"
                checked={uploadMode === 'company'}
                onChange={(e) => setUploadMode(e.target.value as UploadMode)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">企業系（ロゴ・写真等）</span>
            </label>
          </div>
        </div>

        {/* カテゴリモード */}
        {uploadMode === 'category' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                カテゴリを選択
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}: {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                データ種別を選択
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dataType"
                    value="recording"
                    checked={selectedDataType === 'recording'}
                    onChange={(e) => setSelectedDataType(e.target.value as DataType)}
                    className="w-4 h-4"
                  />
                  <Music className="w-4 h-4" />
                  <span className="text-gray-700">録音データ (.mp3, .wav等)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dataType"
                    value="photo"
                    checked={selectedDataType === 'photo'}
                    onChange={(e) => setSelectedDataType(e.target.value as DataType)}
                    className="w-4 h-4"
                  />
                  <Image className="w-4 h-4" />
                  <span className="text-gray-700">写真データ (.jpg, .png等)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dataType"
                    value="planning"
                    checked={selectedDataType === 'planning'}
                    onChange={(e) => setSelectedDataType(e.target.value as DataType)}
                    className="w-4 h-4"
                  />
                  <FileText className="w-4 h-4" />
                  <span className="text-gray-700">企画内容 (.docx, .pdf等)</span>
                </label>
              </div>
            </div>
          </>
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
