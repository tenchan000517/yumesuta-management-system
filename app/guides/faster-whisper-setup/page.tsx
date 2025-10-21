'use client';

import { useState } from 'react';
import { ArrowLeft, Terminal, CheckCircle, AlertCircle, Copy, X, FileCode } from 'lucide-react';
import Link from 'next/link';

// 文字起こしスクリプトのコード
const TRANSCRIBE_SCRIPT = `#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
faster-whisper 文字起こしスクリプト

使い方:
    python transcribe.py <音声ファイルパス> [--model MODEL] [--language LANG]

例:
    python transcribe.py "C:\\\\Users\\\\tench\\\\Downloads\\\\audio.mp3"
    python transcribe.py "audio.mp3" --model large-v3 --language ja
"""

import sys
import os
import argparse
from pathlib import Path

try:
    from faster_whisper import WhisperModel
except ImportError:
    print("エラー: faster-whisperがインストールされていません")
    print("インストール: pip install faster-whisper")
    sys.exit(1)


def transcribe_audio(audio_file, model_size="medium", language="ja", device="cpu", compute_type="int8"):
    """
    音声ファイルを文字起こしする

    Args:
        audio_file: 音声ファイルのパス
        model_size: モデルサイズ (tiny, base, small, medium, large-v3)
        language: 言語コード (ja, en, など)
        device: デバイス (cpu, cuda)
        compute_type: 計算型 (int8, float16, float32)

    Returns:
        出力ファイルのパス
    """
    # 音声ファイルの存在確認
    if not os.path.exists(audio_file):
        raise FileNotFoundError(f"音声ファイルが見つかりません: {audio_file}")

    print(f"=" * 60)
    print(f"文字起こしを開始: {os.path.basename(audio_file)}")
    print(f"=" * 60)
    print(f"モデル: {model_size}")
    print(f"言語: {language}")
    print(f"デバイス: {device} ({compute_type})")
    print()

    # モデルをロード
    print("モデルをロード中...")
    try:
        model = WhisperModel(model_size, device=device, compute_type=compute_type)
        print("✓ モデルのロードが完了しました")
    except Exception as e:
        print(f"✗ モデルのロードに失敗しました: {e}")
        raise

    print()
    print("文字起こし中... (時間がかかる場合があります)")

    # 文字起こし実行
    try:
        segments, info = model.transcribe(
            audio_file,
            language=language,
            beam_size=5
        )

        print(f"✓ 検出された言語: {info.language} (確率: {info.language_probability:.2%})")
        print(f"  音声の長さ: {info.duration:.2f}秒")
        print()

        # 出力ファイルパスを生成
        audio_path = Path(audio_file)
        output_file = audio_path.with_suffix('.txt')

        # テキストファイルに書き込み
        print("テキストファイルに書き込み中...")
        with open(output_file, 'w', encoding='utf-8') as f:
            segment_count = 0
            for segment in segments:
                # ファイルに書き込み
                f.write(f"{segment.text}\\\\n")

                # コンソールに表示
                print(f"[{segment.start:>7.2f}s -> {segment.end:>7.2f}s] {segment.text}")

                segment_count += 1

        print()
        print("=" * 60)
        print(f"✓ 完了！ {segment_count}個のセグメントを文字起こししました")
        print(f"✓ 出力ファイル: {output_file}")
        print("=" * 60)

        return str(output_file)

    except Exception as e:
        print(f"✗ 文字起こしに失敗しました: {e}")
        raise


def main():
    parser = argparse.ArgumentParser(
        description="faster-whisperを使って音声ファイルを文字起こしします",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
例:
  python transcribe.py audio.mp3
  python transcribe.py "C:\\\\\\\\Users\\\\\\\\tench\\\\\\\\Downloads\\\\\\\\audio.mp3"
  python transcribe.py audio.mp3 --model large-v3
  python transcribe.py audio.mp3 --model small --language en
        """
    )

    parser.add_argument(
        "audio_file",
        help="文字起こしする音声ファイルのパス"
    )

    parser.add_argument(
        "--model",
        default="medium",
        choices=["tiny", "base", "small", "medium", "large-v3"],
        help="使用するWhisperモデル (デフォルト: medium)"
    )

    parser.add_argument(
        "--language",
        default="ja",
        help="音声の言語コード (デフォルト: ja)"
    )

    parser.add_argument(
        "--device",
        default="cpu",
        choices=["cpu", "cuda"],
        help="使用するデバイス (デフォルト: cpu)"
    )

    parser.add_argument(
        "--compute-type",
        default="int8",
        choices=["int8", "float16", "float32"],
        help="計算型 (デフォルト: int8)"
    )

    args = parser.parse_args()

    try:
        output_file = transcribe_audio(
            args.audio_file,
            model_size=args.model,
            language=args.language,
            device=args.device,
            compute_type=args.compute_type
        )
        return 0
    except KeyboardInterrupt:
        print("\\\\n\\\\n中断されました")
        return 1
    except Exception as e:
        print(f"\\\\n\\\\nエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
`;

