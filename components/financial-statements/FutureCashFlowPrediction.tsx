// components/financial-statements/FutureCashFlowPrediction.tsx
'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { FuturePredictionResponse } from '@/types/financial';

interface FutureCashFlowPredictionProps {
  data: FuturePredictionResponse;
}

export function FutureCashFlowPrediction({ data }: FutureCashFlowPredictionProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('ja-JP');
  };

  return (
    <div className="space-y-6">
      {/* 現在の状況サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 現在の現金残高 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-700">現在の現金残高</h4>
          </div>
          <p className={`text-2xl font-bold ${data.currentCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.currentCash)}円
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.baseYear}年{data.baseMonth}月末時点
          </p>
        </div>

        {/* 過去3ヶ月の平均入金 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-700">平均入金（過去3ヶ月）</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(data.historicalAverage.revenue)}円
          </p>
        </div>

        {/* 過去3ヶ月の平均純増減 */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {data.historicalAverage.netCashFlow >= 0 ? (
              <TrendingUp className="w-5 h-5 text-purple-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-purple-600" />
            )}
            <h4 className="font-medium text-purple-700">平均純増減（過去3ヶ月）</h4>
          </div>
          <p className={`text-2xl font-bold ${data.historicalAverage.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.historicalAverage.netCashFlow)}円
          </p>
        </div>
      </div>

      {/* 予測テーブル */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  月
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  予定入金
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  予測経費
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  予測給与
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  予測固定費
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  純増減
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  累積現金残高
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.predictions.map((prediction, index) => {
                const isNegative = prediction.cumulativeCashFlow < 0;
                const isFirstNegative =
                  index === 0 || (index > 0 && data.predictions[index - 1].cumulativeCashFlow >= 0);

                return (
                  <tr
                    key={`${prediction.year}-${prediction.month}`}
                    className={`${isNegative && isFirstNegative ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {prediction.period}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(prediction.predictedRevenue)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(prediction.predictedExpenses)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(prediction.predictedSalary)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(prediction.predictedFixedCosts)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                      prediction.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(prediction.netCashFlow)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-bold ${
                      prediction.cumulativeCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(prediction.cumulativeCashFlow)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 注釈 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">予測の前提条件</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>入金・経費・給与は過去3ヶ月の平均値を使用</li>
          <li>固定費は現在の値が継続すると仮定</li>
          <li>季節性や特別な要因は考慮していません</li>
          <li>あくまで参考値であり、実際の結果とは異なる場合があります</li>
        </ul>
      </div>
    </div>
  );
}
