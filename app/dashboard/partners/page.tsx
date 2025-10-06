'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, RefreshCw, Search, X, ArrowLeft, ExternalLink } from 'lucide-react';
import type { StarInterview } from '@/types/partner';

export default function PartnersPage() {
  const [stars, setStars] = useState<StarInterview[]>([]);
  const [filteredStars, setFilteredStars] = useState<StarInterview[]>([]);
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedStar, setSelectedStar] = useState<StarInterview | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/partners');
      const json = await res.json();

      if (json.success && json.data) {
        setStars(json.data.stars);
        setFilteredStars(json.data.stars);
        setOrganizations(json.data.organizations);
        setLastUpdated(new Date(json.data.updatedAt).toLocaleString('ja-JP'));
      }
    } catch (error) {
      console.error('Failed to fetch partners data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時に自動でデータ取得
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // フィルタリング処理
  useEffect(() => {
    let filtered = [...stars];

    // 検索クエリでフィルタ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (star) =>
          star.name.toLowerCase().includes(query) ||
          star.organization.toLowerCase().includes(query) ||
          star.nameKana.toLowerCase().includes(query)
      );
    }

    // 所属でフィルタ
    if (selectedOrg) {
      filtered = filtered.filter((star) => star.organization === selectedOrg);
    }

    setFilteredStars(filtered);
  }, [searchQuery, selectedOrg, stars]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <h1 className="text-3xl font-bold text-gray-900">
                    パートナー・スターデータ管理
                  </h1>
                </div>
                {lastUpdated && (
                  <p className="text-sm text-gray-500 mt-1">
                    最終更新: {lastUpdated}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 検索・フィルターエリア */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 検索ボックス */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="名前・所属で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 所属フィルター */}
            <div>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">すべての所属</option>
                {organizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 検索結果件数 */}
          <div className="mt-4 text-sm text-gray-600">
            {filteredStars.length}件のスター紹介データ
            {(searchQuery || selectedOrg) && ` （全${stars.length}件中）`}
          </div>
        </div>

        {/* スター一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStars.map((star, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedStar(star)}
            >
              <div className="p-6">
                {/* 名前・所属 */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {star.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{star.nameKana}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                      {star.organization}
                    </span>
                    {star.position && (
                      <span className="text-gray-600">{star.position}</span>
                    )}
                  </div>
                </div>

                {/* 大切にしている言葉 */}
                {star.motto && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 italic">{star.motto}</p>
                  </div>
                )}

                {/* 自己紹介（抜粋） */}
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {star.selfIntroduction}
                </p>

                {/* タイムスタンプ */}
                <p className="text-xs text-gray-400">
                  回答日: {new Date(star.timestamp).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* データがない場合 */}
        {filteredStars.length === 0 && !loading && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery || selectedOrg
                ? '検索条件に一致するデータがありません'
                : 'スターデータを取得するには「更新」ボタンをクリックしてください'}
            </p>
          </div>
        )}
      </div>

      {/* 詳細モーダル */}
      {selectedStar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedStar(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedStar.name}
              </h2>
              <button
                onClick={() => setSelectedStar(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* 基本情報 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {selectedStar.organization}
                  </span>
                  {selectedStar.position && (
                    <span className="text-gray-600 text-sm">
                      {selectedStar.position}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{selectedStar.nameKana}</p>
              </div>

              {/* メイン写真 */}
              {selectedStar.mainPhotoUrl && (
                <div className="mb-6">
                  <a
                    href={selectedStar.mainPhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    メイン写真を表示
                  </a>
                </div>
              )}

              {/* 大切にしている言葉 */}
              {selectedStar.motto && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">大切にしている言葉</h3>
                  <p className="p-4 bg-blue-50 rounded-lg text-gray-700 italic">
                    {selectedStar.motto}
                  </p>
                </div>
              )}

              {/* 自己紹介 */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-2">自己紹介</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedStar.selfIntroduction}
                </p>
              </div>

              {/* インタビュー回答 */}
              <div className="space-y-6">
                <QuestionAnswer
                  question="将来の夢や目標はなんですか？"
                  answer={selectedStar.q1Dream}
                />
                <QuestionAnswer
                  question="一番力を入れていることは何ですか？"
                  answer={selectedStar.q2Focus}
                />
                <QuestionAnswer
                  question="やる気を維持する為にしていることは？"
                  answer={selectedStar.q3Motivation}
                />
                <QuestionAnswer
                  question="「成長した」と感じた経験は何ですか？"
                  answer={selectedStar.q4Growth}
                />
                <QuestionAnswer
                  question="学生時代を教えてください"
                  answer={selectedStar.q5StudentLife}
                />
                <QuestionAnswer
                  question="今までに大きな壁はありましたか？"
                  answer={selectedStar.q6Challenge}
                />
                <QuestionAnswer
                  question="これから挑戦したいことはありますか？"
                  answer={selectedStar.q7NextChallenge}
                />
                <QuestionAnswer
                  question="今後の展望を教えてください"
                  answer={selectedStar.q8Future}
                />
                <QuestionAnswer
                  question="若者（高校生）へ伝えたい事"
                  answer={selectedStar.q9Message}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 質問・回答コンポーネント
function QuestionAnswer({ question, answer }: { question: string; answer: string }) {
  if (!answer) return null;

  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-2">{question}</h4>
      <p className="text-gray-700 whitespace-pre-wrap pl-4 border-l-4 border-blue-200">
        {answer}
      </p>
    </div>
  );
}
