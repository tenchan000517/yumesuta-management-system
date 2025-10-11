// app/dashboard/workflow/contract/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProgressBar } from '@/components/workflow/ProgressBar';
import { StepCard } from '@/components/workflow/StepCard';
import { SidePanel } from '@/components/workflow/SidePanel';
import { EmailModal } from '@/components/workflow/EmailModal';
import { InformationFormModal } from '@/components/workflow/InformationFormModal';
import { ContractTable } from '@/components/workflow/ContractTable';
import { contractWorkflowSteps, milestones } from '@/data/contract-workflow';
import { emailTemplates } from '@/data/email-templates';
import { loadWorkflowState, saveWorkflowState } from '@/lib/workflow-storage';
import type { WorkflowStep, StepStatus, ContractData, WorkflowState, EmailTemplate } from '@/types/workflow';

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

  // LocalStorageから進捗状態を復元
  useEffect(() => {
    const savedState = loadWorkflowState();
    if (savedState) {
      setSteps(prevSteps => prevSteps.map(step => ({
        ...step,
        status: savedState.stepStatuses[step.stepNumber] || 'pending',
        checklist: step.checklist.map(item => ({
          ...item,
          checked: savedState.checklists[item.id] || false
        }))
      })));
    }

    // 初回マウント時にデータ取得
    fetchContracts();
  }, []);

  // 進捗状態が変更されたらLocalStorageに保存
  useEffect(() => {
    const state: WorkflowState = {
      stepStatuses: steps.reduce((acc, step) => {
        acc[step.stepNumber] = step.status;
        return acc;
      }, {} as Record<number, StepStatus>),
      checklists: steps.reduce((acc, step) => {
        step.checklist.forEach(item => {
          acc[item.id] = item.checked;
        });
        return acc;
      }, {} as Record<string, boolean>)
    };
    saveWorkflowState(state);
  }, [steps]);

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

  // 完了済みステップのリスト
  const completedSteps = steps.filter(s => s.status === 'completed').map(s => s.stepNumber);

  // 現在のステップ（進行中のステップ、なければ次の未着手ステップ）
  const currentStep = steps.find(s => s.status === 'in_progress')?.stepNumber ||
                      steps.find(s => s.status === 'pending')?.stepNumber ||
                      steps[steps.length - 1].stepNumber;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* プログレスバー */}
      <ProgressBar
        milestones={milestones}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

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
          <button
            onClick={fetchContracts}
            disabled={isLoadingContracts}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${isLoadingContracts ? 'animate-spin' : ''}`} />
            <span className="font-semibold">更新</span>
          </button>
        </div>

        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-6">最終更新: {lastUpdated}</p>
        )}

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

        {/* 契約・入金管理テーブル */}
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
      />

      {/* メール例文モーダル */}
      <EmailModal
        email={selectedEmail}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      {/* 情報収集フォームモーダル */}
      <InformationFormModal
        isOpen={isInformationFormModalOpen}
        onClose={() => setIsInformationFormModalOpen(false)}
      />
    </div>
  );
}
