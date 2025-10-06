import { NextResponse } from 'next/server';
import { getBatchSheetData } from '@/lib/google-sheets';
import type {
  TaskMaster,
  TaskHistory,
  ScheduledTask,
  ProjectTask,
  TodayTask,
  TaskDashboardData,
  TaskCategory,
  FrequencyType,
  Priority,
  RiskLevel,
  TaskStatus,
  ScheduledTaskStatus,
  ScheduledTaskAlert,
  ProjectTaskStatus,
  RelatedUrl,
  RelatedPath,
} from '@/types/task';

/**
 * タスク管理データ取得API (Phase 2)
 * GET /api/tasks
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.TASKS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'TASKS_SPREADSHEET_ID が設定されていません' },
        { status: 500 }
      );
    }

    // 4シートを一括取得
    const ranges = [
      'タスクマスタ!A2:V100', // 全35タスク
      'タスク実施履歴!A2:L1000',
      '定期タスクスケジュール!A2:I1000',
      'プロジェクトタスク!A2:M100',
    ];

    const [taskMasterData, historyData, scheduledData, projectData] =
      await getBatchSheetData(spreadsheetId, ranges);

    // データパース
    const taskMasters = parseTaskMasters(taskMasterData);
    const history = parseTaskHistory(historyData);
    const scheduled = parseScheduledTasks(scheduledData);
    const projects = parseProjectTasks(projectData);

    // 今日のタスク抽出
    const today = new Date().toISOString().split('T')[0];
    const todayScheduled = scheduled.filter((s) => s.scheduledDate === today);
    const todayProjects = projects.filter(
      (p) => p.plannedEndDate === today && p.status !== '完了'
    );
    const overdueScheduled = scheduled.filter((s) => s.alert === '期限超過');
    const overdueProjects = projects.filter(
      (p) => p.delayDays > 0 && p.status !== '完了'
    );

    // TodayTask生成
    const todayTasks: TodayTask[] = [
      ...todayScheduled.map((s) => ({
        task: taskMasters.find((tm) => tm.taskId === s.taskId)!,
        scheduled: s,
        alert: s.alert,
        canStart: checkDependencies(s.taskId, taskMasters, projects),
      })),
      ...todayProjects.map((p) => ({
        task: taskMasters.find((tm) => tm.taskId === p.taskId)!,
        project: p,
        alert: (p.delayDays > 0 ? '期限超過' : '本日実施') as ScheduledTaskAlert,
        canStart: p.dependsCompleted,
      })),
    ];

    const dashboardData: TaskDashboardData = {
      todayTasks,
      overdueScheduledTasks: overdueScheduled,
      overdueProjectTasks: overdueProjects,
      allTaskMasters: taskMasters,
      recentHistory: history.slice(0, 10),
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error: any) {
    console.error('タスクデータ取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * タスクマスタデータのパース
 */
function parseTaskMasters(data: any[][]): TaskMaster[] {
  if (!data || data.length === 0) return [];

  const tasks: TaskMaster[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    // 関連URL（最大3つ）
    const relatedUrls: RelatedUrl[] = [];
    if (row[8] && row[9])
      relatedUrls.push({ url: row[8], name: row[9] });
    if (row[10] && row[11])
      relatedUrls.push({ url: row[10], name: row[11] });
    if (row[12] && row[13])
      relatedUrls.push({ url: row[12], name: row[13] });

    // 関連パス（最大2つ）
    const relatedPaths: RelatedPath[] = [];
    if (row[14] && row[15])
      relatedPaths.push({ path: row[14], name: row[15] });
    if (row[16] && row[17])
      relatedPaths.push({ path: row[16], name: row[17] });

    // 依存タスクID（カンマ区切り）
    const dependsOnTaskIds = row[20]
      ? row[20].split(',').map((id: string) => id.trim())
      : undefined;

    const task: TaskMaster = {
      taskId: row[0] || '',
      taskName: row[1] || '',
      category: (row[2] || 'パートナー管理') as TaskCategory,
      frequencyType: (row[3] || '不定期') as FrequencyType,
      frequencyDetail: row[4] || '',
      estimatedTime: row[5] || '',
      priority: (row[6] || '中') as Priority,
      riskLevel: (row[7] || '中') as RiskLevel,
      relatedUrls,
      relatedPaths,
      relatedCommand: row[18] || undefined,
      relatedInfo: row[19] || undefined,
      dependsOnTaskIds,
      notes: row[21] || undefined,
    };

    tasks.push(task);
  }

  return tasks;
}

