// components/workflow/ContractTable.tsx
'use client';

import React from 'react';
import { Table } from 'lucide-react';
import type { ContractData } from '@/types/workflow';

interface ContractTableProps {
  contracts: ContractData[];
  loading: boolean;
}

export function ContractTable({ contracts, loading }: ContractTableProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Table className="w-5 h-5 text-blue-600" />
        契約・入金管理
      </h3>
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>契約データがありません</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">企業名</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">契約日</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">契約書送付</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">申込書送付</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">契約金額</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">入金予定日</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">入金実績日</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">入金ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{contract.companyName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{contract.contractDate || '-'}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {contract.contractSentDate ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        送付済
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {contract.applicationSentDate ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        送付済
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{contract.amount}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{contract.paymentDueDate || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{contract.paymentActualDate || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      contract.paymentStatus === '入金済'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {contract.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
