// components/financial-statements/CFDisplay.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Calendar, BarChart3, List } from 'lucide-react';
import type { CashFlowStatement } from '@/types/financial';
import { CFPaymentSchedule } from './CFPaymentSchedule';
import { CFWeeklySummary } from './CFWeeklySummary';
import { CFDailyCashFlow } from './CFDailyCashFlow';

interface CFDisplayProps {
  data: CashFlowStatement | null;
  loading?: boolean;
  year?: number;
  month?: number;
}

type TabType = 'summary' | 'schedule' | 'weekly' | 'daily';

export function CFDisplay({ data, loading = false, year, month }: CFDisplayProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // 詳細データの取得
  useEffect(() => {
    if (!year || !month || activeTab === 'summary') return;

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const res = await fetch(`/api/financial-statements/cf-details?year=${year}&month=${month}`);
        const json = await res.json();
        if (json.success) {
          setDetailsData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch CF details:', error);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [year, month, activeTab]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-500 text-center">データがありません</p>
      </div>
    );
  }

  const sections = [
    {
      title: '営業活動によるキャッシュフロー',
      rows: [
        { label: '顧客からの入金', value: data.operatingActivities.cashFromCustomers, isHeader: false, indent: 0 },
        { label: '業者への支払', value: -data.operatingActivities.cashToSuppliers, isHeader: false, indent: 0 },
        { label: '営業活動によるキャッシュフロー', value: data.operatingActivities.netOperatingCashFlow, isHeader: true, indent: 0, isBold: true, isSubTotal: true },
      ],
    },
    {
      title: '投資活動によるキャッシュフロー',
      rows: [
        { label: '固定資産の取得', value: -data.investingActivities.purchaseOfFixedAssets, isHeader: false, indent: 0 },
        { label: '投資活動によるキャッシュフロー', value: data.investingActivities.netInvestingCashFlow, isHeader: true, indent: 0, isBold: true, isSubTotal: true },
      ],
    },
    {
      title: '財務活動によるキャッシュフロー',
      rows: [
        { label: '借入による収入', value: data.financingActivities.proceedsFromBorrowings, isHeader: false, indent: 0 },
        { label: '借入金の返済', value: -data.financingActivities.repaymentOfBorrowings, isHeader: false, indent: 0 },
        { label: '財務活動によるキャッシュフロー', value: data.financingActivities.netFinancingCashFlow, isHeader: true, indent: 0, isBold: true, isSubTotal: true },
      ],
    },
  ];

  const netCashFlowIsPositive = data.netCashFlow >= 0;

  // タブボタンのスタイル
  const getTabClass = (tab: TabType) =>
    `px-4 py-2 rounded-t font-semibold transition-colors ${
      activeTab === tab
        ? 'bg-purple-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-purple-50 border-b border-purple-200 px-6 py-4">
        <h3 className="text-lg font-bold text-purple-900">キャッシュフロー計算書（C/F）</h3>
        <p className="text-sm text-purple-700 mt-1">
          {data.fiscalMonth ? `${data.fiscalMonth} 月次` : `${data.fiscalYear} 年次`}
        </p>
      </div>

      {/* タブボタン */}
      <div className="flex gap-2 px-6 pt-4 border-b border-gray-200">
        <button onClick={() => setActiveTab('summary')} className={getTabClass('summary')}>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            サマリー
          </div>
        </button>
        {year && month && (
          <>
            <button onClick={() => setActiveTab('schedule')} className={getTabClass('schedule')}>
              <div className="flex items-center gap-2">
                <List className="w-4 h-4" />
                支払予定一覧
              </div>
            </button>
            <button onClick={() => setActiveTab('weekly')} className={getTabClass('weekly')}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                週次サマリー
              </div>
            </button>
            <button onClick={() => setActiveTab('daily')} className={getTabClass('daily')}>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                日次推移
              </div>
            </button>
          </>
        )}
      </div>

      {/* タブコンテンツ */}
      <div className="p-6">
        {activeTab === 'summary' && (
          <>
            {/* 従来のサマリー表示 */}
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-6' : ''}>
                <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">
                  {section.title}
                </h4>
                <table className="w-full">
                  <tbody>
                    {section.rows.map((row, rowIndex) => {
                      const isPositive = row.value >= 0;
                      const bgColor = row.isSubTotal
                        ? isPositive
                          ? 'bg-green-50'
                          : 'bg-red-50'
                        : rowIndex % 2 === 0
                        ? 'bg-gray-50'
                        : 'bg-white';
                      const textColor = row.isSubTotal
                        ? isPositive
                          ? 'text-green-700'
                          : 'text-red-700'
                        : 'text-gray-900';

                      return (
                        <tr key={rowIndex} className={bgColor}>
                          <td className={`py-2 px-4 ${row.isBold ? 'font-bold' : ''} ${textColor}`}>
                            <div className="flex items-center gap-2">
                              {row.indent === 1 && <span className="text-gray-400 ml-4">└</span>}
                              <span>{row.label}</span>
                              {row.isSubTotal && (
                                <span className="inline-block ml-2">
                                  {isPositive ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                  )}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`py-2 px-4 text-right ${row.isBold ? 'font-bold' : ''} ${textColor}`}>
                            {row.value.toLocaleString()}円
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

            {/* キャッシュフロー合計 */}
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              <table className="w-full">
                <tbody>
                  <tr className={netCashFlowIsPositive ? 'bg-green-100' : 'bg-red-100'}>
                    <td className={`py-3 px-4 font-bold ${netCashFlowIsPositive ? 'text-green-800' : 'text-red-800'}`}>
                      <div className="flex items-center gap-2">
                        <span>現金及び現金同等物の増減</span>
                        {netCashFlowIsPositive ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold text-lg ${netCashFlowIsPositive ? 'text-green-800' : 'text-red-800'}`}>
                      {data.netCashFlow.toLocaleString()}円
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-2 px-4 text-gray-700">期首現金残高</td>
                    <td className="py-2 px-4 text-right text-gray-700">{data.cashAtBeginning.toLocaleString()}円</td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="py-3 px-4 font-bold text-blue-800">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        <span>期末現金残高</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-lg text-blue-800">
                      {data.cashAtEnd.toLocaleString()}円
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'schedule' && (
          detailsLoading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : detailsData?.paymentSchedule ? (
            <CFPaymentSchedule data={detailsData.paymentSchedule} />
          ) : (
            <div className="text-center py-8 text-gray-500">データがありません</div>
          )
        )}

        {activeTab === 'weekly' && (
          detailsLoading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : detailsData?.weeklySummary ? (
            <CFWeeklySummary data={detailsData.weeklySummary} />
          ) : (
            <div className="text-center py-8 text-gray-500">データがありません</div>
          )
        )}

        {activeTab === 'daily' && (
          detailsLoading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : detailsData?.dailyCashFlow ? (
            <CFDailyCashFlow data={detailsData.dailyCashFlow} />
          ) : (
            <div className="text-center py-8 text-gray-500">データがありません</div>
          )
        )}

        {/* フッター（生成日時） */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            生成日時: {new Date(data.generatedAt).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>
    </div>
  );
}
