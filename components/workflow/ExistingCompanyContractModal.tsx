'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

interface CompanyMasterData {
  companyId: number;
  officialName: string;
}

interface ExistingCompanyContractModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExistingCompanyContractModal({
  onClose,
  onSuccess
}: ExistingCompanyContractModalProps) {
  const [companies, setCompanies] = useState<CompanyMasterData[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [contractInfo, setContractInfo] = useState({
    contractService: 'ゆめマガ',
    contractDate: '',
    amount: '',
    paymentMethod: '一括',
    paymentDueDate: '',
    publicationIssue: '',
    notes: ''
  });

  // 企業リストを取得
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/company-master/list');
      const data = await response.json();
      if (data.success) {
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('企業リスト取得エラー:', error);
    }
  };

  // 検索フィルター
  const filteredCompanies = companies.filter(company =>
    company.officialName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCompany = companies.find(c => c.companyId === selectedCompanyId);

  const handleSubmit = async () => {
    if (!selectedCompanyId) {
      alert('企業を選択してください');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contract/create-for-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          ...contractInfo,
          amount: parseFloat(contractInfo.amount.replace(/,/g, ''))
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch (error) {
      console.error('契約作成エラー:', error);
      alert('契約の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">既存企業の追加契約</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* 企業選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              企業選択
            </label>

            {/* 検索ボックス */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="企業名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 企業リスト */}
            <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              {filteredCompanies.map(company => (
                <button
                  key={company.companyId}
                  onClick={() => setSelectedCompanyId(company.companyId)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                    selectedCompanyId === company.companyId
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : ''
                  }`}
                >
                  <div className="font-medium">{company.officialName}</div>
                  <div className="text-sm text-gray-500">企業ID: {company.companyId}</div>
                </button>
              ))}
            </div>

            {selectedCompany && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                選択中: <strong>{selectedCompany.officialName}</strong>
                （企業ID: {selectedCompany.companyId}）
              </div>
            )}
          </div>

          <hr />

          {/* 契約情報 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">契約情報</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  契約サービス
                </label>
                <select
                  value={contractInfo.contractService}
                  onChange={(e) =>
                    setContractInfo({ ...contractInfo, contractService: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ゆめマガ">ゆめマガ</option>
                  <option value="HP制作">HP制作</option>
                  <option value="SNS運用">SNS運用</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    契約日
                  </label>
                  <input
                    type="date"
                    value={contractInfo.contractDate}
                    onChange={(e) =>
                      setContractInfo({ ...contractInfo, contractDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    契約金額
                  </label>
                  <input
                    type="text"
                    placeholder="例: 744000"
                    value={contractInfo.amount}
                    onChange={(e) =>
                      setContractInfo({ ...contractInfo, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    入金方法
                  </label>
                  <select
                    value={contractInfo.paymentMethod}
                    onChange={(e) =>
                      setContractInfo({ ...contractInfo, paymentMethod: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="一括">一括</option>
                    <option value="分割">分割</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    入金予定日
                  </label>
                  <input
                    type="date"
                    value={contractInfo.paymentDueDate}
                    onChange={(e) =>
                      setContractInfo({ ...contractInfo, paymentDueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  掲載開始号
                </label>
                <input
                  type="text"
                  placeholder="例: 2025年12月号"
                  value={contractInfo.publicationIssue}
                  onChange={(e) =>
                    setContractInfo({ ...contractInfo, publicationIssue: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  value={contractInfo.notes}
                  onChange={(e) =>
                    setContractInfo({ ...contractInfo, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedCompanyId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '作成中...' : '契約を作成'}
          </button>
        </div>
      </div>
    </div>
  );
}
