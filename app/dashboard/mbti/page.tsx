'use client';

import { Brain, TrendingUp, Users, Heart, Award, AlertCircle, CheckCircle, XCircle, Sparkles, TrendingDown } from 'lucide-react';
import Link from 'next/link';

export default function MBTIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
            ← ダッシュボードに戻る
          </Link>
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  MBTI性格診断結果
                </h1>
                <p className="text-xl text-gray-600">
                  あなたの性格タイプ: <span className="font-bold text-blue-600">指揮官 ENTJ-A</span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full w-24 h-24 flex items-center justify-center">
                <Brain className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>

        {/* 性格タイプ概要 */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              性格タイプ概要
            </h2>
            <p className="text-gray-700 leading-relaxed">
              ENTJ（指揮官）のあなたは生まれつきのリーダーで、ビジョンを現実のものにすることに、またとなく意欲的です。持ち前の戦略的思考のおかげで、全体像の把握、長期的な目標設定、目標達成に向けた効率的な計画考案に優れているでしょう。自信・カリスマ性・決断力というレアな組み合わせを備えたあなたは、他者を惹きつけ、あなたのリードに従うよう促すのも得意です。
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              あなたの人生に対するアプローチの特徴は「野心」と「あくなき成功の追求」です。人と資源を組織化する才能があるので、混沌から秩序を生み出し、抽象的なアイデアを具体的な成果に変える能力に長けています。鋭い知性と合理的な意思決定能力を活かして、常に最終的な目標を見据えながら、複雑な状況も難なく切り抜けられるタイプでしょう。
            </p>
          </div>
        </div>

        {/* 性格特性 */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              性格特性
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* エネルギー */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                <p className="text-sm font-semibold text-gray-600 mb-2">エネルギー</p>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">外向型</span>
                    <span className="text-xs font-bold text-blue-600">58%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '58%' }} />
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-2">
                  グループで行う活動が好きで、人との交流を大切にします。自分の熱意や興奮感を表に出す傾向があります。
                </p>
              </div>

              {/* 意識 */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                <p className="text-sm font-semibold text-gray-600 mb-2">意識</p>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">直感型</span>
                    <span className="text-xs font-bold text-purple-600">99%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '99%' }} />
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-2">
                  偏見のない心を持ち、想像力が豊か。独創性を大切にし、「起こる可能性が低いこと」や「隠された意味」に着目します。
                </p>
              </div>

              {/* 性質 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                <p className="text-sm font-semibold text-gray-600 mb-2">性質</p>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">思考型</span>
                    <span className="text-xs font-bold text-green-600">60%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-2">
                  客観性と合理性に着目し、論理を大切にします。社会の調和より、物事が効果的かどうかを重視する傾向があります。
                </p>
              </div>

              {/* 戦術 */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
                <p className="text-sm font-semibold text-gray-600 mb-2">戦術</p>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">計画型</span>
                    <span className="text-xs font-bold text-orange-600">74%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: '74%' }} />
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-2">
                  決断力があり几帳面。予見可能性や明瞭さを大事にし、構造化された環境に身を置いたり計画を立てたりすることを好みます。
                </p>
              </div>

              {/* アイデンティティ */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200">
                <p className="text-sm font-semibold text-gray-600 mb-2">アイデンティティ</p>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">自己主張型</span>
                    <span className="text-xs font-bold text-red-600">68%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '68%' }} />
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-2">
                  自信を持って行動し、ストレスに強い傾向があります。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* キャリアパス */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-green-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              キャリアパス
            </h2>

            {/* 影響力のある特性 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">影響力のある特性</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-1">完璧主義</p>
                  <p className="text-3xl font-bold text-green-600">90%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-1">野心</p>
                  <p className="text-3xl font-bold text-green-600">100%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-1">モチベーション</p>
                  <p className="text-3xl font-bold text-green-600">80%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-1">リーダーシップ</p>
                  <p className="text-3xl font-bold text-green-600">80%</p>
                </div>
              </div>
            </div>

            {/* 強みと弱み */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 強み */}
              <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  あなたの強み
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">明確なコミュニケーション</p>
                      <p className="text-sm text-gray-600">考えを率直にうまく伝え、チームの方向性や目標意識を保ちます</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">決断力ある行動</p>
                      <p className="text-sm text-gray-600">重要な判断も自信を持って素早く行い、物事を前に進めます</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">効率的に物事を整理できる</p>
                      <p className="text-sm text-gray-600">優先順位を的確に見極め、リソースを効果的に配分</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">先を見据える力</p>
                      <p className="text-sm text-gray-600">長期的な影響や展望をいち早く想像できます</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">成果重視の姿勢</p>
                      <p className="text-sm text-gray-600">理論よりも具体的な達成を評価し、実際の成果に向かって努力を導きます</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">自発性があり積極的</p>
                      <p className="text-sm text-gray-600">他人の指示や承認を待つことなく、チャンスを即座につかみ、プロジェクトやキャリアを推進します</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* 弱み */}
              <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  あなたの弱み
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">仕事を任せるのに抵抗がある</p>
                      <p className="text-sm text-gray-600">自分ひとりで多くの仕事を抱え込みやすい</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">批判的になりすぎる</p>
                      <p className="text-sm text-gray-600">厳しすぎる指摘でチームの士気に影響することも</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">単調作業は飽きてしまう</p>
                      <p className="text-sm text-gray-600">ルーチンや細かい作業に根気が続きにくい</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">感情面で配慮不足</p>
                      <p className="text-sm text-gray-600">成果に集中するあまり、周囲の感情面のニーズを見落としがち</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">曖昧な事柄が苦手</p>
                      <p className="text-sm text-gray-600">目標が曖昧な仕事や不確かな進め方に戸惑い、明確な成果が見える状況を好みます</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">非効率な物事に不寛容</p>
                      <p className="text-sm text-gray-600">効率を重視するあまり、遅い同僚や避けられない遅れにイライラしやすく、協力関係に悪影響を及ぼすことがあります</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* おすすめのキャリア */}
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                きっと好きになるキャリア
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-gray-800">プロジェクトマネージャー</p>
                  <p className="text-xs text-gray-600 mt-1">明確な計画と目標でチームを率いる</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-gray-800">ビジネスアナリスト</p>
                  <p className="text-xs text-gray-600 mt-1">企業の課題を見つけ改善策を提案</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-gray-800">マーケティングマネージャー</p>
                  <p className="text-xs text-gray-600 mt-1">効果的な戦略でチームを導く</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-gray-800">営業チームリーダー</p>
                  <p className="text-xs text-gray-600 mt-1">営業チームを目標達成へ導く</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-gray-800">経営コンサルタント</p>
                  <p className="text-xs text-gray-600 mt-1">明確な戦略で組織を支援</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-gray-800">起業家</p>
                  <p className="text-xs text-gray-600 mt-1">意欲的なアイデアをビジネスに</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-gray-800">オペレーションコーディネーター</p>
                  <p className="text-xs text-gray-600 mt-1">業務プロセスを最適化し、組織の効率と生産性を高める</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-gray-800">研修コーディネーター</p>
                  <p className="text-xs text-gray-600 mt-1">スキルアッププログラムを企画・運営し、他者の成長を支援</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-gray-800">人事の専門家</p>
                  <p className="text-xs text-gray-600 mt-1">明確な方針で組織を管理し、チームの効率とやる気を高める</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-gray-800">サプライチェーンアナリスト</p>
                  <p className="text-xs text-gray-600 mt-1">物流を的確に管理し、効率や生産性向上の方法を追求</p>
                </div>
              </div>
            </div>

            {/* あなたに合った働き方 */}
            <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-200 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                あなたに合った働き方
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <p className="font-semibold text-gray-800 mb-2">明確なリーダーシップ</p>
                  <p className="text-xs text-gray-600">はっきりとした目標と責任を持って人を導くとき、最も力を発揮できます</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <p className="font-semibold text-gray-800 mb-2">自主的な意思決定</p>
                  <p className="text-xs text-gray-600">余計な干渉なく、自立して判断できる環境で最良のパフォーマンスを発揮します</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <p className="font-semibold text-gray-800 mb-2">スピーディな環境</p>
                  <p className="text-xs text-gray-600">忙しく課題解決に取り組む職場で働くと、やる気を保てます</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <p className="font-semibold text-gray-800 mb-2">成果重視</p>
                  <p className="text-xs text-gray-600">明確で測定可能な目標があると、集中力とモチベーションが高まります</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <p className="font-semibold text-gray-800 mb-2">健全な競争</p>
                  <p className="text-xs text-gray-600">競争意識はあなたを成長させ、より高みを目指す原動力となります</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <p className="font-semibold text-gray-800 mb-2">効率の実践</p>
                  <p className="text-xs text-gray-600">明確なプロセスと効率が重視される環境で、最も満足感を得られます</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 自己成長 */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              自己成長
            </h2>

            {/* 影響力のある特性 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">影響力のある特性</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">レジリエンス</p>
                  <p className="text-3xl font-bold text-purple-600">100%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">自信</p>
                  <p className="text-3xl font-bold text-purple-600">80%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">根性</p>
                  <p className="text-3xl font-bold text-purple-600">100%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">コントロール感</p>
                  <p className="text-3xl font-bold text-purple-600">60%</p>
                </div>
              </div>
            </div>

            {/* 強みと弱み */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 強み */}
              <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  あなたの強み
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">建設的なフィードバックを求める</p>
                      <p className="text-sm text-gray-600">率直な指摘を積極的に受け入れ、常に自己改善に関するアイデアやアドバイスを求める姿勢があります</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">自発性が高い</p>
                      <p className="text-sm text-gray-600">自ら責任を持って能力開発に取り組み、他人からの励ましに依存しません</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">規則的な習慣形成</p>
                      <p className="text-sm text-gray-600">生活を明確なルーチンで整えるので、生産性や健康目標の達成が実現しやすくなります</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">客観的な自己分析</p>
                      <p className="text-sm text-gray-600">自分の行動を冷静に見直し、意図的な成長へとつなげます</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">目的意識のある学習</p>
                      <p className="text-sm text-gray-600">常に有意義な形で技能改善や新たな知識の習得に挑みます</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">新しい体験を進んで受け入れる</p>
                      <p className="text-sm text-gray-600">自分のコンフォートゾーン（安全圏）外の活動にも積極的に挑戦し、大きな成長のきっかけをつくります</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* 弱み */}
              <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  あなたの弱み
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">進歩が遅いと満足しない</p>
                      <p className="text-sm text-gray-600">自分磨きの成果がすぐに現れないと、苛立ちを感じやすく、続けるべき習慣を途中でやめてしまうリスクがあります</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">心の振り返りを避けがち</p>
                      <p className="text-sm text-gray-600">課題に直面すると、理論中心の解決策に集中しすぎて、自分の感情が判断に与える影響を見落としがちです</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">抱え込みすぎてしまう</p>
                      <p className="text-sm text-gray-600">目標達成の意欲が強すぎて複数の責任を一度に引き受けてしまい、疲弊や効率低下を招くことがあります</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">休息を取ることに抵抗がある</p>
                      <p className="text-sm text-gray-600">休暇や気晴らし、リラックスの時間を無駄と感じ、十分なリフレッシュができません</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">高すぎる自己基準</p>
                      <p className="text-sm text-gray-600">完璧主義に近い期待を自分に課すので、小さな失敗や後退でも過度に落ち込みがちです</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">支援を求めにくい</p>
                      <p className="text-sm text-gray-600">自立心が強いために、感情面または実践的なサポートを周囲に求めるのをためらい、有益な視点や助けを受け損ねることがあります</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* あなたを元気にするもの・疲れさせるもの */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 元気にするもの */}
              <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  あなたを元気にするもの
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">高い目標</p>
                      <p className="text-sm text-gray-600">挑戦的なターゲットを追いかけると、情熱とやる気が湧く</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">成果の実感</p>
                      <p className="text-sm text-gray-600">努力の結果や目に見える達成が大きなモチベーションに</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">チームの牽引</p>
                      <p className="text-sm text-gray-600">他者を励まし成功を見届けると満足感を得る</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">プロセス改善</p>
                      <p className="text-sm text-gray-600">物事をより良く、効率的にする方法を見つける</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Brain className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">他者からの学び</p>
                      <p className="text-sm text-gray-600">経験豊富な同僚や優秀な人のアイデアに触れると、刺激を受けます</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">切磋琢磨</p>
                      <p className="text-sm text-gray-600">目標を競い合うと、頑張る気が生まれ、活力が湧きます</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* 疲れさせるもの */}
              <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  あなたを疲れさせるもの
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">優柔不断</p>
                      <p className="text-sm text-gray-600">過度に慎重なアプローチや不確実な事柄への対応</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">意欲が低い</p>
                      <p className="text-sm text-gray-600">やる気や目標がはっきりしない人といると活力を失う</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">遅い環境</p>
                      <p className="text-sm text-gray-600">進捗が遅かったり非効率な状況に焦りを感じる</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">曖昧な指示</p>
                      <p className="text-sm text-gray-600">目標や期待が明確でないと意欲を失いやすい</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">マイクロマネジメントされる</p>
                      <p className="text-sm text-gray-600">過度な干渉や信頼されていないと感じる環境では、やる気が低下してしまいます</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">感情的なトラブル</p>
                      <p className="text-sm text-gray-600">必要以上に感情的になる人や過度に感情が乱れた場面は、大きな負担となり集中力がそがれます</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 人間関係 */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-pink-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-600" />
              人間関係
            </h2>

            {/* 影響力のある特性 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">影響力のある特性</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-pink-50 rounded-lg p-4 border-2 border-pink-200">
                  <p className="text-sm text-gray-600 mb-1">自分らしさ</p>
                  <p className="text-3xl font-bold text-pink-600">60%</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 border-2 border-pink-200">
                  <p className="text-sm text-gray-600 mb-1">忠誠心</p>
                  <p className="text-3xl font-bold text-pink-600">80%</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 border-2 border-pink-200">
                  <p className="text-sm text-gray-600 mb-1">利他主義</p>
                  <p className="text-3xl font-bold text-pink-600">80%</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 border-2 border-pink-200">
                  <p className="text-sm text-gray-600 mb-1">感情知能</p>
                  <p className="text-3xl font-bold text-pink-600">64%</p>
                </div>
              </div>
            </div>

            {/* あなたの強み */}
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                あなたの強み
              </h3>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div>
                    <p className="font-semibold text-gray-800">約束を守る人として信頼されている</p>
                    <p className="text-sm text-gray-600">大切な人には義理堅く、いつも約束を守るタイプなので、相手から信頼を得ます</p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div>
                    <p className="font-semibold text-gray-800">率直で誠実</p>
                    <p className="text-sm text-gray-600">物事を包み隠さず正直に伝え、自分の気持ちや期待をクリアに表現します</p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div>
                    <p className="font-semibold text-gray-800">自信を与える応援力</p>
                    <p className="text-sm text-gray-600">家族や友人に自信を持って生きることや、満足できる道を歩むことを積極的に後押しします</p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div>
                    <p className="font-semibold text-gray-800">実践的な問題解決</p>
                    <p className="text-sm text-gray-600">論理的に物事を捉え、冷静な話し合いや解決策で関係の課題に取り組みます</p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div>
                    <p className="font-semibold text-gray-800">自立を尊重する</p>
                    <p className="text-sm text-gray-600">相手の目標や自由を大切にし、愛する人が自分らしく成長できる距離感を保ちます</p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <div>
                    <p className="font-semibold text-gray-800">エネルギッシュな仲間</p>
                    <p className="text-sm text-gray-600">持ち前の情熱で周囲に活気を与え、共通の体験や活動に積極的に参加するよう周りを促します</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* 対人関係の強みと注意点 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 強み */}
              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  対人関係の強み
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">決断力と信頼感</p>
                      <p className="text-sm text-gray-600">困難な状況でも率先して行動し、パートナーに安定感をもたらす</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">目標に向けてのサポート</p>
                      <p className="text-sm text-gray-600">パートナーの夢や目標を心から応援し、より大きな成功へ後押し</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">明確なコミュニケーション</p>
                      <p className="text-sm text-gray-600">気持ちを率直かつ分かりやすく伝え、相互の信頼を築く</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">戦略的な問題解決</p>
                      <p className="text-sm text-gray-600">人間関係の問題が生じても戦略的に素早く解決策を見出し、状況を前向きに導きます</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">モチベーションの源</p>
                      <p className="text-sm text-gray-600">自分の推進力や情熱でパートナーを刺激し、常に前進と成長へと導きます</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">相手を守る忠誠心</p>
                      <p className="text-sm text-gray-600">大切な人を全力で守り抜く強い忠誠心を持ち、確固たる支えとなります</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* 注意点 */}
              <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  対人関係での注意点
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">支配的になりすぎる</p>
                      <p className="text-sm text-gray-600">主導権を握ろうとしすぎて相手の自主性を抑えてしまうことも</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">感情の軽視</p>
                      <p className="text-sm text-gray-600">論理や解決策に偏りすぎて微妙な感情を見落としがち</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">ペースが遅いと苛立つ</p>
                      <p className="text-sm text-gray-600">パートナーの決断や行動が遅いとイライラしやすい</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">弱みを見せにくい</p>
                      <p className="text-sm text-gray-600">強さや自立心が裏目に出て、心を開くことが難しくなり、相手に心の距離を感じさせてしまうことがあります</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">仕事優先</p>
                      <p className="text-sm text-gray-600">向上心が強いために仕事を優先しすぎて、相手と過ごす有意義な時間が減り、距離が生じてしまうことがあります</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <div>
                      <p className="font-semibold text-gray-800">妥協しづらい</p>
                      <p className="text-sm text-gray-600">自分のやり方を優先しがちで、パートナーのやり方を取り入れたりして相手に歩み寄るのが苦手な傾向があります</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>診断日: 2025年10月11日 | 出典: 16Personalities MBTI診断</p>
        </div>
      </div>
    </div>
  );
}
