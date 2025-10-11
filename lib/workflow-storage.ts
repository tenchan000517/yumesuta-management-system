// lib/workflow-storage.ts
// LocalStorageでの進捗状態管理

import type { WorkflowState } from '@/types/workflow';

const STORAGE_KEY = 'workflow_contract_state';

export function saveWorkflowState(state: WorkflowState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('LocalStorage保存エラー:', error);
  }
}

export function loadWorkflowState(): WorkflowState | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('LocalStorage読み込みエラー:', error);
    return null;
  }
}

export function clearWorkflowState(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('LocalStorage削除エラー:', error);
  }
}