/**
 * タスク実施履歴データのパース
 */
function parseTaskHistory(data: any[][]): TaskHistory[] {
  if (!data || data.length === 0) return [];

  const history: TaskHistory[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const h: TaskHistory = {
      date: row[0] || '',
      taskId: row[1] || '',
      taskName: row[2] || '',
      status: (row[3] || '未完了') as TaskStatus,
      time: row[4] || undefined,
      actualDuration: row[5] ? parseInt(row[5]) : undefined,
      resultMemo: row[6] || undefined,
      urlClicked: row[7] === 'TRUE' || row[7] === true,
      nextAction: row[8] || undefined,
      alertDate: row[9] || undefined,
      timestamp: row[10] || '',
      notes: row[11] || undefined,
    };

    history.push(h);
  }

  return history;
}

/**
 * 定期タスクスケジュールデータのパース
 */
function parseScheduledTasks(data: any[][]): ScheduledTask[] {
  if (!data || data.length === 0) return [];

  const scheduled: ScheduledTask[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    // アラート自動判定
    let alert: ScheduledTaskAlert = '';
    const scheduledDate = row[0];
    const status = row[4] || '未実施';

    if (scheduledDate < today && status === '未実施') {
      alert = '期限超過';
    } else if (scheduledDate === today && status === '未実施') {
      alert = '本日実施';
    }

    const s: ScheduledTask = {
      scheduledDate,
      taskId: row[1] || '',
      taskName: row[2] || '',
      scheduledTime: row[3] || undefined,
      status: (status) as ScheduledTaskStatus,
      alert,
      completedDate: row[6] || undefined,
      notes: row[7] || undefined,
      timestamp: row[8] || '',
    };

    scheduled.push(s);
  }

  return scheduled;
}

/**
 * プロジェクトタスクデータのパース
 */
function parseProjectTasks(data: any[][]): ProjectTask[] {
  if (!data || data.length === 0) return [];

  const projects: ProjectTask[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    // 遅延日数の計算
    let delayDays = 0;
    const plannedEndDate = row[4];
    const status = row[5] || '未着手';
    if (plannedEndDate < today && status !== '完了') {
      const planned = new Date(plannedEndDate);
      const todayDate = new Date(today);
      delayDays = Math.floor(
        (todayDate.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    const p: ProjectTask = {
      projectName: row[0] || '',
      taskId: row[1] || '',
      taskName: row[2] || '',
      plannedStartDate: row[3] || '',
      plannedEndDate: row[4] || '',
      status: (row[5] || '未着手') as ProjectTaskStatus,
      actualStartDate: row[6] || undefined,
      actualEndDate: row[7] || undefined,
      delayDays,
      assignee: row[9] || '',
      dependsCompleted: row[10] === 'TRUE' || row[10] === true,
      notes: row[11] || undefined,
      timestamp: row[12] || '',
    };

    projects.push(p);
  }

  return projects;
}

/**
 * 依存タスクチェック
 */
function checkDependencies(
  taskId: string,
  taskMasters: TaskMaster[],
  projects: ProjectTask[]
): boolean {
  const task = taskMasters.find((tm) => tm.taskId === taskId);
  if (!task || !task.dependsOnTaskIds) return true;

  return task.dependsOnTaskIds.every((depId) => {
    const depTask = projects.find((p) => p.taskId === depId);
    return depTask?.status === '完了';
  });
}
