// components/financial-statements/BSDisplay.tsx
'use client';

import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { BalanceSheet } from '@/types/financial';

interface BSDisplayProps {
  data: BalanceSheet | null;
  loading?: boolean;
}

export function BSDisplay({ data, loading = false }: BSDisplayProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
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

  // 会計恒等式のチェック
  const isBalanced = data.totalLiabilitiesAndNetAssets === data.assets.totalAssets;

  // 左カラム（資産の部）のデータ
  const leftRows = [
    { type: 'header', label: '資産の部', section: 'assets' },
    { type: 'section', label: '流動資産', section: 'assets' },
    { type: 'item', label: '現金及び預金', value: data.assets.currentAssets.cash, section: 'assets' },
    { type: 'item', label: '売掛金', value: data.assets.currentAssets.accountsReceivable, section: 'assets' },
    { type: 'subtotal', label: '流動資産合計', value: data.assets.currentAssets.totalCurrentAssets, section: 'assets' },
    { type: 'section', label: '固定資産', section: 'assets' },
    { type: 'subtotal', label: '固定資産合計', value: data.assets.fixedAssets.totalFixedAssets, section: 'assets' },
    { type: 'total', label: '資産合計', value: data.assets.totalAssets, section: 'assets' },
  ];

  // 右カラム（負債・純資産の部）のデータ
  const rightRows = [
    { type: 'header', label: '負債の部', section: 'liabilities' },
    { type: 'section', label: '流動負債', section: 'liabilities' },
    { type: 'item', label: '買掛金（未清算立替金）', value: data.liabilities.currentLiabilities.accountsPayable, section: 'liabilities' },
    { type: 'subtotal', label: '流動負債合計', value: data.liabilities.currentLiabilities.totalCurrentLiabilities, section: 'liabilities' },
    { type: 'section', label: '固定負債', section: 'liabilities' },
    { type: 'subtotal', label: '固定負債合計', value: data.liabilities.fixedLiabilities.totalFixedLiabilities, section: 'liabilities' },
    { type: 'total', label: '負債合計', value: data.liabilities.totalLiabilities, section: 'liabilities' },
    { type: 'header', label: '純資産の部', section: 'netAssets' },
    { type: 'item', label: '資本金', value: data.netAssets.capital, section: 'netAssets' },
    { type: 'item', label: '利益剰余金', value: data.netAssets.retainedEarnings, section: 'netAssets' },
    { type: 'total', label: '純資産合計', value: data.netAssets.totalNetAssets, section: 'netAssets' },
    { type: 'grandtotal', label: '負債・純資産合計', value: data.totalLiabilitiesAndNetAssets, section: 'grand' },
  ];

  // 高さ調整: 左右の行数を揃える
  const heightDiff = rightRows.length - leftRows.length;
  const adjustedLeftRows = [...leftRows];
  const adjustedRightRows = [...rightRows];

  if (heightDiff > 0) {
    // 左カラムに空白行を追加
    for (let i = 0; i < heightDiff; i++) {
      adjustedLeftRows.push({ type: 'spacer' });
    }
  } else if (heightDiff < 0) {
    // 右カラムに空白行を追加
    for (let i = 0; i < Math.abs(heightDiff); i++) {
      adjustedRightRows.push({ type: 'spacer' });
    }
  }

  // 行のレンダリング関数
  const renderRow = (row: any, index: number) => {
    if (row.type === 'spacer') {
      return (
        <tr key={index} className="invisible">
          <td colSpan={2}>&nbsp;</td>
        </tr>
      );
    }

    // セクション別の色分け
    let bgColor = 'bg-white';
    let textColor = 'text-gray-900';
    let borderColor = '';

    if (row.section === 'assets') {
      if (row.type === 'header') {
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-900';
        borderColor = 'border-blue-300';
      } else if (row.type === 'item' || row.type === 'section') {
        bgColor = 'bg-blue-50';
        textColor = 'text-blue-800';
      } else if (row.type === 'subtotal') {
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-900';
      } else if (row.type === 'total') {
        bgColor = 'bg-blue-200';
        textColor = 'text-blue-900';
        borderColor = 'border-blue-400';
      }
    } else if (row.section === 'liabilities') {
      if (row.type === 'header') {
        bgColor = 'bg-red-100';
        textColor = 'text-red-900';
        borderColor = 'border-red-300';
      } else if (row.type === 'item' || row.type === 'section') {
        bgColor = 'bg-red-50';
        textColor = 'text-red-800';
      } else if (row.type === 'subtotal') {
        bgColor = 'bg-red-100';
        textColor = 'text-red-900';
      } else if (row.type === 'total') {
        bgColor = 'bg-red-200';
        textColor = 'text-red-900';
        borderColor = 'border-red-400';
      }
    } else if (row.section === 'netAssets') {
      if (row.type === 'header') {
        bgColor = 'bg-green-100';
        textColor = 'text-green-900';
        borderColor = 'border-green-300';
      } else if (row.type === 'item') {
        bgColor = 'bg-green-50';
        textColor = 'text-green-800';
      } else if (row.type === 'total') {
        bgColor = 'bg-green-200';
        textColor = 'text-green-900';
        borderColor = 'border-green-400';
      }
    } else if (row.section === 'grand') {
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-900';
      borderColor = 'border-purple-400';
    }

    const isBold = row.type === 'header' || row.type === 'subtotal' || row.type === 'total' || row.type === 'grandtotal';

    return (
      <tr key={index} className={`${bgColor} ${borderColor ? `border-t-2 ${borderColor}` : ''}`}>
        <td className={`py-3 px-4 ${isBold ? 'font-bold' : ''} ${textColor}`}>
          {row.type === 'header' ? (
            row.label
          ) : row.type === 'section' ? (
            <span className="ml-2">{row.label}</span>
          ) : row.type === 'item' ? (
            <span className="ml-4">• {row.label}</span>
          ) : (
            row.label
          )}
        </td>
        <td className={`py-3 px-4 text-right ${isBold ? 'font-bold' : ''} ${textColor}`}>
          {row.value !== undefined && row.value !== null ? `${row.value.toLocaleString()}円` : ''}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-green-50 border-b border-green-200 px-6 py-4">
        <h3 className="text-lg font-bold text-green-900">貸借対照表（B/S）</h3>
        <p className="text-sm text-green-700 mt-1">
          {data.fiscalMonth ? `${data.fiscalMonth} 月次` : `${data.fiscalYear} 年次`} - 基準日: {data.asOfDate}
        </p>
      </div>

      {/* 2カラムグリッド */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* 左カラム: 資産の部 */}
          <div className="border-r-2 border-gray-300 pr-4">
            <table className="w-full">
              <tbody>
                {adjustedLeftRows.map((row, index) => renderRow(row, index))}
              </tbody>
            </table>
          </div>

          {/* 右カラム: 負債・純資産の部 */}
          <div className="pl-2">
            <table className="w-full">
              <tbody>
                {adjustedRightRows.map((row, index) => renderRow(row, index))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 会計恒等式チェック */}
        <div className={`mt-6 p-4 rounded-lg border ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">会計恒等式成立</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">会計恒等式エラー</span>
              </>
            )}
          </div>
          <p className={`text-sm mt-2 ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
            総資産 {data.assets.totalAssets.toLocaleString()}円 = 総負債 {data.liabilities.totalLiabilities.toLocaleString()}円 + 純資産 {data.netAssets.totalNetAssets.toLocaleString()}円
            {isBalanced ? ' ✓' : ' ✗'}
          </p>
        </div>

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
