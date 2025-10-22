'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  FileText,
  Trash2,
  Building2,
} from 'lucide-react';
import { NextMonthPrepSection } from '@/components/next-month/NextMonthPrepSection';
import { CategoryManagementSection } from '@/components/category-management/CategoryManagementSection';
import { DataSubmissionSection } from '@/components/data-submission/DataSubmissionSection';
import { OverallProgressSection } from '@/components/overall-progress/OverallProgressSection';
import { CompanyManagementSection } from '@/components/company-management/CompanyManagementSection';
import { CompanyPageProductionSection } from '@/components/company-page-production/CompanyPageProductionSection';
import { ProcessSidePanel } from '@/components/yumemaga/ProcessSidePanel';
import type { ProcessDetail } from '@/types/yumemaga-process';

export default function YumeMagaV2Page() {
  const [publishDate, setPublishDate] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('A');
  const [confirmationStatus, setConfirmationStatus] = useState<Record<string, string>>({});

  // APIから取得したデータ
  const [issues, setIssues] = useState<Array<{ issue: string; isNew: boolean }>>([]);
  const [summary, setSummary] = useState({ completed: 0, inProgress: 0, notStarted: 0, delayed: 0 });
  const [nextMonthProcesses, setNextMonthProcesses] = useState<any[]>([]);
  const [nextMonthIssue, setNextMonthIssue] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryMetadata, setCategoryMetadata] = useState<any[]>([]); // Phase 1: カテゴリマスター
  const [readyProcesses, setReadyProcesses] = useState<string[]>([]); // Phase 2: 準備OK工程
  const [delayedProcessesMap, setDelayedProcessesMap] = useState<Record<string, number>>({}); // Phase 2: 遅延工程
  const [companies, setCompanies] = useState<any[]>([]); // 企業セクション
  const [companyPageProduction, setCompanyPageProduction] = useState<any>(null); // 企業別ページ制作進捗
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ authenticated: boolean; message: string } | null>(null);

  // ProcessSidePanel用の状態
  const [selectedProcess, setSelectedProcess] = useState<ProcessDetail | null>(null);
  const [isProcessPanelOpen, setIsProcessPanelOpen] = useState(false);
  const [loadingProcess, setLoadingProcess] = useState(false);

  // データ取得関数
  const fetchAllData = async (issueToFetch?: string) => {
    const issue = issueToFetch || selectedIssue;
    if (!issue) return;

    setLoading(true);
    try {
      // 工程データ取得でサマリーも取得
      const processesRes = await fetch(`/api/yumemaga-v2/processes?issue=${encodeURIComponent(issue)}`);
      const processesData = await processesRes.json();
      if (processesData.success) {
        setSummary({
          completed: processesData.summary.completed,
          inProgress: processesData.summary.in_progress,
          notStarted: processesData.summary.not_started,
          delayed: processesData.summary.delayed,
        });
      }

      // カテゴリ別進捗取得
      const progressRes = await fetch(`/api/yumemaga-v2/progress?issue=${encodeURIComponent(issue)}`);
      const progressData = await progressRes.json();
      if (progressData.success) {
        const newConfirmationStatus: Record<string, string> = {};

        const categoryList = Object.keys(progressData.categories).map(catId => {
          const cat = progressData.categories[catId];

          // Phase 3: 確認送付ステータスをAPIレスポンスから取得
          newConfirmationStatus[catId] = cat.confirmationStatus || '制作中';

          // requiredDataをオブジェクト配列に変換
          const categoryMeta = categoryMetadata.find(c => c.categoryId === catId);
          const requiredDataArray = categoryMeta?.requiredData
            ? categoryMeta.requiredData.split(',').map((dataName: string) => {
                const trimmedName = dataName.trim();
                return {
                  type: trimmedName,
                  name: trimmedName,
                  status: 'pending', // TODO: Phase 8.3で実際の提出状況を取得
                  deadline: cat.dataSubmissionDeadline || '',
                  optional: false,
                };
              })
            : [];

          return {
            id: catId,
            name: getCategoryName(catId),
            progress: cat.progress,
            completed: cat.completed,
            total: cat.total,
            canvaUrl: null,
            confirmationRequired: isConfirmationRequired(catId),
            confirmationStatus: cat.confirmationStatus || '制作中', // Phase 3: 追加
            deadline: cat.dataSubmissionDeadline,
            processes: cat.processes.map((p: any) => ({
              id: p.processNo,
              name: p.processName,
              plannedDate: p.plannedDate || '-',
              actualDate: p.actualDate,
              status: p.actualDate ? 'completed' : 'not_started',
            })),
            requiredData: requiredDataArray,
          };
        });
        setCategories(categoryList);
        setConfirmationStatus(newConfirmationStatus);
      }

      // 準備フェーズデータ取得（選択中の号の準備フェーズ）
      const nextMonthRes = await fetch(`/api/yumemaga-v2/next-month?issue=${encodeURIComponent(issue)}`);
      const nextMonthData = await nextMonthRes.json();
      if (nextMonthData.success) {
        setNextMonthIssue(nextMonthData.issue);
        setNextMonthProcesses(nextMonthData.processes.map((p: any) => ({
          processNo: p.processNo,
          name: p.name,
          plannedDate: p.plannedDate || '-',
          actualDate: p.actualDate || '',
          status: p.actualDate ? 'completed' : 'not_started' as const,
        })));
      }

      // Phase 2: 準備OK・遅延工程の取得
      const readyRes = await fetch(`/api/yumemaga-v2/ready-processes?issue=${encodeURIComponent(issue)}`);
      const readyData = await readyRes.json();
      if (readyData.success) {
        setReadyProcesses(readyData.readyProcesses.map((p: any) => p.processNo));

        const delayMap: Record<string, number> = {};
        readyData.delayedProcesses.forEach((p: any) => {
          delayMap[p.processNo] = p.delayDays;
        });
        setDelayedProcessesMap(delayMap);
      }

      // 企業別工程データ取得
      const companiesRes = await fetch(`/api/yumemaga-v2/company-processes?issue=${encodeURIComponent(issue)}`);
      const companiesData = await companiesRes.json();
      if (companiesData.success) {
        setCompanies(companiesData.companies || []);
      }

      // 企業別ページ制作進捗取得
      const productionRes = await fetch(`/api/yumemaga-v2/company-page-production?issue=${encodeURIComponent(issue)}`);
      const productionData = await productionRes.json();
      if (productionData.success) {
        setCompanyPageProduction(productionData);

        // カテゴリC/Eに企業別進捗を統合
        const allCompanies = [
          ...(productionData.newCompanies || []),
          ...(productionData.updatedCompanies || [])
        ];

        // カテゴリリストに企業データを追加
        setCategories(prev => prev.map(cat => {
          if (cat.id === 'C') {
            return {
              ...cat,
              companies: productionData.newCompanies || []
            };
          } else if (cat.id === 'E') {
            return {
              ...cat,
              companies: productionData.updatedCompanies || []
            };
          }
          return cat;
        }));
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // Phase 1: カテゴリ名を動的に取得
  const getCategoryName = (catId: string) => {
    const category = categoryMetadata.find(c => c.categoryId === catId);
    return category?.categoryName || catId;
  };

  // Phase 1: 必要データを動的に取得
  const getRequiredData = (catId: string) => {
    const category = categoryMetadata.find(c => c.categoryId === catId);
    if (!category || !category.requiredData) return [];
    return category.requiredData.split(',').map((d: string) => d.trim());
  };

  // Phase 1: 確認送付必須フラグを動的に取得
  const isConfirmationRequired = (catId: string) => {
    const category = categoryMetadata.find(c => c.categoryId === catId);
    return category?.confirmationRequired || false;
  };

  // OAuth認証状態チェック
  useEffect(() => {
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(setAuthStatus);
  }, []);

  // Phase 1: カテゴリマスター取得
  useEffect(() => {
    const fetchCategoryMetadata = async () => {
      try {
        const res = await fetch('/api/yumemaga-v2/categories');
        const data = await res.json();
        if (data.success) {
          setCategoryMetadata(data.categories);
        }
      } catch (error) {
        console.error('カテゴリマスター取得エラー:', error);
      }
    };
    fetchCategoryMetadata();
  }, []);

  // 利用可能な月号を取得
  useEffect(() => {
    const fetchAvailableIssues = async () => {
      try {
        const res = await fetch('/api/yumemaga-v2/available-issues');
        const data = await res.json();
        if (data.success) {
          setIssues(data.issues);
        }
      } catch (error) {
        console.error('月号一覧取得エラー:', error);
      }
    };
    fetchAvailableIssues();
  }, []);

  // issues取得後、selectedIssueが空の場合のみ最新号を自動選択
  useEffect(() => {
    if (issues.length > 0 && !selectedIssue) {
      setSelectedIssue(issues[0].issue);
    }
  }, [issues, selectedIssue]);

  // issues取得後、publishDateが空の場合のみ次号の発行日を自動設定
  useEffect(() => {
    if (issues.length > 0 && !publishDate) {
      const latestIssue = issues[0].issue;
      const match = latestIssue.match(/(\d+)年(\d+)月号/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]);

        let nextYear = year;
        let nextMonth = month + 1;

        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear += 1;
        }

        // 発行日は8日固定（必要に応じて変更可能）
        const nextPublishDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-08`;
        setPublishDate(nextPublishDate);
      }
    }
  }, [issues, publishDate]);

  // 初回データ取得
  useEffect(() => {
    if (categoryMetadata.length > 0) {
      fetchAllData();
    }
  }, [selectedIssue, categoryMetadata]);

  // 実績日更新ハンドラー
  const handleUpdateActualDate = async (processNo: string, date: string) => {
    try {
      const res = await fetch('/api/yumemaga-v2/actual-date', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: selectedIssue,
          processNo,
          actualDate: date,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        alert('実績日を更新しました');
      } else {
        alert(`更新に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error('実績日更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  // 企業ステータス更新ハンドラー
  const handleUpdateCompanyStatus = async (companyId: string, status: string) => {
    try {
      const res = await fetch('/api/yumemaga-v2/company-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        alert(`企業ステータスを「${status}」に更新しました`);
      } else {
        alert(`更新に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error('企業ステータス更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  const handleUpdatePlannedDate = async (processNo: string, date: string) => {
    try {
      const res = await fetch('/api/yumemaga-v2/planned-date', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: selectedIssue,
          processNo,
          plannedDate: date,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        alert('予定日を更新しました');
      } else {
        alert(`更新に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error('予定日更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  // Phase 3: Zセクション用の確認ステータス更新ハンドラー
  const handleUpdateConfirmationStatus = async (categoryId: string, status: string) => {
    try {
      const res = await fetch('/api/yumemaga-v2/confirmation-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: selectedIssue,
          processNo: categoryId, // カテゴリIDを送信
          status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
        alert('確認ステータスを更新しました');
      } else {
        alert(`更新に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error('確認ステータス更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  // Phase 4: 工程詳細サイドパネル関連ハンドラー
  const handleProcessDetail = async (processNo: string) => {
    setLoadingProcess(true);
    try {
      const res = await fetch(
        `/api/yumemaga-v2/process-detail?issue=${encodeURIComponent(selectedIssue)}&processNo=${processNo}`
      );
      const data = await res.json();

      if (data.success) {
        setSelectedProcess(data.process);
        setIsProcessPanelOpen(true);
      } else {
        alert(`工程詳細の取得に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error('工程詳細取得エラー:', error);
      alert('工程詳細の取得に失敗しました');
    } finally {
      setLoadingProcess(false);
    }
  };

  const handleCloseProcessPanel = () => {
    setIsProcessPanelOpen(false);
    setSelectedProcess(null);
  };

  const handleChecklistChange = async (processNo: string, checkId: string, checked: boolean) => {
    // TODO: チェックリスト更新API実装後に追加
    console.log('チェックリスト更新:', processNo, checkId, checked);

    // ローカル状態を更新（楽観的更新）
    if (selectedProcess) {
      const updatedChecklist = selectedProcess.checklist.map(item =>
        item.id === checkId ? { ...item, checked } : item
      );
      setSelectedProcess({
        ...selectedProcess,
        checklist: updatedChecklist,
      });
    }
  };

  const handleCompleteProcess = async (processNo: string) => {
    try {
      // 今日の日付を取得（M/D形式）
      const today = new Date();
      const todayDate = `${today.getMonth() + 1}/${today.getDate()}`;

      // 実績日更新API（既存）を使用
      const res = await fetch('/api/yumemaga-v2/actual-date', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: selectedIssue,
          processNo,
          actualDate: todayDate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('工程を完了にしました');
        // サイドパネルを閉じる
        handleCloseProcessPanel();
        // 全データ再取得
        await fetchAllData();
      } else {
        alert(`更新に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error('工程完了エラー:', error);
      alert('工程完了に失敗しました');
    }
  };

  const handleUploadDeliverable = async (processNo: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('processNo', processNo);
      formData.append('issue', selectedIssue);

      const res = await fetch('/api/yumemaga-v2/deliverable-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert(`ファイルをアップロードしました: ${data.file.name}`);
        // 工程詳細を再取得
        await handleProcessDetail(processNo);
      } else {
        alert(`アップロードに失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error('成果物アップロードエラー:', error);
      alert('アップロードに失敗しました');
    }
  };

  const handleUploadRequiredData = async (processNo: string, dataId: string, file: File) => {
    try {
      // processNoからカテゴリIDを抽出（例: "A-3" → "A"）
      const categoryId = processNo.split('-')[0];

      // dataIdからデータ種別を推測（モックデータの場合、dataIdに情報が含まれている想定）
      // 実際のデータ種別マッピング: audio → recording, document → planning/content, image → photo
      let dataType = 'recording'; // デフォルト
      if (dataId.includes('audio') || dataId.includes('録音')) {
        dataType = 'recording';
      } else if (dataId.includes('photo') || dataId.includes('写真') || dataId.includes('画像')) {
        dataType = 'photo';
      } else if (dataId.includes('planning') || dataId.includes('企画')) {
        dataType = 'planning';
      } else if (dataId.includes('content') || dataId.includes('内容整理')) {
        dataType = 'content';
      }

      const formData = new FormData();
      formData.append('mode', 'category');
      formData.append('files', file);
      formData.append('categoryId', categoryId);
      formData.append('dataType', dataType);

      // 月号を "2025_11" 形式に変換
      const issue = selectedIssue.replace(/(\d{4})年(\d{1,2})月号/, (_, year, month) => {
        const paddedMonth = month.padStart(2, '0');
        return `${year}_${paddedMonth}`;
      });
      formData.append('issue', issue);

      // データ提出APIを使用
      const res = await fetch('/api/yumemaga-v2/data-submission/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert(`ファイルをアップロードしました: ${data.uploadedFiles[0]?.name || file.name}`);

        // 工程完了API呼び出し
        try {
          const completeRes = await fetch('/api/yumemaga-v2/data-submission/complete-process', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              issue: selectedIssue,
              categoryId: categoryId,
              dataType: dataType,
            }),
          });
          const completeData = await completeRes.json();

          if (completeData.success && completeData.completedProcesses.length > 0) {
            alert(`✅ ${completeData.message}\n工程が自動完了しました`);
          }
        } catch (error) {
          console.error('工程完了API呼び出しエラー:', error);
        }

        // 工程詳細を再取得
        await handleProcessDetail(processNo);
        // 全データ再取得
        await fetchAllData();
      } else {
        alert(`アップロードに失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error('必要データアップロードエラー:', error);
      alert('アップロードに失敗しました');
    }
  };

  // ハンドラー関数
  const mockCategories = categories.length > 0 ? categories : [
    {
      id: 'A',
      name: 'メイン記事',
      progress: 60,
      completed: 3,
      total: 5,
      canvaUrl: 'https://canva.com/design/example-a',
      confirmationRequired: true, // 先方確認が必要
      processes: [
        {
          id: 'A-2',
          name: 'メインインタビューデータ提出・撮影',
          plannedDate: '9/28',
          actualDate: '',
          status: 'delayed',
        },
        {
          id: 'A-3',
          name: 'メイン文字起こし',
          plannedDate: '9/29',
          actualDate: '9/29',
          status: 'completed',
        },
        {
          id: 'A-4',
          name: 'メイン内容整理',
          plannedDate: '9/30',
          actualDate: '',
          status: 'in_progress',
        },
        {
          id: 'A-5',
          name: 'キャッチコピー抽出',
          plannedDate: '9/30',
          actualDate: '',
          status: 'not_started',
        },
        {
          id: 'A-6',
          name: '表紙デザイン案作成',
          plannedDate: '10/1',
          actualDate: '10/1',
          status: 'completed',
        },
      ],
      requiredData: [
        { type: 'audio', name: '録音データ', status: 'submitted', deadline: '9/28' },
        { type: 'document', name: '文字起こし', status: 'pending', deadline: '9/29', optional: true },
        { type: 'image', name: '写真画像', status: 'submitted', deadline: '9/28' },
      ],
    },
    {
      id: 'K',
      name: 'インタビュー②',
      progress: 25,
      completed: 1,
      total: 4,
      canvaUrl: null,
      confirmationRequired: true,
      processes: [
        {
          id: 'K-2',
          name: 'インタビュー②データ提出',
          plannedDate: '9/28',
          actualDate: '',
          status: 'delayed',
        },
        {
          id: 'K-3',
          name: 'インタビュー②文字起こし',
          plannedDate: '9/29',
          actualDate: '',
          status: 'not_started',
        },
        {
          id: 'K-4',
          name: 'インタビュー②内容整理',
          plannedDate: '9/30',
          actualDate: '',
          status: 'not_started',
        },
        {
          id: 'K-5',
          name: 'インタビュー②ページ制作',
          plannedDate: '10/2',
          actualDate: '10/2',
          status: 'completed',
        },
      ],
      requiredData: [
        { type: 'audio', name: '録音データ', status: 'pending', deadline: '9/28' },
        { type: 'document', name: '文字起こし', status: 'none', deadline: '9/29', optional: true },
        { type: 'image', name: '写真画像', status: 'submitted', deadline: '9/28' },
      ],
    },
    {
      id: 'H',
      name: 'STAR①',
      progress: 100,
      completed: 4,
      total: 4,
      canvaUrl: 'https://canva.com/design/example-h',
      confirmationRequired: true,
      processes: [
        {
          id: 'H-2',
          name: 'STAR①データ提出',
          plannedDate: '9/27',
          actualDate: '9/27',
          status: 'completed',
        },
        {
          id: 'H-3',
          name: 'STAR①文字起こし',
          plannedDate: '9/28',
          actualDate: '9/28',
          status: 'completed',
        },
        {
          id: 'H-4',
          name: 'STAR①内容整理',
          plannedDate: '9/29',
          actualDate: '9/29',
          status: 'completed',
        },
        {
          id: 'H-5',
          name: 'STAR①ページ制作',
          plannedDate: '10/1',
          actualDate: '10/1',
          status: 'completed',
        },
      ],
      requiredData: [
        { type: 'audio', name: '録音データ', status: 'submitted', deadline: '9/27' },
        { type: 'document', name: '文字起こし', status: 'submitted', deadline: '9/28', optional: true },
        { type: 'image', name: '写真画像', status: 'submitted', deadline: '9/27' },
      ],
    },
    {
      id: 'Z',
      name: '全体進捗',
      progress: 0, // 動的計算
      completed: 0,
      total: 0,
      canvaUrl: null,
      confirmationRequired: false, // Zは確認送付なし
      processes: [],
      requiredData: [],
    },
  ];

  const handleGenerateSchedule = async () => {
    if (!publishDate) {
      alert('発行日を入力してください');
      return;
    }

    setLoading(true);
    try {
      // 1. 新規号を作成
      const createRes = await fetch('/api/yumemaga-v2/create-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishDate }),
      });

      const createData = await createRes.json();

      if (!createData.success) {
        alert(`エラー: ${createData.error}`);
        setLoading(false);
        return;
      }

      alert(`✅ ${createData.issue} を作成しました\n\n` +
            `📅 締切日設定: ${createData.deadlinesSet}工程\n` +
            `📁 Driveフォルダ作成: 成功 ${createData.driveFolders.success}件, 失敗 ${createData.driveFolders.failed}件`);

      // 2. 月号リストを再取得
      const issuesRes = await fetch('/api/yumemaga-v2/available-issues');
      const issuesData = await issuesRes.json();
      if (issuesData.success) {
        setIssues(issuesData.issues);
      }

      // 3. 新しい月号を選択
      setSelectedIssue(createData.issue);

      // 4. データを再取得（新しい月号を直接渡す）
      await fetchAllData(createData.issue);

    } catch (error: any) {
      console.error('新規号作成エラー:', error);
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgress = () => {
    alert('実績データを保存します（バックエンド未実装）');
  };

  const handleOpenDrive = (categoryId: string) => {
    alert(`Googleドライブ: /ゆめマガ/${selectedIssue}/カテゴリ${categoryId}/ を開きます（バックエンド未実装）`);
  };

  const handleOpenCanva = (canvaUrl: string | null) => {
    if (canvaUrl) {
      alert(`Canvaページを開きます: ${canvaUrl}（実装時は window.open）`);
    } else {
      alert(`Canvaメインページ「${selectedIssue}」を開きます（バックエンド未実装）`);
    }
  };

  const getConfirmationStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">✅ 確認OK</span>;
      case 'pending':
        return <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-semibold">⏳ 確認待ち</span>;
      default:
        return <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">未送付</span>;
    }
  };

  const handleNextMonthUpdateActualDate = async (processNo: string, date: string) => {
    alert(`次月号工程${processNo}の実績日を「${date}」に更新しました（バックエンド未実装）`);
  };

  // カテゴリZの進捗を計算
  const calculateOverallProgress = () => {
    const nonZCategories = categories.filter(c => c.id !== 'Z');
    const totalProgress = nonZCategories.reduce((sum, cat) => sum + cat.progress, 0);
    const avgProgress = totalProgress / nonZCategories.length;

    const completedCategories = nonZCategories.filter(cat =>
      cat.progress === 100 && confirmationStatus[cat.id] === 'approved'
    ).length;

    return {
      progress: Math.round(avgProgress),
      completed: completedCategories,
      total: nonZCategories.length,
    };
  };

  const overallProgress = calculateOverallProgress();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            完了
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4" />
            進行中
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            遅延
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
            未着手
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1536px] 2xl:max-w-[1792px] mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            トップページへ戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            ゆめマガ制作進捗管理 <span className="text-sm text-blue-600">v2.0</span>
          </h1>
          <p className="text-gray-600 mt-1">発行日逆算・予実管理・ファイル管理の統合ダッシュボード</p>
        </div>
      </div>

      <div className="max-w-[1536px] 2xl:max-w-[1792px] mx-auto px-6 py-8 space-y-8">
        {/* OAuth認証バナー */}
        {authStatus && !authStatus.authenticated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-800 font-medium">⚠️ Google Drive認証が必要です</p>
                <p className="text-yellow-700 text-sm mt-1">
                  ファイルアップロード機能を使用するには、Google Driveへのアクセスを許可してください。
                </p>
              </div>
              <a
                href="/api/auth/google"
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors whitespace-nowrap"
              >
                認証する
              </a>
            </div>
          </div>
        )}

        {/* 新規号作成 / 月号選択 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">新規号作成 / 月号選択</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 新規作成 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">新規号を作成</h3>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleGenerateSchedule}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <Play className="w-5 h-5" />
                  逆算実行
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                発行日から60日間の逆算スケジュールを自動生成します
              </p>
            </div>

            {/* 既存号読み込み */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">既存の号を読み込み</h3>
              <div className="flex gap-3">
                <select
                  value={selectedIssue}
                  onChange={(e) => {
                    const newIssue = e.target.value;
                    setSelectedIssue(newIssue);
                    fetchAllData(newIssue);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {issues.length > 0 ? (
                    issues.map(({ issue }) => (
                      <option key={issue} value={issue}>
                        {issue}
                      </option>
                    ))
                  ) : (
                    <option>2025年11月号</option>
                  )}
                </select>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                過去に作成したスケジュールを読み込んで編集できます
              </p>
            </div>
          </div>
        </div>

        {/* 進捗サマリー */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">進捗サマリー</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-green-700 font-semibold">完了</span>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-900 mt-2">{summary.completed}</div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 font-semibold">進行中</span>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-900 mt-2">{summary.inProgress}</div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold">未着手</span>
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{summary.notStarted}</div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-red-700 font-semibold">遅延</span>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-900 mt-2">{summary.delayed}</div>
            </div>
          </div>
        </div>

        {/* 次月号事前準備 */}
        <NextMonthPrepSection
          currentMonthIssue={selectedIssue}
          nextMonthIssue={nextMonthIssue}
          processes={nextMonthProcesses}
          companyPrepTasks={companyPageProduction ? [
            ...(companyPageProduction.newCompanies || []),
            ...(companyPageProduction.updatedCompanies || [])
          ].map(company => ({
            ...company,
            tasks: company.tasks.filter(task =>
              task.taskId === 'preparation-contract-check' ||
              task.taskId === 'preparation-form-send' ||
              task.taskId === 'preparation-data-submission'
            )
          })).filter(company => company.tasks.length > 0) : []}
          onUpdateActualDate={handleNextMonthUpdateActualDate}
          onUpdateCompanyActualDate={handleUpdateActualDate}
          onUpdateCompanyPlannedDate={handleUpdatePlannedDate}
        />

        {/* カテゴリ別予実管理 */}
        <CategoryManagementSection
          categories={categories}
          confirmationStatus={confirmationStatus}
          expandedCategory={expandedCategory}
          readyProcesses={readyProcesses}
          delayedProcessesMap={delayedProcessesMap}
          onSave={handleSaveProgress}
          onOpenDrive={handleOpenDrive}
          onOpenCanva={handleOpenCanva}
          onUpdateConfirmation={handleUpdateConfirmationStatus}
          onToggleExpand={(categoryId) =>
            setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
          }
          onUpdateActualDate={handleUpdateActualDate}
          onUpdatePlannedDate={handleUpdatePlannedDate}
          onProcessDetail={handleProcessDetail}
        />

        {/* Phase 3: Zセクション（全体進捗管理） */}
        <OverallProgressSection
          categories={categories}
          companyOverallTasks={companyPageProduction ? [
            ...(companyPageProduction.newCompanies || []),
            ...(companyPageProduction.updatedCompanies || [])
          ].map(company => ({
            ...company,
            tasks: company.tasks.filter(task =>
              task.taskId === 'overall-internal-check' ||
              task.taskId === 'overall-confirmation'
            )
          })).filter(company => company.tasks.length > 0) : []}
          onUpdateConfirmationStatus={handleUpdateConfirmationStatus}
          onUpdateCompanyActualDate={handleUpdateActualDate}
          onUpdateCompanyPlannedDate={handleUpdatePlannedDate}
        />

        {/* 企業紹介ページ管理 */}
        <CompanyManagementSection
          companies={companies}
          loading={loading}
          onRefresh={fetchAllData}
          onUpdateStatus={handleUpdateCompanyStatus}
        />

        {/* 企業別ページ制作進捗 */}
        {companyPageProduction && (
          <CompanyPageProductionSection
            newCompanies={companyPageProduction.newCompanies || []}
            updatedCompanies={companyPageProduction.updatedCompanies || []}
            summary={companyPageProduction.summary}
            loading={loading}
            onRefresh={fetchAllData}
            onUpdateActualDate={handleUpdateActualDate}
            onUpdatePlannedDate={handleUpdatePlannedDate}
          />
        )}

        {/* 企業情報入力フォームリンク */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            企業情報管理
          </h2>
          <p className="text-gray-600 mb-4">
            企業マスターに新規企業を登録、または既存企業の情報を編集できます。
          </p>
          <Link href="/dashboard/yumemaga-v2/company-form">
            <button className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold transition-colors">
              <Building2 className="w-5 h-5" />
              企業情報入力フォームを開く
            </button>
          </Link>
        </div>

        {/* データ提出進捗管理 */}
        <DataSubmissionSection
          categories={categories}
          companies={companies.map(c => ({
            companyId: c.companyId,
            name: c.companyName,
            companyName: c.companyName,
            status: c.status
          }))}
          availableIssues={issues}
          defaultIssue={selectedIssue}
        />
      </div>

      {/* ガントチャート（フルワイド） */}
      <div className="w-full px-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ガントチャート（全期間）</h2>
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ガントチャートは次フェーズで実装します</p>
            <p className="text-sm text-gray-500 mt-2">
              既存の /dashboard/yumemaga のガントチャートを参考に全期間表示に対応
            </p>
          </div>
        </div>
      </div>

      {/* ProcessSidePanel */}
      <ProcessSidePanel
        process={selectedProcess}
        isOpen={isProcessPanelOpen}
        onClose={handleCloseProcessPanel}
        issue={selectedIssue}
        onChecklistChange={handleChecklistChange}
        onCompleteProcess={handleCompleteProcess}
        onUploadDeliverable={handleUploadDeliverable}
        onUploadRequiredData={handleUploadRequiredData}
      />
    </div>
  );
}
