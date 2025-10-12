'use client';

import { AlertCircle, Clock, CheckCircle2, PlayCircle, ArrowRight } from 'lucide-react';
import type { ReminderCard as ReminderCardType } from '@/types/workflow';

interface ReminderCardProps extends ReminderCardType {
  onAction: () => void;
}

export function ReminderCard({
  type,
  companyName,
  contractId,
  paymentDueDate,
  delayDays,
  completedSteps,
  totalSteps,
  nextStep,
  nextStepTitle,
  contractEndDate,
  daysUntilExpiry,
  onAction
}: ReminderCardProps) {
  const styles = {
    'new-contract-required': {
      bg: 'bg-red-50',
      border: 'border-red-300',
      badge: 'bg-red-100 text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      label: '新規契約必要',
      actionLabel: '契約開始'
    },
    'payment-overdue': {
      bg: 'bg-orange-50',
      border: 'border-orange-400',
      badge: 'bg-orange-100 text-orange-800',
      icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
      label: '入金遅延',
      actionLabel: '至急確認'
    },
    'payment-pending': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      badge: 'bg-yellow-100 text-yellow-800',
      icon: <Clock className="w-5 h-5 text-yellow-600" />,
      label: '入金待ち',
      actionLabel: '確認する'
    },
    'in-progress': {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      badge: 'bg-blue-100 text-blue-800',
      icon: <PlayCircle className="w-5 h-5 text-blue-600" />,
      label: '進行中',
      actionLabel: '続きを見る'
    },
    'completed': {
      bg: 'bg-green-50',
      border: 'border-green-300',
      badge: 'bg-green-100 text-green-800',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      label: '完了',
      actionLabel: '詳細を見る'
    },
    'contract-expiry-near': {
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      badge: 'bg-purple-100 text-purple-800',
      icon: <AlertCircle className="w-5 h-5 text-purple-600" />,
      label: '契約満了近い',
      actionLabel: '更新検討'
    }
  };

  const style = styles[type];

  return (
    <div
      onClick={onAction}
      className={`rounded-lg border-2 ${style.border} ${style.bg} p-4 hover:shadow-lg transition-all cursor-pointer`}
    >
      <div className="flex items-start gap-3">
        {style.icon}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded ${style.badge}`}>
              {style.label}
            </span>
          </div>

          <h4 className="text-sm font-bold text-gray-900 mb-1">{companyName}</h4>

          {/* 新規契約必要 */}
          {type === 'new-contract-required' && (
            <p className="text-xs text-gray-600 mb-3">
              顧客マスタで「受注」になっていますが、契約業務が開始されていません
            </p>
          )}

          {/* 入金待ち */}
          {type === 'payment-pending' && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1">
                入金予定日: {paymentDueDate}
              </p>
              {nextStep && nextStepTitle && (
                <p className="text-xs font-semibold text-yellow-700 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  次のアクション: {['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬'][nextStep - 1]} {nextStepTitle}
                </p>
              )}
            </div>
          )}

          {/* 入金遅延 */}
          {type === 'payment-overdue' && (
            <div className="mb-3">
              <p className="text-xs text-red-600 font-semibold mb-1">
                入金予定日超過: {delayDays}日遅延
              </p>
              {nextStep && nextStepTitle && (
                <p className="text-xs font-semibold text-orange-700 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  次のアクション: {['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬'][nextStep - 1]} {nextStepTitle}
                </p>
              )}
            </div>
          )}

          {/* 進行中 */}
          {type === 'in-progress' && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1">
                現在の進捗: {completedSteps}/{totalSteps} ステップ完了
              </p>
              {nextStep && nextStepTitle && (
                <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  次のステップ: {['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬'][nextStep - 1]} {nextStepTitle}
                </p>
              )}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(completedSteps! / totalSteps!) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 契約満了近い */}
          {type === 'contract-expiry-near' && (
            <div className="mb-3">
              <p className="text-xs text-purple-700 font-semibold mb-1">
                契約満了日: {contractEndDate}
              </p>
              <p className="text-xs text-gray-600">
                残り{daysUntilExpiry}日 - 更新手続きをご検討ください
              </p>
            </div>
          )}

          {/* 完了 */}
          {type === 'completed' && (
            <p className="text-xs text-gray-600 mb-3">
              すべてのステップが完了しました
            </p>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="w-full text-xs font-semibold py-2 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {style.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
