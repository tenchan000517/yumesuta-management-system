'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSurveyConfig } from '@/data/survey-config';
import type { SurveyConfig } from '@/data/survey-config';

interface FormData {
  grade: string;
  department: string;
  career: string;
  impressivePage: string[];
  readability: string;
  layout: string;
  goodPoints: string[];
  priorKnowledge: string;
  interestedCompanies: string[];
  wantToKnow: string[];
  improvements: string;
}

export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const issue = decodeURIComponent(params.issue as string);

  const [config, setConfig] = useState<SurveyConfig | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    grade: '',
    department: '',
    career: '',
    impressivePage: [],
    readability: '',
    layout: '',
    goodPoints: [],
    priorKnowledge: '',
    interestedCompanies: [],
    wantToKnow: [],
    improvements: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const totalQuestions = 11;

  useEffect(() => {
    const surveyConfig = getSurveyConfig(issue);
    if (!surveyConfig) {
      alert('指定された月号のアンケート設定が見つかりません');
      router.push('/');
      return;
    }
    setConfig(surveyConfig);
  }, [issue, router]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-600">読み込み中...</p>
      </div>
    );
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Google FormsにPOST送信
      const formBody = new URLSearchParams();

      formBody.append(config.entryIds.grade, formData.grade);
      formBody.append(config.entryIds.department, formData.department);
      formBody.append(config.entryIds.career, formData.career);
      formData.impressivePage.forEach((page) => {
        formBody.append(config.entryIds.impressivePage, page);
      });
      formBody.append(config.entryIds.readability, formData.readability);
      formBody.append(config.entryIds.layout, formData.layout);
      formData.goodPoints.forEach((point) => {
        formBody.append(config.entryIds.goodPoints, point);
      });
      formBody.append(config.entryIds.priorKnowledge, formData.priorKnowledge);
      formData.interestedCompanies.forEach((company) => {
        formBody.append(config.entryIds.interestedCompanies, company);
      });
      formData.wantToKnow.forEach((info) => {
        formBody.append(config.entryIds.wantToKnow, info);
      });
      if (formData.improvements) {
        formBody.append(config.entryIds.improvements, formData.improvements);
      }

      const formUrl = `https://docs.google.com/forms/d/e/${config.formId}/formResponse`;

      await fetch(formUrl, {
        method: 'POST',
        body: formBody,
        mode: 'no-cors',
      });

      setSubmitSuccess(true);
    } catch (error) {
      console.error('送信エラー:', error);
      alert('送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultiSelect = (field: 'impressivePage' | 'goodPoints' | 'interestedCompanies' | 'wantToKnow', value: string) => {
    setFormData((prev) => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const isQuestionValid = () => {
    switch (currentQuestion) {
      case 1:
        return formData.grade !== '';
      case 2:
        return formData.department !== '';
      case 3:
        return formData.career !== '';
      case 4:
        return formData.impressivePage.length > 0;
      case 5:
        return formData.readability !== '';
      case 6:
        return formData.layout !== '';
      case 7:
        return formData.goodPoints.length > 0;
      case 8:
        return formData.priorKnowledge !== '';
      case 9:
        return formData.interestedCompanies.length > 0;
      case 10:
        return formData.wantToKnow.length > 0;
      case 11:
        return true; // 任意項目
      default:
        return false;
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              回答ありがとうございました！
            </h2>
            <p className="text-base text-gray-600">
              {issue}のアンケートを送信しました。
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 追従ヘッダー（進捗表示） */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-gray-900">{issue} アンケート</h1>
            <span className="text-sm font-semibold text-blue-600">
              {currentQuestion} / {totalQuestions}
            </span>
          </div>
          {/* プログレスバー */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Q1: 学年 */}
          {currentQuestion === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                学年を教えてください
              </h2>
              <div className="space-y-3">
                {['1年生', '2年生', '3年生'].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setFormData({ ...formData, grade })}
                    className={`w-full min-h-[56px] px-6 py-4 text-lg font-medium rounded-xl border-2 transition-all ${
                      formData.grade === grade
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q2: 学科 */}
          {currentQuestion === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                学科は？
              </h2>
              <div className="space-y-3">
                {['普通科', '工業科', '商業科', '農業科', 'その他'].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setFormData({ ...formData, department: dept })}
                    className={`w-full min-h-[56px] px-6 py-4 text-lg font-medium rounded-xl border-2 transition-all ${
                      formData.department === dept
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q3: 進路 */}
          {currentQuestion === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                卒業後の進路は？
              </h2>
              <div className="space-y-3">
                {['就職したい', '進学したい', 'まだ決めてない', 'その他'].map((career) => (
                  <button
                    key={career}
                    onClick={() => setFormData({ ...formData, career })}
                    className={`w-full min-h-[56px] px-6 py-4 text-lg font-medium rounded-xl border-2 transition-all ${
                      formData.career === career
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {career}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q4: 印象に残ったページ（複数選択） */}
          {currentQuestion === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  一番印象に残ったページは？
                </h2>
                <p className="text-sm text-gray-600">複数選んでもOKです！</p>
              </div>
              <div className="space-y-3">
                {config.pages.map((page) => (
                  <button
                    key={page}
                    onClick={() => handleMultiSelect('impressivePage', page)}
                    className={`w-full min-h-[56px] px-6 py-4 text-left text-base font-medium rounded-xl border-2 transition-all ${
                      formData.impressivePage.includes(page)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q5: 読みやすさ（リニアスケール 1-5） */}
          {currentQuestion === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                記事の読みやすさは？
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600 px-2">
                  <span>読みにくい</span>
                  <span>読みやすい</span>
                </div>
                <div className="flex justify-between gap-2">
                  {['1', '2', '3', '4', '5'].map((value) => (
                    <button
                      key={value}
                      onClick={() => setFormData({ ...formData, readability: value })}
                      className={`flex-1 min-h-[56px] px-4 py-3 text-lg font-bold rounded-xl border-2 transition-all ${
                        formData.readability === value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Q6: レイアウト（リニアスケール 1-5） */}
          {currentQuestion === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                写真やレイアウトは？
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600 px-2">
                  <span>イマイチ</span>
                  <span>最高！</span>
                </div>
                <div className="flex justify-between gap-2">
                  {['1', '2', '3', '4', '5'].map((value) => (
                    <button
                      key={value}
                      onClick={() => setFormData({ ...formData, layout: value })}
                      className={`flex-1 min-h-[56px] px-4 py-3 text-lg font-bold rounded-xl border-2 transition-all ${
                        formData.layout === value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Q7: 良かったポイント（複数選択） */}
          {currentQuestion === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  インタビュー記事や企業情報で良かったポイントは？
                </h2>
                <p className="text-sm text-gray-600">複数選んでもOKです！</p>
              </div>
              <div className="space-y-3">
                {['先輩の本音が聞けた', '社会の雰囲気が分かった', '仕事内容が具体的だった', '写真がキレイだった', '文章が分かりやすかった', '特になし'].map((point) => (
                  <button
                    key={point}
                    onClick={() => handleMultiSelect('goodPoints', point)}
                    className={`w-full min-h-[56px] px-6 py-4 text-left text-lg font-medium rounded-xl border-2 transition-all ${
                      formData.goodPoints.includes(point)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q8: 読前認知度 */}
          {currentQuestion === 8 && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                この雑誌を読む前、掲載されている企業を知っていましたか？
              </h2>
              <div className="space-y-3">
                {['ほとんど知っていた（5社以上）', 'いくつか知っていた（2〜4社）', '1社だけ知っていた', '全く知らなかった'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setFormData({ ...formData, priorKnowledge: option })}
                    className={`w-full min-h-[56px] px-6 py-4 text-left text-lg font-medium rounded-xl border-2 transition-all ${
                      formData.priorKnowledge === option
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q9: 興味を持った企業（複数選択） */}
          {currentQuestion === 9 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  雑誌を読んで、興味を持った企業はありますか？
                </h2>
                <p className="text-sm text-gray-600">複数選んでもOKです！</p>
              </div>
              <div className="space-y-3">
                {config.companies.map((company) => (
                  <button
                    key={company}
                    onClick={() => handleMultiSelect('interestedCompanies', company)}
                    className={`w-full min-h-[56px] px-6 py-4 text-left text-base font-medium rounded-xl border-2 transition-all ${
                      formData.interestedCompanies.includes(company)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {company}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q10: 知りたい情報（複数選択） */}
          {currentQuestion === 10 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  もっとこんな情報が知りたい！
                </h2>
                <p className="text-sm text-gray-600">複数選んでもOKです！</p>
              </div>
              <div className="space-y-3">
                {['給料・待遇の話', '休日・福利厚生', '職場の人間関係', '1日のスケジュール', 'キャリアアップの道', '先輩の失敗談', '会社の雰囲気（動画・写真多め）', 'その他'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleMultiSelect('wantToKnow', option)}
                    className={`w-full min-h-[56px] px-6 py-4 text-left text-lg font-medium rounded-xl border-2 transition-all ${
                      formData.wantToKnow.includes(option)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Q11: 改善点（任意） */}
          {currentQuestion === 11 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  改善してほしいところは？
                </h2>
                <p className="text-sm text-gray-600">自由に書いてください（任意）</p>
              </div>
              <textarea
                value={formData.improvements}
                onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                placeholder="回答を入力"
                rows={6}
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div className="flex gap-3 mt-8">
            {currentQuestion > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 min-h-[56px] px-6 py-4 bg-gray-200 text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-300 transition-colors"
              >
                戻る
              </button>
            )}
            {currentQuestion < totalQuestions ? (
              <button
                onClick={handleNext}
                disabled={!isQuestionValid()}
                className={`flex-1 min-h-[56px] px-6 py-4 rounded-xl font-semibold text-lg transition-colors ${
                  isQuestionValid()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                次へ
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 min-h-[56px] px-6 py-4 rounded-xl font-semibold text-lg transition-colors ${
                  isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSubmitting ? '送信中...' : '送信する'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
