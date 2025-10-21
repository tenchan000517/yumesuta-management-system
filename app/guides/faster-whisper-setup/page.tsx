'use client';

import { ArrowLeft, Terminal, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function FasterWhisperSetupGuide() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/dashboard/yumemaga-v2"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            ゆめマガ制作フローに戻る
          </Link>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          faster-whisper セットアップガイド
        </h1>
        <p className="text-gray-600 mb-8">
          音声ファイルを高精度で文字起こしするツールのインストール手順
        </p>

        {/* セクション1: Pythonのインストール確認 */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-600" />
            1. Pythonの確認
          </h2>

          <p className="text-gray-700 mb-4">
            faster-whisperを使うには、Python 3.8以上が必要です。
          </p>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm">
            python --version
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              <strong>OK例:</strong> Python 3.11.5 または Python 3.10.12 など
            </p>
            <p className="text-sm text-red-900 mt-2">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              <strong>NG例:</strong> command not found または Python 2.x.x
            </p>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900 font-semibold mb-2">
              Pythonがインストールされていない場合
            </p>
            <p className="text-sm text-yellow-800">
              公式サイトからダウンロード: <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.python.org/downloads/</a>
            </p>
          </div>
        </section>

        {/* セクション2: 仮想環境の作成（推奨） */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            2. 仮想環境の作成（推奨）
          </h2>

          <p className="text-gray-700 mb-4">
            他のPythonプロジェクトと競合しないよう、仮想環境の作成を推奨します。
          </p>

          <h3 className="font-semibold text-gray-900 mb-2">Windows</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm overflow-x-auto">
            python -m venv whisper-env
            <br />
            whisper-env\Scripts\activate
          </div>

          <h3 className="font-semibold text-gray-900 mb-2">Mac / Linux</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm overflow-x-auto">
            python3 -m venv whisper-env
            <br />
            source whisper-env/bin/activate
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              仮想環境が有効になると、プロンプトの先頭に <code className="bg-white px-1 py-0.5 rounded">(whisper-env)</code> と表示されます
            </p>
          </div>
        </section>

        {/* セクション3: faster-whisperのインストール */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            3. faster-whisperのインストール
          </h2>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm">
            pip install faster-whisper
          </div>

          <p className="text-sm text-gray-600 mb-4">
            初回インストールには数分かかる場合があります。
          </p>

          <h3 className="font-semibold text-gray-900 mb-2">確認</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm">
            faster-whisper --help
          </div>
        </section>

        {/* セクション4: パスの設定（重要） */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            4. パスの確認と設定
          </h2>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-900 font-semibold mb-2">
              重要：faster-whisperが見つからない場合
            </p>
            <p className="text-sm text-yellow-800">
              仮想環境を有効化していない可能性があります。上記の手順2を再度実行してください。
            </p>
          </div>

          <h3 className="font-semibold text-gray-900 mb-2">インストール場所の確認</h3>

          <p className="text-sm text-gray-700 mb-2">Windows:</p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm">
            where faster-whisper
          </div>

          <p className="text-sm text-gray-700 mb-2">Mac / Linux:</p>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm">
            which faster-whisper
          </div>
        </section>

        {/* セクション5: 動作確認 */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            5. 動作確認
          </h2>

          <p className="text-gray-700 mb-4">
            テスト用の短い音声ファイルで動作確認をします。
          </p>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-4 font-mono text-sm overflow-x-auto whitespace-nowrap">
            faster-whisper test.mp3 --model tiny --language ja --output_format txt
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900 font-semibold mb-2">
              成功した場合
            </p>
            <p className="text-sm text-green-800">
              同じフォルダに <code className="bg-white px-1 py-0.5 rounded">test.txt</code> が生成されます
            </p>
          </div>
        </section>

        {/* セクション6: トラブルシューティング */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            トラブルシューティング
          </h2>

          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                エラー: command not found
              </h3>
              <p className="text-sm text-gray-700">
                → 仮想環境を有効化していません。手順2を再度実行してください。
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                エラー: ModuleNotFoundError
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                → pipでインストールしたPythonと、実行しているPythonが異なります。
              </p>
              <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                python -m pip install faster-whisper
              </div>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                エラー: メモリ不足
              </h3>
              <p className="text-sm text-gray-700">
                → より小さいモデルを使用してください（medium → small → base）
              </p>
            </div>
          </div>
        </section>

        {/* セットアップ完了 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-green-900 mb-2">
            セットアップ完了
          </h3>
          <p className="text-sm text-green-800 mb-4">
            これでfaster-whisperが使えるようになりました
          </p>
          <Link
            href="/dashboard/yumemaga-v2"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            ゆめマガ制作フローに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
