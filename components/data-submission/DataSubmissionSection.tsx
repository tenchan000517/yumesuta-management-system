'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Upload, ChevronDown, ChevronUp, Music, FileText, Image, Folder, Building2, QrCode, User, Briefcase, Users, Package } from 'lucide-react';
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
  companyId?: string;
  name: string;
  companyName?: string; // 互換性のため
  status?: string;
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

// ヘルパー関数: データ種別からフォルダ名を取得
function getDataTypeFolderName(dataType: DataType): string {
  const map: Record<DataType, string> = {
    recording: '録音データ',
    photo: '写真データ',
    planning: '企画内容',
    content: '内容整理',
  };
  return map[dataType];
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
  const [selectedCompanyFolder, setSelectedCompanyFolder] = useState<CompanyFolderType>('ロゴ');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submissionData, setSubmissionData] = useState<Category[]>(categories);
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [overallProgress, setOverallProgress] = useState<{
    submitted: number;
    pending: number;
    none: number;
    total: number;
    progress: number;
  } | null>(null);

  // フォルダ内ファイル一覧
  const [folderFiles, setFolderFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesExpanded, setFilesExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  // 企業別フォルダ状況
  const [companyFolderStatus, setCompanyFolderStatus] = useState<any[]>([]);
  const [loadingCompanyStatus, setLoadingCompanyStatus] = useState(false);

  // 月号変更時にデータ提出状況を取得（デバウンス付き）
  useEffect(() => {
    // ローディング中は重複リクエストを防止
    if (loadingSubmission) return;

    const timer = setTimeout(() => {
      const fetchSubmissionStatus = async () => {
        setLoadingSubmission(true);
        try {
          // データ提出状況API呼び出し
          const statusResponse = await fetch(
            `/api/yumemaga-v2/data-submission/status?issue=${encodeURIComponent(selectedIssue)}`
          );
          const statusResult = await statusResponse.json();

          if (statusResult.success) {
            setSubmissionData(statusResult.categories);
            // 全体進捗を更新
            setOverallProgress(statusResult.summary);
          } else {
            console.error('Failed to fetch submission status:', statusResult.error);
            // エラー時は既存データを使用
            setSubmissionData(categories);
          }
        } catch (error) {
          console.error('Failed to fetch submission status:', error);
          // エラー時は既存データを使用
          setSubmissionData(categories);
        } finally {
          setLoadingSubmission(false);
        }
      };

      fetchSubmissionStatus();
    }, 500); // 500msデバウンス

    return () => clearTimeout(timer);
  }, [selectedIssue]); // categoriesを削除: APIが自身でカテゴリマスターを取得するため不要

  // 選択されたフォルダのファイル一覧を取得（デバウンス付き）
  useEffect(() => {
    // ローディング中は重複リクエストを防止
    if (loadingFiles) return;

    const timer = setTimeout(() => {
      const fetchFolderFiles = async () => {
        // カテゴリモードの場合
        if (uploadMode === 'category') {
          if (!selectedCategory || !selectedDataType || !selectedIssue) {
            setFolderFiles([]);
            setSelectedFile(null);
            return;
          }

          setLoadingFiles(true);
          setSelectedFile(null);
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
        }
        // 企業モードの場合
        else if (uploadMode === 'company') {
          const companyName = companyMode === 'existing' ? selectedCompany : newCompanyName;
          if (!companyName || !selectedCompanyFolder) {
            setFolderFiles([]);
            setSelectedFile(null);
            return;
          }

          setLoadingFiles(true);
          setSelectedFile(null);
          try {
            const response = await fetch(
              `/api/yumemaga-v2/data-submission/list-files?companyName=${encodeURIComponent(companyName)}&folderType=${encodeURIComponent(selectedCompanyFolder)}`
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
        } else {
          setFolderFiles([]);
          setSelectedFile(null);
        }
      };

      fetchFolderFiles();
    }, 800); // 800msデバウンス（ファイル取得は若干長めに）

    return () => clearTimeout(timer);
  }, [uploadMode, selectedCategory, selectedDataType, selectedIssue, companyMode, selectedCompany, newCompanyName, selectedCompanyFolder]);

  // 企業別モード時: 選択企業の全フォルダ状況を取得
  useEffect(() => {
    const fetchCompanyFolderStatus = async () => {
      if (uploadMode !== 'company' || companyMode !== 'existing' || !selectedCompany) {
        setCompanyFolderStatus([]);
        return;
      }

      setLoadingCompanyStatus(true);
      try {
        const FOLDER_TYPES: CompanyFolderType[] = [
          'ロゴ', 'ヒーロー画像', 'QRコード', '代表者写真',
          'サービス画像', '社員写真', '情報シート', 'その他'
        ];

        // 8フォルダ全てのファイル数を並列取得
        const statusPromises = FOLDER_TYPES.map(async (folderType) => {
          try {
            const response = await fetch(
              `/api/yumemaga-v2/data-submission/list-files?companyName=${encodeURIComponent(selectedCompany)}&folderType=${encodeURIComponent(folderType)}`
            );
            const data = await response.json();

            return {
              folderType,
              fileCount: data.success ? (data.files || []).length : 0,
              hasFiles: data.success && (data.files || []).length > 0,
            };
          } catch (error) {
            console.error(`フォルダ ${folderType} の取得エラー:`, error);
            return {
              folderType,
              fileCount: 0,
              hasFiles: false,
            };
          }
        });

        const statuses = await Promise.all(statusPromises);
        setCompanyFolderStatus(statuses);
      } catch (error) {
        console.error('企業フォルダ状況取得エラー:', error);
        setCompanyFolderStatus([]);
      } finally {
        setLoadingCompanyStatus(false);
      }
    };

    fetchCompanyFolderStatus();
  }, [uploadMode, companyMode, selectedCompany]);

  // フォールバック用の進捗計算（overallProgressがnullの場合）
  const computedProgress = useMemo(() => {
    const allData = submissionData.flatMap(c => c.requiredData);
    const submitted = allData.filter(d => d.status === 'submitted').length;
    const pending = allData.filter(d => d.status === 'pending').length;
    const none = allData.filter(d => d.status === 'none').length;
    const total = allData.length;
    const progress = total > 0 ? Math.round((submitted / total) * 100) : 0;

    return { progress, submitted, pending, none, total };
  }, [submissionData]);

  // 実際に表示する進捗（APIからの値 or 計算値）
  const displayProgress = overallProgress || computedProgress;

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
        formData.append('companyFolder', selectedCompanyFolder);
      }

      // API呼び出し
      const response = await fetch('/api/yumemaga-v2/data-submission/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert(`アップロード成功: ${result.uploadedFiles.length}件のファイルがアップロードされました`);

        // 工程完了API呼び出し（カテゴリモードのみ）
        if (uploadMode === 'category' && selectedCategory && selectedDataType) {
          try {
            const completeRes = await fetch('/api/yumemaga-v2/data-submission/complete-process', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                issue: selectedIssue,
                categoryId: selectedCategory,
                dataType: selectedDataType,
              }),
            });
            const completeData = await completeRes.json();

            if (completeData.success && completeData.completedProcesses.length > 0) {
              alert(`✅ ${completeData.message}\n工程が自動完了しました`);
            }
          } catch (error) {
            console.error('工程完了API呼び出しエラー:', error);
            // エラーでもアップロード自体は成功しているのでアラート不要
          }
        }

        // 工程完了API呼び出し（企業モード追加）
        if (uploadMode === 'company' && companyMode === 'existing' && selectedCompany && selectedCompanyFolder) {
          try {
            // 企業IDを取得
            const company = companies.find(c => (c.companyName || c.name) === selectedCompany);
            const companyId = company?.companyId;

            if (companyId) {
              const completeRes = await fetch('/api/yumemaga-v2/data-submission/complete-process', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  issue: selectedIssue,
                  companyId: companyId,
                  companyFolderType: selectedCompanyFolder,
                }),
              });
              const completeData = await completeRes.json();

              if (completeData.success && completeData.completedProcesses.length > 0) {
                alert(`✅ ${completeData.message}\n工程が自動完了しました`);
              }
            }
          } catch (error) {
            console.error('工程完了API呼び出しエラー:', error);
          }
        }

        // データ提出状況を再取得してUIを更新
        if (uploadMode === 'category') {
          const statusResponse = await fetch(
            `/api/yumemaga-v2/data-submission/status?issue=${encodeURIComponent(selectedIssue)}`
          );
          const statusResult = await statusResponse.json();
          if (statusResult.success) {
            setSubmissionData(statusResult.categories);
            setOverallProgress(statusResult.summary);
          }
        }
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
              style={{ width: `${displayProgress.progress}%` }}
            />
          </div>
          <span className="font-bold text-lg whitespace-nowrap">
            {displayProgress.submitted}/{displayProgress.total} ({displayProgress.progress}%)
          </span>
        </div>

        {/* 内訳 */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">
              提出済み: <span className="font-semibold text-gray-900">{displayProgress.submitted}件</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600">
              未提出: <span className="font-semibold text-gray-900">{displayProgress.pending}件</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="text-gray-600">
              任意未提出: <span className="font-semibold text-gray-900">{displayProgress.none}件</span>
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

          {/* 企業モード時の選択UI */}
          {uploadMode === 'company' && (
            <>
              {/* 既存/新規ラジオボタン */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="existing"
                  checked={companyMode === 'existing'}
                  onChange={(e) => setCompanyMode(e.target.value as CompanyMode)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">既存</span>
              </label>

              {/* 企業選択ドロップダウン or 企業名入力欄 */}
              {companyMode === 'existing' ? (
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                  placeholder="企業名を入力"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                />
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="new"
                  checked={companyMode === 'new'}
                  onChange={(e) => setCompanyMode(e.target.value as CompanyMode)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">新規</span>
              </label>
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
                if (name.includes('内容整理') || name.includes('原稿')) return 'content';
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
                      const FolderIcon =
                        dataType === 'recording' ? Music :
                        dataType === 'photo' ? Image :
                        dataType === 'content' ? FileText :
                        FileText;

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

        {/* 企業モード - フォルダアイコングリッド */}
        {uploadMode === 'company' && (
          <div className="mb-4">
            {/* フォルダグリッドとプレビューを横並び */}
            <div className="flex gap-4">
              {/* 左側: フォルダグリッド（8個） */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 1. ロゴ */}
              <button
                onClick={() => setSelectedCompanyFolder('ロゴ')}
                className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedCompanyFolder === 'ロゴ'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <Folder className={`w-16 h-16 mb-2 ${selectedCompanyFolder === 'ロゴ' ? 'text-blue-500' : 'text-gray-400'}`} />
                <Building2 className={`w-6 h-6 mb-2 ${selectedCompanyFolder === 'ロゴ' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-sm text-center font-medium ${selectedCompanyFolder === 'ロゴ' ? 'text-blue-900' : 'text-gray-700'}`}>
                  ロゴ
                </span>
                {selectedCompanyFolder === 'ロゴ' && (
                  <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </button>

              {/* 2. ヒーロー画像 */}
              <button
                onClick={() => setSelectedCompanyFolder('ヒーロー画像')}
                className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedCompanyFolder === 'ヒーロー画像'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <Folder className={`w-16 h-16 mb-2 ${selectedCompanyFolder === 'ヒーロー画像' ? 'text-blue-500' : 'text-gray-400'}`} />
                <Image className={`w-6 h-6 mb-2 ${selectedCompanyFolder === 'ヒーロー画像' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-sm text-center font-medium ${selectedCompanyFolder === 'ヒーロー画像' ? 'text-blue-900' : 'text-gray-700'}`}>
                  ヒーロー画像
                </span>
                {selectedCompanyFolder === 'ヒーロー画像' && (
                  <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </button>

              {/* 3. QRコード */}
              <button
                onClick={() => setSelectedCompanyFolder('QRコード')}
                className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedCompanyFolder === 'QRコード'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <Folder className={`w-16 h-16 mb-2 ${selectedCompanyFolder === 'QRコード' ? 'text-blue-500' : 'text-gray-400'}`} />
                <QrCode className={`w-6 h-6 mb-2 ${selectedCompanyFolder === 'QRコード' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-sm text-center font-medium ${selectedCompanyFolder === 'QRコード' ? 'text-blue-900' : 'text-gray-700'}`}>
                  QRコード
                </span>
                {selectedCompanyFolder === 'QRコード' && (
                  <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </button>

              {/* 4. 代表者写真 */}
              <button
                onClick={() => setSelectedCompanyFolder('代表者写真')}
                className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedCompanyFolder === '代表者写真'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <Folder className={`w-16 h-16 mb-2 ${selectedCompanyFolder === '代表者写真' ? 'text-blue-500' : 'text-gray-400'}`} />
                <User className={`w-6 h-6 mb-2 ${selectedCompanyFolder === '代表者写真' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-sm text-center font-medium ${selectedCompanyFolder === '代表者写真' ? 'text-blue-900' : 'text-gray-700'}`}>
                  代表者写真
                </span>
                {selectedCompanyFolder === '代表者写真' && (
                  <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </button>

              {/* 5. サービス画像 */}
              <button
                onClick={() => setSelectedCompanyFolder('サービス画像')}
                className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedCompanyFolder === 'サービス画像'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <Folder className={`w-16 h-16 mb-2 ${selectedCompanyFolder === 'サービス画像' ? 'text-blue-500' : 'text-gray-400'}`} />
                <Briefcase className={`w-6 h-6 mb-2 ${selectedCompanyFolder === 'サービス画像' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-sm text-center font-medium ${selectedCompanyFolder === 'サービス画像' ? 'text-blue-900' : 'text-gray-700'}`}>
                  サービス画像
                </span>
                {selectedCompanyFolder === 'サービス画像' && (
                  <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </button>

              {/* 6. 社員写真 */}
              <button
                onClick={() => setSelectedCompanyFolder('社員写真')}
                className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedCompanyFolder === '社員写真'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <Folder className={`w-16 h-16 mb-2 ${selectedCompanyFolder === '社員写真' ? 'text-blue-500' : 'text-gray-400'}`} />
                <Users className={`w-6 h-6 mb-2 ${selectedCompanyFolder === '社員写真' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-sm text-center font-medium ${selectedCompanyFolder === '社員写真' ? 'text-blue-900' : 'text-gray-700'}`}>
                  社員写真
                </span>
                {selectedCompanyFolder === '社員写真' && (
                  <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </button>

              {/* 7. 情報シート */}
              <button
                onClick={() => setSelectedCompanyFolder('情報シート')}
                className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedCompanyFolder === '情報シート'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <Folder className={`w-16 h-16 mb-2 ${selectedCompanyFolder === '情報シート' ? 'text-blue-500' : 'text-gray-400'}`} />
                <FileText className={`w-6 h-6 mb-2 ${selectedCompanyFolder === '情報シート' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-sm text-center font-medium ${selectedCompanyFolder === '情報シート' ? 'text-blue-900' : 'text-gray-700'}`}>
                  情報シート
                </span>
                {selectedCompanyFolder === '情報シート' && (
                  <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </button>

              {/* 8. その他 */}
              <button
                onClick={() => setSelectedCompanyFolder('その他')}
                className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                  selectedCompanyFolder === 'その他'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <Folder className={`w-16 h-16 mb-2 ${selectedCompanyFolder === 'その他' ? 'text-blue-500' : 'text-gray-400'}`} />
                <Package className={`w-6 h-6 mb-2 ${selectedCompanyFolder === 'その他' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-sm text-center font-medium ${selectedCompanyFolder === 'その他' ? 'text-blue-900' : 'text-gray-700'}`}>
                  その他
                </span>
                {selectedCompanyFolder === 'その他' && (
                  <div className="absolute top-3 right-3 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                )}
              </button>

              </div>

              {/* 右側: ファイル一覧＋プレビュー */}
              <div className="w-full md:flex-1 border border-gray-200 rounded-lg p-4 bg-gray-50 flex gap-3">
                {/* 左側: ファイル一覧 */}
                <div className="flex-1">
                  {loadingFiles ? (
                    <div className="text-sm text-gray-500">読込中...</div>
                  ) : folderFiles.length > 0 ? (
                    <div>
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
                  <div className="w-80 border-l border-gray-300 pl-3 flex flex-col">
                    <a
                      href={selectedFile.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex flex-col items-center justify-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors group"
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
            </div>

            {/* 選択中の情報を表示 */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">選択中:</span>{' '}
                {companyMode === 'existing' ? selectedCompany : newCompanyName || '（企業名未入力）'} / {selectedCompanyFolder}
              </p>
            </div>
          </div>
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
                  : `企業: ${companyMode === 'existing' ? selectedCompany : newCompanyName || '（未入力）'} / ${selectedCompanyFolder}`
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

      {/* カテゴリ別・企業別データ提出状況（折りたたみ可能） */}
      {showCards && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* カテゴリ別モード */}
          {uploadMode === 'category' && loadingSubmission && (
            <div className="col-span-full text-center py-8 text-gray-500">
              {selectedIssue} のデータ提出状況を読み込み中...
            </div>
          )}

          {uploadMode === 'category' && !loadingSubmission && (
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

          {/* 企業別モード */}
          {uploadMode === 'company' && loadingCompanyStatus && (
            <div className="col-span-full text-center py-8 text-gray-500">
              {selectedCompany} のフォルダ状況を読み込み中...
            </div>
          )}

          {uploadMode === 'company' && !loadingCompanyStatus && companyMode === 'existing' && selectedCompany && companyFolderStatus.length > 0 && (
            companyFolderStatus.map((folder) => {
              const getFolderIcon = (folderType: string) => {
                switch (folderType) {
                  case 'ロゴ': return <Building2 className="w-4 h-4" />;
                  case 'ヒーロー画像': return <Image className="w-4 h-4" />;
                  case 'QRコード': return <QrCode className="w-4 h-4" />;
                  case '代表者写真': return <User className="w-4 h-4" />;
                  case 'サービス画像': return <Briefcase className="w-4 h-4" />;
                  case '社員写真': return <Users className="w-4 h-4" />;
                  case '情報シート': return <FileText className="w-4 h-4" />;
                  case 'その他': return <Package className="w-4 h-4" />;
                  default: return <Folder className="w-4 h-4" />;
                }
              };

              return (
                <div
                  key={folder.folderType}
                  className={`border rounded-lg overflow-hidden ${
                    folder.hasFiles
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* フォルダヘッダー */}
                  <div
                    className={`p-4 border-b ${
                      folder.hasFiles
                        ? 'bg-green-100 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getFolderIcon(folder.folderType)}
                      <h3 className="font-bold text-gray-900">
                        {folder.folderType}
                      </h3>
                    </div>
                    <p
                      className={`text-sm ${
                        folder.hasFiles
                          ? 'text-green-700 font-semibold'
                          : 'text-gray-600'
                      }`}
                    >
                      {folder.hasFiles ? `${folder.fileCount}件提出済み` : 'ファイルなし'}
                    </p>
                  </div>

                  {/* ファイル数詳細 */}
                  <div className="p-4">
                    {folder.hasFiles ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                          提出済み
                        </span>
                        <span className="text-sm text-gray-600">
                          {folder.fileCount}ファイル
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                        未提出
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* 企業別モード: データなしの場合 */}
          {uploadMode === 'company' && !loadingCompanyStatus && companyMode === 'existing' && selectedCompany && companyFolderStatus.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              フォルダ情報を取得できませんでした
            </div>
          )}

          {/* 企業別モード: 新規企業の場合 */}
          {uploadMode === 'company' && companyMode === 'new' && (
            <div className="col-span-full text-center py-8 text-gray-500">
              新規企業のフォルダ状況は、企業登録後に表示されます
            </div>
          )}
        </div>
      )}
    </div>
  );
}
