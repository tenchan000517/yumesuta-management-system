'use client';
import { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { NewCompany } from '@/types/contract';
import type { ContractData } from '@/types/workflow';

interface NewCompanySidePanelProps {
  company: NewCompany;
  isOpen: boolean;
  onClose: () => void;
}

interface StepInfo {
  id: number;
  name: string;
  completedAt?: string;
  checklist?: {
    [key: string]: {
      text: string;
      checked: boolean;
    };
  };
}

export function NewCompanySidePanel({
  company,
  isOpen,
  onClose,
}: NewCompanySidePanelProps) {
  const [steps, setSteps] = useState<StepInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 契約業務データを取得
  useEffect(() => {
    if (!isOpen || !company.契約ID) return;

    const fetchContractData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 契約データとチェックリストを並行取得
        const [contractRes, checklistRes] = await Promise.all([
          fetch(`/api/contract/${company.契約ID}`),
          fetch(`/api/contract/checklist/${company.契約ID}`),
        ]);

        const contractData = await contractRes.json();
        const checklistData = await checklistRes.json();

        if (!contractData.success) {
          throw new Error(contractData.error || '契約データの取得に失敗しました');
        }

        const contract: ContractData = contractData.contract;
        const checklist = checklistData.success ? checklistData.checklist : {};

        // ステップ9〜13のデータを構築
        const stepInfos: StepInfo[] = [
          {
            id: 9,
            name: '入金確認',
            completedAt: contract.step9CompletedAt,
            checklist: {
              's9-c1': { text: 'ゆうちょダイレクトで確認したか', checked: checklist['s9-c1'] || false },
              's9-c2': { text: '入金額が正しいか', checked: checklist['s9-c2'] || false },
              's9-c3': { text: '入金日を記録したか', checked: checklist['s9-c3'] || false },
            },
          },
          {
            id: 10,
            name: '入金管理シート更新',
            completedAt: contract.step10CompletedAt,
            checklist: {
              's10-c1': { text: '顧客名が正しく記入されているか', checked: checklist['s10-c1'] || false },
              's10-c2': { text: '入金日が正しく記入されているか', checked: checklist['s10-c2'] || false },
              's10-c3': { text: '入金額が正しく記入されているか', checked: checklist['s10-c3'] || false },
              's10-c4': { text: '掲載期間が正しく記入されているか', checked: checklist['s10-c4'] || false },
            },
          },
          {
            id: 11,
            name: '入金確認連絡・原稿依頼',
            completedAt: contract.step11CompletedAt,
            checklist: {
              's11-c1': { text: '入金確認メールを送ったか', checked: checklist['s11-c1'] || false },
              's11-c2': { text: '原稿情報フォームを送ったか', checked: checklist['s11-c2'] || false },
              's11-c3': { text: '提出期限（7日以内）を伝えたか', checked: checklist['s11-c3'] || false },
              's11-c4': { text: '初稿提出期限（翌月7日）を伝えたか', checked: checklist['s11-c4'] || false },
            },
          },
          {
            id: 12,
            name: '制作・校正',
            completedAt: contract.step12CompletedAt,
            checklist: {
              's12-c1': { text: '制作陣に通知したか', checked: checklist['s12-c1'] || false },
              's12-c2': { text: '原稿情報を共有したか', checked: checklist['s12-c2'] || false },
              's12-c3': { text: '校正用原稿を送付したか', checked: checklist['s12-c3'] || false },
              's12-c4': { text: '校正依頼メールを送ったか', checked: checklist['s12-c4'] || false },
              's12-c5': { text: '修正期限を伝えたか', checked: checklist['s12-c5'] || false },
            },
          },
          {
            id: 13,
            name: '掲載',
            completedAt: contract.step13CompletedAt,
            checklist: {
              's13-c1': { text: '顧客から確認OKをもらったか', checked: checklist['s13-c1'] || false },
              's13-c2': { text: '修正対応が完了したか（修正がある場合）', checked: checklist['s13-c2'] || false },
              's13-c3': { text: '原稿を掲載したか', checked: checklist['s13-c3'] || false },
              's13-c4': { text: '掲載完了メールを送ったか', checked: checklist['s13-c4'] || false },
            },
          },
        ];

        setSteps(stepInfos);
      } catch (err) {
        console.error('契約データ取得エラー:', err);
        setError(err instanceof Error ? err.message : '不明なエラー');
      } finally {
        setLoading(false);
      }
    };

    fetchContractData();
  }, [isOpen, company.契約ID]);

  if (!isOpen) return null;

  return (
    <>
      {/* サイドパネル */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[700px] bg-white shadow-2xl z-50 flex flex-col border-l-4 border-blue-500">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{company.企業名}</h2>
            <p className="text-sm text-gray-600 mt-1">新規掲載企業</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">データ読み込み中...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">エラー: {error}</p>
            </div>
          ) : (
            <>
              {/* 契約基本情報 */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-900 mb-3">📋 契約基本情報</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex">
                    <dt className="font-semibold w-32">契約ID:</dt>
                    <dd>{company.契約ID}</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-semibold w-32">契約サービス:</dt>
                    <dd>{company.契約サービス}</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-semibold w-32">契約金額:</dt>
                    <dd>{company.契約金額}</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-semibold w-32">掲載開始号:</dt>
                    <dd>{company.掲載開始号}</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-semibold w-32">契約開始日:</dt>
                    <dd>{company.契約開始日}</dd>
                  </div>
                </dl>
              </div>

              {/* 制作フロー */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">📝 営業業務の進捗（ステップ9-13）</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>完了</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>一部完了</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      <span>未着手</span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>データ取得元:</strong> 契約・入金管理シート（契約ID: {company.契約ID}）<br />
                    <strong>チェックリスト:</strong> チェックリスト管理シート<br />
                    <strong>更新タイミング:</strong> サイドパネルを開くたびに最新データを取得
                  </p>
                </div>
                <div className="space-y-3">
                  {steps.map((step) => {
                    const isCompleted = !!step.completedAt;
                    const checklist = step.checklist || {};
                    const checklistItems = Object.entries(checklist);
                    const allChecked = checklistItems.every(([, item]) => item.checked);
                    const checkedCount = checklistItems.filter(([, item]) => item.checked).length;
                    const totalCount = checklistItems.length;

                    return (
                      <div
                        key={step.id}
                        className={`border-2 rounded-lg p-4 transition-all ${
                          isCompleted && allChecked
                            ? 'bg-green-50 border-green-400 shadow-sm'
                            : isCompleted
                            ? 'bg-yellow-50 border-yellow-400'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        {/* ステップヘッダー */}
                        <div className="mb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {isCompleted && allChecked ? (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                  <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                              ) : isCompleted ? (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                                  <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                              ) : (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <Clock className="w-6 h-6 text-white" />
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-gray-900 text-lg">
                                  ステップ{step.id}: {step.name}
                                </div>
                                {isCompleted ? (
                                  <div className="text-sm text-gray-600 mt-1">
                                    ✅ 完了日: {step.completedAt} ({checkedCount}/{totalCount}項目完了)
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 mt-1">
                                    ⏳ 営業部門の作業待ち
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* チェックリスト */}
                        {checklistItems.length > 0 && (
                          <div className="ml-7 space-y-1">
                            {checklistItems.map(([key, item]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span className={item.checked ? 'text-green-600' : 'text-gray-400'}>
                                  {item.checked ? '✅' : '⬜'}
                                </span>
                                <span className={item.checked ? 'text-gray-700' : 'text-gray-500'}>
                                  {item.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 制作部門へのアクション提案 */}
                        {step.id === 11 && (
                          <div className="mt-3 ml-7 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                            {isCompleted && checklist['s11-c2']?.checked ? (
                              <p className="text-blue-800">
                                ✅ 原稿フォーム送付済み → 顧客からの回答を待ってください
                              </p>
                            ) : isCompleted && !checklist['s11-c2']?.checked ? (
                              <p className="text-orange-800">
                                ⚠️ 原稿フォーム未送付 → 営業にリマインドが必要です
                              </p>
                            ) : (
                              <p className="text-gray-600">
                                ⏳ 営業業務が完了するまでお待ちください
                              </p>
                            )}
                          </div>
                        )}

                        {step.id === 12 && (
                          <div className="mt-3 ml-7 p-3 bg-purple-50 border border-purple-200 rounded text-sm">
                            {isCompleted ? (
                              <p className="text-purple-800">
                                ✅ 制作・校正完了 → 掲載準備に進めます
                              </p>
                            ) : (
                              <p className="text-gray-600">
                                📝 原稿受領後、制作作業を開始してください
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* フッター */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </>
  );
}
