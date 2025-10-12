// app/dashboard/workflow/contract/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, FileText, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProgressBar } from '@/components/workflow/ProgressBar';
import { StepCard } from '@/components/workflow/StepCard';
import { SidePanel } from '@/components/workflow/SidePanel';
import { EmailModal } from '@/components/workflow/EmailModal';
import { InformationFormModal } from '@/components/workflow/InformationFormModal';
import { ContractTable } from '@/components/workflow/ContractTable';
import { ResourceMenu } from '@/components/workflow/ResourceMenu';
import { FilterDropdown } from '@/components/workflow/FilterDropdown';
import { ReminderCard } from '@/components/workflow/ReminderCard';
import { NewContractModal } from '@/components/workflow/NewContractModal';
import ExistingCompanyContractModal from '@/components/workflow/ExistingCompanyContractModal';
import { ContractFilesSection } from '@/components/workflow/ContractFilesSection';
import { contractWorkflowSteps, milestones } from '@/data/contract-workflow';
import { emailTemplates } from '@/data/email-templates';
import type { WorkflowStep, StepStatus, ContractData, EmailTemplate, ReminderCard as ReminderCardType } from '@/types/workflow';

export default function ContractWorkflowPage() {
  const router = useRouter();

  // 状態管理
  const [steps, setSteps] = useState<WorkflowStep[]>(contractWorkflowSteps);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailTemplate | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isInformationFormModalOpen, setIsInformationFormModalOpen] = useState(false);

  // データ連動
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Phase 1.5: リマインダー機能
  const [reminders, setReminders] = useState<ReminderCardType[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);
  const [filterMode, setFilterMode] = useState<'in-progress' | 'all'>('in-progress');
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null);
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [showExistingCompanyModal, setShowExistingCompanyModal] = useState(false);

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchContracts();
    fetchReminders();
  }, []);

  // 契約データ取得
  const fetchContracts = async () => {
    setIsLoadingContracts(true);
    try {
      const response = await fetch('/api/contract/list');
      const result = await response.json();
      if (result.success) {
        setContracts(result.data || []);
        const now = new Date();
        setLastUpdated(`${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
      } else {
        console.error('契約データ取得エラー:', result.error);
      }
    } catch (error) {
      console.error('契約データ取得エラー:', error);
    } finally {
      setIsLoadingContracts(false);
    }
  };

  // リマインダー取得
  const fetchReminders = async () => {
    setIsLoadingReminders(true);
    try {
      const response = await fetch('/api/contract/reminders');
      const result = await response.json();
      if (result.success) {
        setReminders(result.reminders || []);
      } else {
        console.error('リマインダー取得エラー:', result.error);
      }
    } catch (error) {
      console.error('リマインダー取得エラー:', error);
    } finally {
      setIsLoadingReminders(false);
    }
  };

  // 契約選択
  const handleSelectContract = async (contractId: number | null) => {
    if (!contractId) {
      setSelectedContractId(null);
      setSelectedContract(null);

      // stepsを初期状態にリセット
      setSteps(contractWorkflowSteps.map(step => ({
        ...step,
        status: 'pending' as StepStatus,
        checklist: step.checklist.map(item => ({ ...item, checked: false }))
      })));

      return;
    }

    try {
      const response = await fetch(`/api/contract/${contractId}`);
      const result = await response.json();
      if (result.success) {
        setSelectedContractId(contractId);
        setSelectedContract(result.contract);

        // チェックリスト取得
        const checklistResponse = await fetch(`/api/contract/checklist/${contractId}`);
        const checklistResult = await checklistResponse.json();

        // 進捗状況 + チェックリストをステップに反映
        const updatedSteps = contractWorkflowSteps.map(step => {
          const completedAtKey = `step${step.stepNumber}CompletedAt` as keyof ContractData;
          const completedAt = result.contract[completedAtKey];

          // チェックリストを反映
          const updatedChecklist = step.checklist.map(item => ({
            ...item,
            checked: checklistResult.success && checklistResult.checklist[item.id] ? checklistResult.checklist[item.id] : false,
          }));

          return {
            ...step,
            status: completedAt ? ('completed' as StepStatus) : ('pending' as StepStatus),
            checklist: updatedChecklist
          };
        });
        setSteps(updatedSteps);

        // 13ステップカードグリッドまでスムーズスクロール
        setTimeout(() => {
          const element = document.getElementById('contract-steps');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        console.error('契約取得エラー:', result.error);
      }
    } catch (error) {
      console.error('契約取得エラー:', error);
    }
  };

  // リマインダーカードのアクション
  const handleReminderAction = (reminder: ReminderCardType) => {
    if (reminder.type === 'new-contract-required') {
      // 新規契約モーダルを開く
      setIsNewContractModalOpen(true);
    } else if (reminder.contractId) {
      // 契約を選択
      handleSelectContract(reminder.contractId);
    }
  };

  // 新規契約作成成功
  const handleNewContractSuccess = (contractId: number) => {
    // リマインダーを再取得
    fetchReminders();
    // 契約一覧を再取得
    fetchContracts();
    // 作成した契約を選択
    setTimeout(() => {
      handleSelectContract(contractId);
    }, 500);
  };

  // フィルタリング済みリマインダー
  const filteredReminders = reminders.filter(reminder => {
    if (filterMode === 'in-progress') {
      // 完了カードは非表示（ただし契約満了近いカードは表示）
      if (reminder.type === 'completed') {
        return false;
      }
      return true;
    }
    return true;
  });

  // カードクリック
  const handleCardClick = (step: WorkflowStep) => {
    setSelectedStep(step);
    setIsPanelOpen(true);
  };

  // チェックリスト更新
  const handleUpdateChecklist = (itemId: string) => {
    setSteps(prevSteps => prevSteps.map(step => {
      if (step.stepNumber === selectedStep?.stepNumber) {
        const updatedChecklist = step.checklist.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        const updatedStep = { ...step, checklist: updatedChecklist };
        setSelectedStep(updatedStep);
        return updatedStep;
      }
      return step;
    }));
  };

  // ステータス更新
  const handleUpdateStatus = (stepNumber: number, status: StepStatus) => {
    setSteps(prevSteps => prevSteps.map(step => {
      if (step.stepNumber === stepNumber) {
        const updatedStep = { ...step, status };
        setSelectedStep(updatedStep);
        return updatedStep;
      }
      return step;
    }));
  };

  // メール例文モーダルを開く
  const handleOpenEmailModal = (templateId: string) => {
    // 情報収集フォームの場合
    if (templateId === 'information-form') {
      setIsInformationFormModalOpen(true);
      return;
    }

    // メール例文の場合
    const template = emailTemplates[templateId];
    if (template) {
      setSelectedEmail(template);
      setIsEmailModalOpen(true);
    }
  };

  // Phase 2.1: ステップ完了コールバック
  const handleStepCompleted = async (stepNumber: number) => {
    console.log(`✅ ステップ${stepNumber}が完了しました`);

    // 契約データを再取得（進捗状況を最新化）
    if (selectedContract) {
      try {
        const response = await fetch(`/api/contract/${selectedContract.id}`);
        const result = await response.json();
        if (result.success) {
          setSelectedContract(result.contract);

          // 進捗状況をステップに反映
          const updatedSteps = contractWorkflowSteps.map(step => {
            const completedAtKey = `step${step.stepNumber}CompletedAt` as keyof ContractData;
            const completedAt = result.contract[completedAtKey];
            return {
              ...step,
              status: completedAt ? ('completed' as StepStatus) : ('pending' as StepStatus),
              checklist: step.checklist
            };
          });
          setSteps(updatedSteps);
        }
      } catch (error) {
        console.error('契約データ再取得エラー:', error);
      }
    }

    // リマインダーカードを再取得
    await fetchReminders();
  };

  // 完了済みステップのリスト
  const completedSteps = steps.filter(s => s.status === 'completed').map(s => s.stepNumber);

  // 現在のステップ（進行中のステップ、なければ次の未着手ステップ）
  const currentStep = steps.find(s => s.status === 'in_progress')?.stepNumber ||
                      steps.find(s => s.status === 'pending')?.stepNumber ||
                      steps[steps.length - 1].stepNumber;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* プログレスバー（契約選択時のみ表示） */}
      {selectedContract && (
        <ProgressBar
          milestones={milestones}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      )}

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto p-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">戻る</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                契約業務フロー（13ステップ）
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                契約から掲載までの業務を正確に進めます
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ResourceMenu />
            <button
              onClick={() => setIsNewContractModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">新規契約</span>
            </button>
            <button
              onClick={() => setShowExistingCompanyModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              既存企業追加契約
            </button>
            <button
              onClick={() => {
                fetchContracts();
                fetchReminders();
              }}
              disabled={isLoadingContracts || isLoadingReminders}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${(isLoadingContracts || isLoadingReminders) ? 'animate-spin' : ''}`} />
              <span className="font-semibold">更新</span>
            </button>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-6">最終更新: {lastUpdated}</p>
        )}

        {/* リマインダーエリア */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              契約管理 ({filteredReminders.length}件)
            </h2>
            <FilterDropdown value={filterMode} onChange={setFilterMode} />
          </div>

          {isLoadingReminders ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">表示する契約がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReminders.map((reminder, index) => (
                <ReminderCard
                  key={index}
                  {...reminder}
                  onAction={() => handleReminderAction(reminder)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 13ステップカードグリッド（契約選択時のみ表示） */}
        {selectedContractId && selectedContract && (
          <div id="contract-steps" className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedContract.companyName} の契約進捗
              </h2>
              <button
                onClick={() => handleSelectContract(null)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                閉じる
              </button>
            </div>

            {/* カードグリッド */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {steps.map((step) => (
                <StepCard
                  key={step.stepNumber}
                  step={step}
                  status={step.status}
                  onClick={() => handleCardClick(step)}
                />
              ))}
            </div>

            {/* Phase 2.2: エビデンスファイル管理セクション */}
            {selectedContract.companyId && (
              <ContractFilesSection
                contractId={selectedContract.id}
                companyId={selectedContract.companyId}
                companyName={selectedContract.companyName}
              />
            )}
          </div>
        )}

        {/* 契約・入金管理テーブル（常に表示） */}
        <ContractTable
          contracts={contracts}
          loading={isLoadingContracts}
        />
      </div>

      {/* サイドパネル */}
      <SidePanel
        step={selectedStep}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onUpdateChecklist={handleUpdateChecklist}
        onUpdateStatus={handleUpdateStatus}
        onOpenEmailModal={handleOpenEmailModal}
        companyId={selectedContract?.companyId}
        contractId={selectedContract?.id}
        companyName={selectedContract?.companyName}
        onStepCompleted={handleStepCompleted}
      />

      {/* メール例文モーダル */}
      <EmailModal
        email={selectedEmail}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        companyName={selectedContract?.companyName}
      />

      {/* 情報収集フォームモーダル */}
      <InformationFormModal
        isOpen={isInformationFormModalOpen}
        onClose={() => setIsInformationFormModalOpen(false)}
      />

      {/* 新規契約作成モーダル */}
      <NewContractModal
        isOpen={isNewContractModalOpen}
        onClose={() => setIsNewContractModalOpen(false)}
        onSuccess={handleNewContractSuccess}
      />

      {/* 既存企業追加契約モーダル */}
      {showExistingCompanyModal && (
        <ExistingCompanyContractModal
          onClose={() => setShowExistingCompanyModal(false)}
          onSuccess={() => {
            setShowExistingCompanyModal(false);
            fetchReminders(); // リマインダーを再取得
          }}
        />
      )}
    </div>
  );
}
