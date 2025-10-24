'use client';
import { useRouter } from 'next/navigation';
import { CompanyInfoForm } from '@/components/company/CompanyInfoForm';
import type { CompanyInfo } from '@/types/company-info';

export default function NewCompanyPage() {
  const router = useRouter();

  const handleSave = async (data: CompanyInfo) => {
    try {
      // APIに企業情報を送信
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        alert(
          `企業情報を保存しました！\n\n` +
          `企業ID: ${result.companyId}\n` +
          `企業名: ${data.企業名}`
        );

        // 保存成功後、ダッシュボードに戻る
        router.push('/dashboard');
      } else {
        alert(`保存に失敗しました\n\nエラー: ${result.error}`);
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert(
        `保存中にエラーが発生しました\n\n` +
        `詳細: ${error instanceof Error ? error.message : '不明なエラー'}`
      );
    }
  };

  const handleCancel = () => {
    if (confirm('入力内容が失われますが、キャンセルしますか？')) {
      router.push('/dashboard');
    }
  };

  return (
    <CompanyInfoForm
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
