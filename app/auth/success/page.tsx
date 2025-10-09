export default function AuthSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mb-4 text-6xl">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            認証成功！
          </h1>
          <p className="text-gray-600 mb-6">
            Google Driveへのアクセスが許可されました。<br />
            ファイルアップロード機能が利用可能になりました。
          </p>
          <a
            href="/dashboard/yumemaga-v2"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ダッシュボードに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
