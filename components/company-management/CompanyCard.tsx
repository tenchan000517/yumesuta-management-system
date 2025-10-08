'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CompanyField {
  index: number;
  name: string;
  key: string;
  value: string;
  filled: boolean;
  required: boolean;
}

interface Company {
  companyId: string;
  companyName: string;
  logoPath: string;
  industry: string;
  area: string;
  status: 'new' | 'updated' | 'existing';
  statusDescription: string;
  statusBadge: {
    label: string;
    bgColor: string;
    textColor: string;
  };
  progress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    progressRate: number;
  };
  fields: CompanyField[];
}

interface CompanyCardProps {
  company: Company;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateField?: (companyId: string, fieldKey: string, value: string) => void;
  onUpdateStatus?: (companyId: string, status: string) => void;
}

export function CompanyCard({
  company,
  isExpanded,
  onToggleExpand,
  onUpdateField,
  onUpdateStatus,
}: CompanyCardProps) {
  const [editingFields, setEditingFields] = useState<Record<string, string>>({});
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ステータスに応じた背景色
  const bgColorClass = {
    new: 'bg-orange-50',
    updated: 'bg-blue-50',
    existing: 'bg-green-50',
  }[company.status] || 'bg-gray-50';

  // 次のアクション: 未入力フィールドの数
  const unfilledCount = company.fields?.filter(f => !f.filled).length || 0;
  const nextAction = unfilledCount > 0
    ? { text: `${unfilledCount}項目未入力`, icon: '⏳', color: 'text-orange-700' }
    : { text: '全項目入力済み', icon: '✅', color: 'text-green-700' };

  // フィールド完了ハンドラー
  const handleMarkFieldComplete = (fieldKey: string) => {
    if (onUpdateField) {
      onUpdateField(company.companyId, fieldKey, ' '); // 空白スペースで完了扱い
    }
  };

  // フィールド値保存
  const handleSaveField = (fieldKey: string) => {
    const value = editingFields[fieldKey] || '';
    if (onUpdateField) {
      onUpdateField(company.companyId, fieldKey, value);
    }
    setEditingFields(prev => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  return (
    <div className={`${bgColorClass} border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
      {/* カードヘッダー */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">{company.companyName}</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={updatingStatus}
                    className={`text-sm px-3 py-1 rounded cursor-pointer ${company.statusBadge.bgColor} ${company.statusBadge.textColor} font-semibold hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
                  >
                    {updatingStatus ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        更新中...
                      </>
                    ) : (
                      company.statusBadge.label
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[
                    { value: '新規', label: '新規' },
                    { value: '変更', label: '変更' },
                    { value: '継続', label: '継続' },
                    { value: 'active', label: 'active' },
                    { value: 'アーカイブ', label: 'アーカイブ' },
                    { value: 'inactive', label: 'inactive' },
                  ].map((status) => (
                    <DropdownMenuItem
                      key={status.value}
                      onClick={async () => {
                        if (onUpdateStatus) {
                          setUpdatingStatus(true);
                          await onUpdateStatus(company.companyId, status.value);
                          setUpdatingStatus(false);
                        }
                      }}
                      disabled={updatingStatus}
                      className="cursor-pointer"
                    >
                      {status.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-sm text-gray-600">{company.industry} / {company.area}</p>
            <div className={`mt-2 text-sm font-semibold ${nextAction.color} flex items-center gap-1`}>
              <span>{nextAction.icon}</span>
              <span>{nextAction.text}</span>
            </div>
          </div>
        </div>

        {/* 進捗バー */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700 font-semibold">進捗: {company.progress.progressRate}%</span>
            <span className="text-gray-500">{company.progress.completed}/{company.progress.total}工程</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${company.progress.progressRate}%` }}
            />
          </div>
        </div>

        {/* 工程サマリー */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>完了: {company.progress.completed}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>進行中: {company.progress.inProgress}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <span>未着手: {company.progress.notStarted}</span>
          </div>
        </div>

        {/* 展開/折りたたみボタン */}
        <button
          onClick={onToggleExpand}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              工程を閉じる
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              工程を表示
            </>
          )}
        </button>
      </div>

      {/* フィールドリスト（折りたたみ可能） */}
      {isExpanded && (
        <div className="p-4">
          <div className="space-y-2">
            {company.fields?.map(field => (
              <div
                key={field.key}
                className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-base font-semibold text-gray-900">{field.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {field.required ? '必須' : '任意'}
                    </div>
                  </div>
                  {field.filled ? (
                    <span className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded font-semibold">
                      ✓ 入力済み
                    </span>
                  ) : (
                    <span className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded">
                      未入力
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  {editingFields[field.key] !== undefined ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingFields[field.key]}
                        onChange={(e) =>
                          setEditingFields(prev => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.name}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleSaveField(field.key)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setEditingFields(prev => {
                            const next = { ...prev };
                            delete next[field.key];
                            return next;
                          });
                        }}
                        className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-semibold"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {!field.filled && (
                        <button
                          onClick={() => handleMarkFieldComplete(field.key)}
                          className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
                        >
                          空欄で完了
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setEditingFields(prev => ({ ...prev, [field.key]: field.value }))
                        }
                        className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-semibold"
                      >
                        {field.filled ? '変更' : '入力'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {(company.fields?.filter(f => !f.filled).length || 0) === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p className="font-semibold">全フィールド入力済みです</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
