// components/workflow/SidePanel.tsx
'use client';

import React, { useState } from 'react';
import { X, Mail, ExternalLink, Square, CheckSquare } from 'lucide-react';
import type { WorkflowStep, StepStatus } from '@/types/workflow';
import { emailTemplates } from '@/data/email-templates';

interface SidePanelProps {
  step: WorkflowStep | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateChecklist: (itemId: string) => void;
  onUpdateStatus: (stepNumber: number, status: StepStatus) => void;
  onOpenEmailModal: (templateId: string) => void;
}

export function SidePanel({
  step,
  isOpen,
  onClose,
  onUpdateChecklist,
  onUpdateStatus,
  onOpenEmailModal,
}: SidePanelProps) {
  if (!isOpen || !step) return null;

  const handleStatusChange = (newStatus: StepStatus) => {
    onUpdateStatus(step.stepNumber, newStatus);
  };

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

          {/* ステータス変更ボタン */}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange('pending')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                step.status === 'pending'
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              未着手
            </button>
            <button
              onClick={() => handleStatusChange('in_progress')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                step.status === 'in_progress'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              進行中
            </button>
            <button
              onClick={() => handleStatusChange('completed')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                step.status === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              完了
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* 概要 */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">概要</h3>
            <p className="text-sm text-gray-700">{step.overview}</p>
          </section>

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
                    onClick={() => onUpdateChecklist(item.id)}
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
        </div>
      </div>
    </>
  );
}