export default function FasterWhisperSetupGuide() {
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(TRANSCRIBE_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCommand = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };
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

        {/* セクション0: 準備 */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-600" />
            0. 準備：VSCodeを起動してターミナルを開く
          </h2>

          <p className="text-blue-900 mb-4">
            以下の手順は、すべてVSCodeのターミナルで実行します。
          </p>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Step 1: VSCodeを起動</p>
              <p className="text-sm text-blue-800">
                VSCode（Visual Studio Code）を開きます。インストールされていない場合は <a href="https://code.visualstudio.com/" target="_blank" rel="noopener noreferrer" className="underline">こちら</a> からダウンロードしてください。
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Step 2: ターミナルを開く</p>
              <p className="text-sm text-blue-800 mb-2">
                以下のいずれかの方法でターミナルを開きます：
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>キーボード: <kbd className="bg-white px-2 py-0.5 rounded border">Ctrl</kbd> + <kbd className="bg-white px-2 py-0.5 rounded border">`</kbd> （バッククォート）</li>
                <li>メニュー: 「表示」→「ターミナル」</li>
                <li>メニュー: 「Terminal」→「New Terminal」</li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Step 3: ターミナルの種類を確認</p>
              <p className="text-sm text-blue-800">
                Windowsの場合、ターミナルの種類（Git Bash, CMD, PowerShellなど）を確認してください。このガイドでは <strong>Git Bash</strong> を推奨します。
              </p>
            </div>
          </div>

          <div className="mt-4 bg-white border border-blue-300 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-semibold mb-2">
              ✓ 準備完了の確認
            </p>
            <p className="text-sm text-blue-800">
              VSCodeの下部にターミナルパネルが表示され、コマンドを入力できる状態になっていればOKです。
            </p>
          </div>
        </section>

        {/* セクション1: Pythonのインストール確認 */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-600" />
            1. Pythonの確認
          </h2>

          <p className="text-gray-700 mb-4">
            faster-whisperを使うには、Python 3.8以上が必要です。
          </p>

          <div className="relative mb-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              python --version
            </div>
            <button
              onClick={() => handleCopyCommand("python --version", "python-version")}
              className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copiedCommand === "python-version" ? "✓" : "コピー"}
            </button>
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

          <h3 className="font-semibold text-gray-900 mb-2">Windows（Git Bash）</h3>
          <div className="relative mb-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              cd ~<br />
              python -m venv whisper-env<br />
              source whisper-env/Scripts/activate
            </div>
            <button
              onClick={() => handleCopyCommand("cd ~\npython -m venv whisper-env\nsource whisper-env/Scripts/activate", "venv-gitbash")}
              className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copiedCommand === "venv-gitbash" ? "✓" : "コピー"}
            </button>
          </div>

          <h3 className="font-semibold text-gray-900 mb-2">Windows（CMD）</h3>
          <div className="relative mb-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              cd %USERPROFILE%<br />
              python -m venv whisper-env<br />
              whisper-env\Scripts\activate
            </div>
            <button
              onClick={() => handleCopyCommand("cd %USERPROFILE%\npython -m venv whisper-env\nwhisper-env\\Scripts\\activate", "venv-cmd")}
              className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copiedCommand === "venv-cmd" ? "✓" : "コピー"}
            </button>
          </div>

          <h3 className="font-semibold text-gray-900 mb-2">Mac / Linux</h3>
          <div className="relative mb-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              cd ~<br />
              python3 -m venv whisper-env<br />
              source whisper-env/bin/activate
            </div>
            <button
              onClick={() => handleCopyCommand("cd ~\npython3 -m venv whisper-env\nsource whisper-env/bin/activate", "venv-mac")}
              className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copiedCommand === "venv-mac" ? "✓" : "コピー"}
            </button>
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

          <div className="relative mb-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              pip install faster-whisper
            </div>
            <button
              onClick={() => handleCopyCommand("pip install faster-whisper", "pip-install")}
              className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copiedCommand === "pip-install" ? "✓" : "コピー"}
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            初回インストールには数分かかる場合があります。
          </p>

          <h3 className="font-semibold text-gray-900 mb-2">確認</h3>
          <div className="relative mb-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              pip show faster-whisper
            </div>
            <button
              onClick={() => handleCopyCommand("pip show faster-whisper", "pip-show")}
              className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copiedCommand === "pip-show" ? "✓" : "コピー"}
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900 font-semibold mb-2">
              重要：faster-whisperはCLIコマンドではありません
            </p>
            <p className="text-sm text-yellow-800">
              faster-whisperはPython APIとして提供されています。コマンドラインから直接実行するには、Pythonスクリプトを作成する必要があります。
            </p>
          </div>
        </section>

        {/* セクション3.5: 文字起こしスクリプトの作成 */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-blue-600" />
            4. 文字起こしスクリプトの作成
          </h2>

          <p className="text-gray-700 mb-4">
            faster-whisperを使って音声ファイルを文字起こしするためのPythonスクリプトを作成します。
          </p>

          <button
            onClick={() => setShowScriptModal(true)}
            className="w-full mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <FileCode className="w-5 h-5" />
            スクリプトコードを表示してコピー
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">📝 スクリプト作成手順</h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Step 1: スクリプトコードをコピー</p>
                <p className="text-sm text-blue-800">
                  上のボタンをクリックして、モーダルの「コードをコピー」ボタンでコード全体をコピー
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Step 2: VSCodeのターミナルでコマンドを実行</p>
                <div className="relative">
                  <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                    cd ~<br />
                    code transcribe.py
                  </div>
                  <button
                    onClick={() => handleCopyCommand("cd ~\ncode transcribe.py", "step2")}
                    className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedCommand === "step2" ? "✓" : "コピー"}
                  </button>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  ※ VSCodeの上部エディタエリアに <code className="bg-white px-1 py-0.5 rounded">transcribe.py</code> のタブが開きます（ホームディレクトリ）
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Step 3: エディタにコードを貼り付け</p>
                <p className="text-sm text-blue-800 mb-2">
                  開いた空のファイルエディタに、コピーしたコードを貼り付け（Ctrl+V）
                </p>
                <img
                  src="/vscode/textedita.png"
                  alt="VSCode空のエディタ画面"
                  className="w-full rounded border border-blue-300"
                />
                <p className="text-xs text-blue-700 mt-1">
                  ↑ このような空のエディタが開いたら、ここにコピーしたコードを貼り付けてください
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Step 4: 保存</p>
                <p className="text-sm text-blue-800">
                  <kbd className="bg-white px-2 py-0.5 rounded border">Ctrl</kbd> + <kbd className="bg-white px-2 py-0.5 rounded border">S</kbd> で保存
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-900 mb-2">VSCodeがない場合</h3>
            <p className="text-sm text-yellow-800 mb-2">
              Windows標準のメモ帳でも作成できます：
            </p>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Windowsキー → 「メモ帳」と入力 → 開く</li>
              <li>コピーしたコードを貼り付け</li>
              <li>「ファイル」→「名前を付けて保存」</li>
              <li>保存場所: ホームディレクトリ（例: <code className="bg-white px-1 py-0.5 rounded">C:\Users\あなたのユーザー名\</code>）</li>
              <li>ファイル名: <code className="bg-white px-1 py-0.5 rounded">transcribe.py</code></li>
              <li>文字コード: <strong>UTF-8</strong>（必須）</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">使い方</h3>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm overflow-x-auto">
              python transcribe.py "音声ファイルのパス.mp3"
            </div>
            <p className="text-sm text-green-800 mt-2">
              音声ファイルと同じフォルダに .txt ファイルが生成されます
            </p>
          </div>
        </section>

        {/* セクション5: 動作確認 */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            5. 動作確認
          </h2>

          <p className="text-gray-700 mb-4">
            作成したスクリプトでテスト用の短い音声ファイルを文字起こしします。
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-900 font-semibold mb-2">
              実行前の確認
            </p>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>仮想環境が有効化されている（プロンプトに <code className="bg-white px-1 py-0.5 rounded">(whisper-env)</code> が表示）</li>
              <li>transcribe.py が作成されている</li>
              <li>音声ファイルのパスが正しい</li>
            </ul>
          </div>

          <div className="relative mb-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              python ~/transcribe.py "音声ファイルのパス.mp3"
            </div>
            <button
              onClick={() => handleCopyCommand('python ~/transcribe.py "音声ファイルのパス.mp3"', "test-run")}
              className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copiedCommand === "test-run" ? "✓" : "コピー"}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900 font-semibold mb-2">
              実行例
            </p>
            <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
              python ~/transcribe.py "C:\Users\あなたのユーザー名\Downloads\test.mp3"
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900 font-semibold mb-2">
              成功した場合
            </p>
            <p className="text-sm text-green-800">
              音声ファイルと同じフォルダに <code className="bg-white px-1 py-0.5 rounded">test.txt</code> が生成され、文字起こしテキストが保存されます
            </p>
          </div>
        </section>

        {/* セクション6: トラブルシューティング */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            6. トラブルシューティング
          </h2>

          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                エラー: ModuleNotFoundError: No module named 'faster_whisper'
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                → 仮想環境を有効化していない、またはインストールが失敗しています。
              </p>
              <div className="relative mb-1">
                <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                  source ~/whisper-env/Scripts/activate  # 仮想環境を有効化
                </div>
                <button
                  onClick={() => handleCopyCommand("source ~/whisper-env/Scripts/activate", "ts-activate")}
                  className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedCommand === "ts-activate" ? "✓" : ""}
                </button>
              </div>
              <div className="relative">
                <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                  pip install faster-whisper  # 再インストール
                </div>
                <button
                  onClick={() => handleCopyCommand("pip install faster-whisper", "ts-reinstall")}
                  className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedCommand === "ts-reinstall" ? "✓" : ""}
                </button>
              </div>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                エラー: FileNotFoundError: 音声ファイルが見つかりません
              </h3>
              <p className="text-sm text-gray-700">
                → ファイルパスが間違っています。パスをダブルクォートで囲んでいるか確認してください。
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                エラー: メモリ不足 / 処理が遅い
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                → より小さいモデルを使用してください:
              </p>
              <div className="relative mb-1">
                <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                  python ~/transcribe.py "audio.mp3" --model small
                </div>
                <button
                  onClick={() => handleCopyCommand('python ~/transcribe.py "audio.mp3" --model small', "ts-small")}
                  className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedCommand === "ts-small" ? "✓" : ""}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                推奨モデルサイズ: tiny (最速) → base → small → medium (デフォルト)
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                Git Bashでコマンドが動かない
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                → Git Bashでは仮想環境の有効化コマンドが異なります:
              </p>
              <div className="relative mb-1">
                <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                  source ~/whisper-env/Scripts/activate  # Git Bash用
                </div>
                <button
                  onClick={() => handleCopyCommand("source ~/whisper-env/Scripts/activate", "ts-gitbash")}
                  className="absolute top-1 right-1 p-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedCommand === "ts-gitbash" ? "✓" : ""}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                CMDの場合: <code className="bg-white px-1 py-0.5 rounded">whisper-env\Scripts\activate</code>
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

      {/* スクリプトコード表示モーダル */}
      {showScriptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FileCode className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  transcribe.py - スクリプトコード
                </h3>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* モーダルボディ（スクロール可能） */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">使い方</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>下の「コピー」ボタンでコード全体をコピー</li>
                  <li>テキストエディタ（メモ帳、VSCodeなど）を開く</li>
                  <li>コピーしたコードを貼り付け</li>
                  <li><code className="bg-white px-1 py-0.5 rounded">transcribe.py</code> という名前で保存（任意の場所）</li>
                  <li>ターミナルから実行: <code className="bg-white px-1 py-0.5 rounded">python transcribe.py "音声ファイル.mp3"</code></li>
                </ol>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-sm font-mono whitespace-pre">
{TRANSCRIBE_SCRIPT}
                </pre>
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                ファイル名: <code className="bg-gray-100 px-2 py-1 rounded">transcribe.py</code>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowScriptModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  閉じる
                </button>
                <button
                  onClick={handleCopyScript}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'コピーしました！' : 'コードをコピー'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
