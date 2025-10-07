# Phase4逆算スケジューラー GASスクリプト徹底分析

**作成日**: 2025-10-07
**対象**: IdealScheduler（理想形スケジューラー）

---

## 📋 目次

1. [概要](#概要)
2. [階層的制約充足アーキテクチャ](#階層的制約充足アーキテクチャ)
3. [Layer別処理詳細](#layer別処理詳細)
4. [ハードコード箇所の完全リスト](#ハードコード箇所の完全リスト)
5. [逆算計算ロジック](#逆算計算ロジック)
6. [次月号準備の仕組み](#次月号準備の仕組み)
7. [制約充足アルゴリズム](#制約充足アルゴリズム)
8. [データフロー](#データフロー)

---

## 概要

### システムの目的
- **60日間の制作サイクル**で雑誌制作工程を最適配置
- **発行日から逆算**して各工程の実施日を自動計算
- **6種類のマスターデータ**を使った制約充足問題の解決

### 主要クラス構成

```
IdealScheduler (メインクラス)
├── LayeredConstraintSolver (階層的制約充足エンジン)
├── CategorySyncEngine (カテゴリ同期エンジン)
├── LoadBalancingEngine (負荷分散エンジン)
└── IdealPatternEngine (理想形パターンエンジン)
```

---

## 階層的制約充足アーキテクチャ

### 7層構造による段階的スケジューリング

```
Layer 1: 固定要素配置
  ↓
Layer 2: カテゴリ同期実行
  ↓
Layer 3: 負荷分散制御
  ↓
Layer 4: 依存関係処理
  ↓
Layer 5: フィードバックループ管理
  ↓
Layer 6: 最終収束制御
  ↓
Layer 7: 次月号初期作業の並行配置
```

### 各Layerの役割

| Layer | 名前 | 目的 | 処理対象 |
|-------|------|------|----------|
| 1 | 固定要素配置 | 確定締切・データ提出の固定配置 | S-1, S-2, A-2, K-2, L-4, M-4, H-2, I-2, C-4 |
| 2 | カテゴリ同期 | 同種工程の同日実行 | 文字起こし、内容整理、レタッチなど |
| 3 | 負荷分散 | 作業負荷の時系列分散 | ページ制作系工程 |
| 4 | 依存関係 | 前提工程の逆算配置 | 全工程の依存関係チェック |
| 5 | フィードバック | 確認送付の逆算配置 | A-14, K-7, L-10, M-10, H-9, I-9, C-8, E-4, P-4 |
| 6 | 最終収束 | 校了・入稿の絶対締切 | Z-1〜Z-5, B-1, B-2 |
| 7 | 次月号準備 | 回答待ち期間の並行作業 | S-1, S-2, A-1, K-1, L-1〜3, M-1〜3, H-1, I-1, C-1, C-3 |

---

## Layer別処理詳細

### Layer 1: 固定要素配置

#### 処理内容
1. **データ提出工程の固定配置**（最優先）
2. **確定締切がある工程**の配置
3. **期間指定がある工程**の配置

#### ハードコード: データ提出工程

```javascript
const dataSubmissionProcesses = {
  'A-2': { day: 1, name: 'メインインタビューデータ提出・撮影' },
  'K-2': { day: 2, name: 'インタビュー②データ提出' },
  'L-4': { day: 2, name: 'データ提出・撮影' },
  'M-4': { day: 2, name: 'データ提出・撮影' },
  'H-2': { day: 2, name: 'STAR①データ提出' },
  'I-2': { day: 2, name: 'STAR②データ提出' },
  'C-4': { day: 2, name: '新規企業①写真取得' }
};
```

**配置ルール**:
- 1日目 = `config.startDate + 0日`（0-indexed）
- 2日目 = `config.startDate + 1日`
- 固定配置フラグ: `fixedDataSubmission: true`

#### 確定締切の処理

```javascript
if (process.fixedDeadline && process.fixedDeadline !== '-' && !isNaN(process.fixedDeadline)) {
  const deadlineDay = parseInt(process.fixedDeadline);
  const deadlineDate = this.addDays(config.startDate, deadlineDay - 1);

  // 工数を考慮して開始日を逆算
  const workdays = process.workdays || 1;
  const startDate = workdays <= 1 ? deadlineDate : this.addDays(deadlineDate, -(workdays - 1));
}
```

**例**:
- 工程の`fixedDeadline = 2`（2日目に完了）
- `workdays = 1` → 開始日も2日目
- `workdays = 3` → 開始日は0日目（2日目 - 2日）

#### 期間指定の処理

```javascript
if (process.periodSpecification && process.periodSpecification.includes('-')) {
  const [startDay, endDay] = process.periodSpecification.split('-').map(d => parseInt(d.trim()));
  const startDate = this.addDays(config.startDate, startDay - 1);
  const endDate = this.addDays(config.startDate, endDay - 1);
}
```

**例**: `periodSpecification = "26-27"` → 26日目〜27日目に実施

---

### Layer 2: カテゴリ同期実行

#### 処理内容
カテゴリ同期マスターに基づいて、同種工程を同日に配置

#### アルゴリズム

```javascript
processCategorySyncGroup(syncGroup, context, schedule) {
  // 1. カテゴリ同期グループから配置対象工程を抽出
  const validProcesses = syncGroup.processes.filter(p => !schedule[p]);

  // 2. 最適配置日の決定（制約統合アルゴリズム）
  const optimalDate = findOptimalDateForCategorySync(
    syncGroup.idealExecutionDay,
    validProcesses,
    loadConstraints,
    periodConstraints
  );

  // 3. 全工程を同日に配置
  validProcesses.forEach(processNo => {
    schedule[processNo] = {
      startDate: optimalDate,
      categorySync: syncGroup.categoryGroup,
      efficiencyBonus: syncGroup.efficiencyBonus,
      reason: `カテゴリ同期配置: ${syncGroup.categoryGroup}`
    };
  });
}
```

#### 最適配置日の決定（統合制約充足）

```javascript
findOptimalDateForCategorySync(idealDay, validProcesses, config, loadConstraints, periodConstraints) {
  const baseDate = this.addDays(config.startDate, idealDay - 1);

  // 候補日の範囲（理想日±7日）
  const candidateDates = [];
  for (let offset = -7; offset <= 7; offset++) {
    candidateDates.push(this.addDays(baseDate, offset));
  }

  // 各候補日をスコア化
  let bestDate = null;
  let bestScore = -1;

  candidateDates.forEach(candidateDate => {
    const score = evaluateDateForCategorySync(candidateDate, validProcesses, ...);
    if (score > bestScore) {
      bestScore = score;
      bestDate = candidateDate;
    }
  });

  return bestDate;
}
```

#### スコア評価の詳細

```javascript
evaluateDateForCategorySync(candidateDate, validProcesses, config, loadConstraints, periodConstraints) {
  let score = 100; // 基準スコア

  // 1. 休日制約チェック（土日は大幅減点）
  const dayOfWeek = candidateDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    score -= 80;
  }

  // 2. 期間制約チェック
  const periodViolations = checkPeriodConstraints(dayFromStart, validProcesses, periodConstraints);
  score -= periodViolations * 30;

  // 3. 負荷制約チェック
  const loadViolations = checkLoadConstraints(candidateDate, validProcesses, loadConstraints);
  score -= loadViolations * 20;

  // 4. 親和性ボーナス（同カテゴリ工程が既に配置されている日は加点）
  const affinityBonus = calculateAffinityBonus(candidateDate, validProcesses);
  score += affinityBonus * 10;

  return Math.max(0, score);
}
```

**スコア計算の重み**:
- 休日違反: -80点
- 期間制約違反: -30点 × 違反数
- 負荷制約違反: -20点 × 違反数
- 親和性ボーナス: +10点 × 親和性

#### 未配置工程の補完配置

```javascript
processRemainingProcessesByCategory(context, schedule) {
  // 未配置工程を作業カテゴリ別に分類
  const unplacedByCategory = {};
  Object.values(processes).forEach(process => {
    if (!schedule[process.processNo]) {
      const category = process.workCategory || 'その他';
      unplacedByCategory[category].push(process);
    }
  });

  // カテゴリ別に最適期間で配置
  Object.entries(unplacedByCategory).forEach(([category, categoryProcesses]) => {
    const optimalPeriod = findOptimalPeriodForCategory(category, periodConstraints);
    placeCategoryProcessesInPeriod(categoryProcesses, optimalPeriod, config, schedule);
  });
}
```

---

### Layer 3: 負荷分散制御

#### 重要な変更点

**元のコード（ハードコード）**:
```javascript
// ❌ 削除された：ハードコード配置ロジック
const heavyPageProcesses = ['A-12', 'K-5', 'L-8', 'M-8'];
```

**修正後のコード**:
```javascript
solveLayer3_LoadBalancing(context, schedule) {
  // Layer3: 全てのハードコード配置ロジックを削除
  // カテゴリ同期マスターに完全委譲 - 必要な配置はLayer2で処理される
  return schedule;
}
```

**理由**: Layer2のカテゴリ同期マスターで全て処理するため、Layer3は空実装

---

### Layer 4: 依存関係処理

#### 処理内容
既に配置済みの工程に対して、依存関係の逆算制約をチェック・修正

#### アルゴリズム

```javascript
solveLayer4_Dependencies(context, schedule) {
  Object.keys(schedule).forEach(processNo => {
    const deps = dependencies[processNo] || [];
    const currentProcessStart = schedule[processNo].startDate;

    deps.forEach(dep => {
      if (schedule[dep.prerequisite]) {
        const prereqEnd = schedule[dep.prerequisite].endDate;
        let violated = false;
        let newPrereqEnd = null;

        if (dep.type === '開始前') {
          // 前工程は後工程開始日より前に完了必要
          if (prereqEnd >= currentProcessStart) {
            violated = true;
            newPrereqEnd = this.addDays(currentProcessStart, -1);
          }
        } else if (dep.type === '同日可') {
          // 前工程は後工程開始日と同日まで可
          if (prereqEnd > currentProcessStart) {
            violated = true;
            newPrereqEnd = currentProcessStart;
          }
        } else if (dep.type.includes('日より前')) {
          // N日より前制約
          const days = parseInt(dep.type.replace('日より前', ''));
          const requiredEnd = this.addDays(currentProcessStart, -days);
          if (prereqEnd > requiredEnd) {
            violated = true;
            newPrereqEnd = requiredEnd;
          }
        }

        // 制約違反があれば前工程を修正
        if (violated && newPrereqEnd) {
          const workdays = prereqProcess.workdays || 1;
          const newPrereqStart = workdays <= 1 ? newPrereqEnd :
                                 this.addDays(newPrereqEnd, -(workdays - 1));

          schedule[dep.prerequisite].startDate = newPrereqStart;
          schedule[dep.prerequisite].endDate = newPrereqEnd;
        }
      }
    });
  });
}
```

#### 依存タイプの処理

| 依存タイプ | ルール | 例 |
|-----------|--------|-----|
| `開始前` | 前工程完了日 < 後工程開始日 | A-3完了後にA-4開始 |
| `同日可` | 前工程完了日 ≤ 後工程開始日 | A-4完了と同日にA-5開始可 |
| `N日より前` | 前工程完了日 ≤ 後工程開始日 - N日 | 7日より前に完了必要 |

---

### Layer 5: フィードバックループ管理

#### 処理内容
確認送付工程をZ-1から逆算配置

#### ハードコード: 確認送付工程リスト

```javascript
const confirmProcesses = [
  'A-14', 'A-15', 'K-7', 'L-10', 'M-10',
  'H-9', 'I-9', 'C-8', 'E-4', 'P-4'
];
```

#### 逆算ロジック

```javascript
solveLayer5_FeedbackLoop(context, schedule) {
  // Z-1を探す
  let z1Date = null;
  if (schedule['Z-1']) {
    z1Date = schedule['Z-1'].startDate;
  } else {
    z1Date = this.addDays(config.startDate, 24); // デフォルト: 25日目
  }

  // 確認送付をZ-1の7日前に配置
  const confirmDate = this.addDays(z1Date, -7);

  confirmProcesses.forEach(processNo => {
    if (context.processes[processNo] && !schedule[processNo]) {
      schedule[processNo] = this.createScheduleItem(
        processNo, process, confirmDate, confirmDate, 5
      );
      schedule[processNo].backwardPlacement = true;
      schedule[processNo].reason = `Z-1の7日前に逆算配置`;
    }
  });
}
```

**重要**: Z-1の7日前という配置は**ハードコード**

---

### Layer 6: 最終収束制御

#### 処理内容
1. **絶対締切**（28〜30日目）の配置
2. **相対締切**（25〜27日目）の配置
3. **B-1のZ-1からの逆算配置**

#### ハードコード: 絶対締切

```javascript
const absoluteDeadlines = {
  'Z-5': { day: 30, name: '入稿日' },      // 30日目（絶対）
  'Z-4': { day: 29, name: '予備日' },      // 29日目（絶対）
  'Z-3': { day: 28, name: '校了日' },      // 28日目（絶対）
};
```

**特徴**: 28〜30日目は**変更不可**の絶対締切

#### ハードコード: 相対締切

```javascript
const relativeDeadlines = {
  'Z-2': { day: 26, name: '最終チェック', duration: 2 }, // 26-27日目
  'Z-1': { day: 25, name: '全ページ完成' } // 25日目
};
```

#### B-1の逆算配置

```javascript
// B-1をZ-1から逆算して配置
if (processes['B-1']) {
  let z1Date = schedule['Z-1'] ? schedule['Z-1'].startDate :
               this.addDays(config.startDate, 24); // デフォルト: 25日目

  // B-1をZ-1の7日前に配置
  const b1StartDate = this.addDays(z1Date, -7);

  schedule['B-1'] = this.createScheduleItem('B-1', processes['B-1'], b1StartDate, b1StartDate, 6);
  schedule['B-1'].backwardPlacement = true;
  schedule['B-1'].reason = `Z-1の7日前に逆算配置`;

  // B-2をB-1の翌日に配置
  if (processes['B-2'] && !schedule['B-2']) {
    const b2StartDate = this.addDays(b1StartDate, 1);
    schedule['B-2'] = this.createScheduleItem('B-2', processes['B-2'], b2StartDate, b2StartDate, 6);
    schedule['B-2'].reason = `B-1の翌日に逆算配置`;
  }
}
```

**重要な逆算ルール**:
- Z-1 = 25日目（デフォルト）
- B-1 = Z-1 - 7日 = 18日目
- B-2 = B-1 + 1日 = 19日目

---

### Layer 7: 次月号初期作業の並行配置

#### 処理内容
回答待ち期間（B-1終了後〜27日目）に次月号の準備工程を配置

#### ハードコード: 次月号初期作業リスト

```javascript
const nextMonthInitialTasks = [
  'S-1', 'S-2', 'A-1', 'K-1', 'L-1', 'L-2', 'L-3',
  'M-1', 'M-2', 'M-3', 'H-1', 'I-1', 'C-1', 'C-3'
];
```

#### 配置ロジック

```javascript
solveLayer7_NextMonthInitialTasks(context, schedule) {
  const b1Schedule = schedule['B-1'];
  if (!b1Schedule) {
    Logger.log('❌ B-1が見つからないため、次月号初期作業をスキップ');
    return schedule;
  }

  // 回答待ち期間の設定
  const waitingPeriodStart = this.addDays(b1Schedule.endDate, 1); // B-1の翌日
  const waitingPeriodEnd = this.addDays(config.startDate, 26);    // 27日目

  // 次月号工程を配置
  nextMonthInitialTasks.forEach((processNo, index) => {
    if (processes[processNo]) {
      const process = processes[processNo];
      const offsetDays = Math.floor(index * 0.5); // 0.5日刻みでずらす
      const startDate = this.addDays(waitingPeriodStart, offsetDays);
      const endDate = process.workdays <= 1 ? startDate :
                      this.addDays(startDate, process.workdays - 1);

      if (startDate <= waitingPeriodEnd) {
        const nextMonthKey = `NEXT_${processNo}`;
        schedule[nextMonthKey] = {
          processNo: processNo,
          name: `【12月号】${process.name}`,
          assignee: process.assignee,
          startDate: startDate,
          endDate: endDate,
          workdays: process.workdays,
          workCategory: '次月号準備',
          layer: 7,
          isNextMonth: true,
          reason: `次月号初期作業: ${this.getDayNumber(startDate, config)}日目配置`
        };
      }
    }
  });
}
```

#### 次月号工程の識別方法

| 属性 | 値 | 説明 |
|------|-----|------|
| **スケジュールキー** | `NEXT_${工程No}` | 例: `NEXT_S-1` |
| **name** | `【12月号】工程名` | 月号を明記 |
| **workCategory** | `次月号準備` | 固定値 |
| **layer** | `7` | Layer 7専用 |
| **isNextMonth** | `true` | 次月号フラグ |

#### 配置タイミングの計算

**例**: B-1が18日目の場合
- 回答待ち期間開始: 19日目（B-1 + 1日）
- 回答待ち期間終了: 27日目（固定）
- 配置可能期間: 19〜27日目（9日間）

**配置スケジュール**:
```
index 0: S-1  → 19日目（開始 + 0 * 0.5 = 0日）
index 1: S-2  → 19日目（開始 + 1 * 0.5 = 0.5日 → 切り捨て0日）
index 2: A-1  → 20日目（開始 + 2 * 0.5 = 1日）
index 3: K-1  → 20日目（開始 + 3 * 0.5 = 1.5日 → 切り捨て1日）
index 4: L-1  → 21日目（開始 + 4 * 0.5 = 2日）
...
```

---

## ハードコード箇所の完全リスト

### Layer 1: 固定要素配置

| 対象 | ハードコード内容 | 値 |
|------|----------------|-----|
| データ提出工程 | 工程No → 実施日のマッピング | A-2:1日目, K-2:2日目, L-4:2日目, M-4:2日目, H-2:2日目, I-2:2日目, C-4:2日目 |

### Layer 5: フィードバックループ

| 対象 | ハードコード内容 | 値 |
|------|----------------|-----|
| 確認送付工程リスト | 工程No配列 | ['A-14', 'A-15', 'K-7', 'L-10', 'M-10', 'H-9', 'I-9', 'C-8', 'E-4', 'P-4'] |
| Z-1からの逆算日数 | 日数 | 7日前 |
| Z-1デフォルト日 | 日数 | 25日目 |

### Layer 6: 最終収束制御

| 対象 | ハードコード内容 | 値 |
|------|----------------|-----|
| 絶対締切 | Z-5 | 30日目 |
| 絶対締切 | Z-4 | 29日目 |
| 絶対締切 | Z-3 | 28日目 |
| 相対締切 | Z-2 | 26-27日目（2日間） |
| 相対締切 | Z-1 | 25日目 |
| B-1逆算 | Z-1からの日数 | 7日前 |
| B-2逆算 | B-1からの日数 | 1日後 |

### Layer 7: 次月号準備

| 対象 | ハードコード内容 | 値 |
|------|----------------|-----|
| 次月号工程リスト | 工程No配列 | ['S-1', 'S-2', 'A-1', 'K-1', 'L-1', 'L-2', 'L-3', 'M-1', 'M-2', 'M-3', 'H-1', 'I-1', 'C-1', 'C-3'] |
| 配置開始 | B-1からの日数 | 1日後 |
| 配置終了 | 固定日数 | 27日目 |
| 配置間隔 | index刻み | index * 0.5日 |
| 次月号キー接頭辞 | 文字列 | `NEXT_` |
| 月号表示 | 文字列 | `【12月号】` |
| workCategory | 文字列 | `次月号準備` |

---

## 逆算計算ロジック

### 基本原則

1. **発行日（endDate）を起点**に逆算
2. **確定締切優先** → **依存関係** → **カテゴリ同期** → **負荷分散**の順
3. **Layer番号が大きいほど優先度高**（後から上書き可能）

### 日付計算の仕組み

#### 日数→日付変換

```javascript
addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

**重要**:
- 1日目 = `startDate + 0日`（0-indexed）
- 30日目 = `startDate + 29日`

#### 工数を考慮した開始日計算

```javascript
// 工数1日の場合
startDate = endDate;

// 工数N日の場合
startDate = addDays(endDate, -(workdays - 1));
```

**例**:
- 終了日: 10日目、工数: 3日 → 開始日: 8日目（10 - 2）

### 逆算の優先順位

```
高 ← Layer 6（絶対締切）
    ← Layer 5（フィードバック）
    ← Layer 4（依存関係）
    ← Layer 2（カテゴリ同期）
    ← Layer 1（固定要素）
低
```

### 制約違反時の調整

#### 依存関係違反（Layer 4）

```
後工程: A-4（10日目開始）
前工程: A-3（10日目完了）← 違反！

→ A-3を9日目完了に前倒し
```

#### 負荷制約違反（Layer 2）

```
制作陣の最大同時実行数: 3
10日目に配置予定: 5工程 ← 違反！

→ 一部工程を11日目に移動
```

---

## 次月号準備の仕組み

### 概要

**目的**: 今月号の回答待ち期間（B-1〜Z-2）に次月号の準備作業を並行実行

### データ構造

#### スケジュールへの格納方法

```javascript
// 今月号工程
schedule['A-3'] = {
  processNo: 'A-3',
  name: 'メイン文字起こし',
  startDate: Date(...),
  endDate: Date(...),
  layer: 2,
  isNextMonth: false
};

// 次月号工程（キーに接頭辞 NEXT_）
schedule['NEXT_S-1'] = {
  processNo: 'S-1',
  name: '【12月号】ゆめマガ12月号企画決定',
  startDate: Date(...),
  endDate: Date(...),
  workCategory: '次月号準備',
  layer: 7,
  isNextMonth: true
};
```

### ガントチャートへの表示

#### 2段構成

```
=============================
| 今月号工程（30日間）       |
| A-3, K-3, L-5, ...        |
| ...                       |
| Z-1, Z-2, Z-3, Z-4, Z-5   |
=============================
| 【12月号】次月号準備       |
| S-1, S-2, A-1, K-1, ...   |
=============================
```

#### 表示ロジック（修正版GAS）

```javascript
// 次月号エリアの追加
row += 1; // 空行
const nextMonthLabel = `${nextMonthNumber}月号`;
ganttSheet.getRange(row, 1).setValue(nextMonthLabel)
  .setBackground('#34495e')
  .setFontColor('#ffffff');

row++;

// 次月号工程を表示
nextMonthProcesses.forEach(item => {
  const { scheduleItem } = item;

  ganttSheet.getRange(row, 1).setValue(`${scheduleItem.processNo} ${scheduleItem.name}`);
  ganttSheet.getRange(row, 2).setValue(nextMonthLabel);
  ganttSheet.getRange(row, 3).setValue(scheduleItem.workCategory);

  const startDay = Math.ceil((scheduleItem.startDate - mainPeriodStart) / (1000 * 60 * 60 * 24)) + 1;
  ganttSheet.getRange(row, 4).setValue(`${startDay}日目開始予定`);

  // 日付列の描画（30日間範囲内のみ）
  // ...

  row++;
});
```

### 進捗入力シートへの保存

#### データ例

```
月号          | 工程No | 工程名                     | 作業カテゴリ | 逆算予定日 | ...
-------------|--------|---------------------------|------------|----------|
2025年11月号 | A-3    | メイン文字起こし           | 文字起こし  | 9/29     |
2025年11月号 | Z-1    | 全ページ完成              | 最終収束    | 10/15    |
2025年12月号 | S-1    | ゆめマガ12月号企画決定     | 次月号準備  | 10/8     |
2025年12月号 | S-2    | ゆめマガ12月号企画書作成   | 次月号準備  | 10/8     |
2025年12月号 | A-1    | メインインタビュー実施日報告| 次月号準備  | 10/9     |
```

**重要**:
- 月号列で区別（`2025年12月号`）
- 作業カテゴリ = `次月号準備`
- 逆算予定日 = Layer 7で計算された日付

---

## 制約充足アルゴリズム

### スコアベース最適化

#### 評価関数

```
総合スコア = 基準スコア(100)
           - 休日違反(-80)
           - 期間制約違反(-30 × 違反数)
           - 負荷制約違反(-20 × 違反数)
           + 親和性ボーナス(+10 × 親和性)
```

#### 候補日の探索範囲

```javascript
// 理想日±7日の範囲で探索
for (let offset = -7; offset <= 7; offset++) {
  candidateDates.push(this.addDays(baseDate, offset));
}
```

### 制約の種類

#### 1. 休日制約

```javascript
const dayOfWeek = candidateDate.getDay();
if (dayOfWeek === 0 || dayOfWeek === 6) { // 日曜=0, 土曜=6
  score -= 80;
}
```

#### 2. 期間制約

```javascript
checkPeriodConstraints(dayFromStart, validProcesses, periodConstraints) {
  let violations = 0;

  Object.values(periodConstraints).forEach(constraint => {
    if (dayFromStart >= constraint.startDay && dayFromStart <= constraint.endDay) {
      const prohibitedCategories = constraint.prohibitedCategories || [];

      validProcesses.forEach(({ workCategory }) => {
        if (prohibitedCategories.includes(workCategory)) {
          violations++;
        }
      });
    }
  });

  return violations;
}
```

**例**: 14〜20日目は新規案件禁止

#### 3. 負荷制約

```javascript
checkLoadConstraints(candidateDate, validProcesses, loadConstraints) {
  let violations = 0;

  const productionProcesses = validProcesses.filter(p => p.assignee === '制作陣');

  Object.values(loadConstraints).forEach(constraint => {
    if (constraint.assignee === '制作陣') {
      if (productionProcesses.length > constraint.maxConcurrent) {
        violations += productionProcesses.length - constraint.maxConcurrent;
      }
    }
  });

  return violations;
}
```

**例**: 制作陣の最大同時実行数 = 3

#### 4. 親和性ボーナス

```javascript
calculateAffinityBonus(candidateDate, validProcesses) {
  const categories = new Set(validProcesses.map(p => p.workCategory));
  return categories.size <= 2 ? categories.size : 0;
}
```

**ルール**: 2カテゴリ以下なら親和性あり

---

## データフロー

### 入力データ

```
【設定マスター】
├── 対象年: 2025
├── 対象月号: 11
├── 開始日: 21
├── 締切日: 20
├── 計算開始日: 2025/09/21
└── 計算終了日: 2025/11/20

【新工程マスター】
├── 工程No
├── 工程名
├── 工数
├── 担当区分
└── 優先度

【拡張工程マスター】
├── 実工数_人日
├── カテゴリグループ
├── 同時実行上限
├── 理想パターン
└── 負荷重み

【新依存関係マスター】
├── 工程No
├── 前提工程
├── 依存タイプ
└── 日数

【カテゴリ同期マスター】
├── カテゴリグループ
├── 同期工程配列
├── 理想実行日
├── 同期優先度
└── 効率ボーナス

【負荷制約マスター】
├── 担当者
├── 最大同時実行数
├── 最大負荷_人日
├── 制限カテゴリ
└── 適用期間

【期間制約マスター】
├── 期間名
├── 開始日
├── 終了日
├── 許可カテゴリ
└── 禁止カテゴリ
```

### 処理フロー

```
1. マスターデータ読み取り
   ↓
2. IdealScheduler.calculate()
   ├── Layer 1: 固定要素配置
   ├── Layer 2: カテゴリ同期
   ├── Layer 3: 負荷分散（空実装）
   ├── Layer 4: 依存関係
   ├── Layer 5: フィードバック
   ├── Layer 6: 最終収束
   └── Layer 7: 次月号準備
   ↓
3. 理想形一致度検証
   ↓
4. ガントチャート生成
   ├── 今月号エリア（30日間）
   └── 次月号エリア
   ↓
5. スプレッドシートに出力
```

### 出力データ

```
【理想形_ガント_○月号】シート
├── ヘッダー行
│   ├── 工程
│   ├── レイヤー
│   ├── 一致度
│   ├── カテゴリ
│   └── 日付列（30日分）
│
├── 今月号工程（工程順）
│   ├── A-2, A-3, A-4, ...
│   ├── K-2, K-3, K-4, ...
│   └── Z-1, Z-2, Z-3, Z-4, Z-5
│
└── 次月号準備エリア
    ├── セクション見出し「12月号」
    └── S-1, S-2, A-1, K-1, ...
```

---

## 重要な設計判断

### 1. Layer 3の空実装

**理由**: カテゴリ同期マスターで全て処理するため、ハードコードされた負荷分散ロジックは不要

### 2. Z-1のデフォルト値（25日目）

**理由**: Z-1が配置されていない場合でも、B-1とB-2を計算可能にするため

### 3. 次月号工程のキー接頭辞（NEXT_）

**理由**: 今月号と次月号の工程を区別し、同じ工程No（S-1など）の重複を回避

### 4. 0.5日刻みの配置間隔

**理由**: 14工程を9日間（19〜27日目）に分散配置するため

### 5. 絶対締切（28〜30日目）の不変性

**理由**: 校了・入稿は外部締切のため、どんな制約でも移動不可

---

## まとめ

### システムの強み

1. **階層的制約充足**による段階的最適化
2. **マスターデータ駆動**で柔軟な制約管理
3. **スコアベース評価**で最適解探索
4. **次月号並行作業**で効率化

### システムの制約

1. **ハードコード箇所**が多数存在
2. **60日間固定**のサイクル
3. **工程No依存**の処理が多い
4. **休日判定**が土日のみ（祝日未対応）

### 今後の改善余地

1. ハードコード箇所のマスター化
2. 可変サイクル期間への対応
3. 祝日・カレンダーマスター連携
4. リアルタイム制約チェック

---

**最終更新**: 2025-10-07
