// data/contract-workflow.ts
// 契約業務フロー 13ステップの詳細データ

import type { WorkflowStep, Milestone } from '@/types/workflow';

export const contractWorkflowSteps: WorkflowStep[] = [
  {
    stepNumber: 1,
    title: '情報収集',
    overview: '顧客に情報収集フォーマットを送信し、契約に必要な情報を収集します。',
    status: 'pending',
    actions: [
      '顧客に「契約書作成_情報収集フォーマット」を送信',
      '記入してもらう'
    ],
    checklist: [
      { id: 's1-c1', text: '企業名は正式名称か', checked: false },
      { id: 's1-c2', text: '住所は「番地」「号」まで記載されているか', checked: false },
      { id: 's1-c3', text: '代表者役職が記入されているか', checked: false },
      { id: 's1-c4', text: '支払期限が記載されているか', checked: false }
    ],
    guides: [
      {
        id: 's1-g1',
        label: '情報収集フォーマットを開く',
        type: 'modal',
        target: 'information-form',
        icon: '📋'
      }
    ]
  },
  {
    stepNumber: 2,
    title: '基本契約書作成',
    overview: 'Google Docsの原本をコピーして、顧客情報を入力し基本契約書を作成します。',
    status: 'pending',
    actions: [
      '原本をコピー',
      '冒頭の企業名を修正: 【甲の会社名・団体名】 → 株式会社〇〇〇',
      '下部の顧客情報を更新:<ul><li>契約締結日</li><li>住所</li><li>企業名</li><li>代表者名</li></ul>'
    ],
    checklist: [
      { id: 's2-c1', text: '企業名が正しく修正されているか', checked: false },
      { id: 's2-c2', text: '住所が正しく入力されているか', checked: false },
      { id: 's2-c3', text: '代表者名が正しく入力されているか', checked: false },
      { id: 's2-c4', text: '契約締結日が正しいか', checked: false }
    ],
    guides: [
      {
        id: 's2-g1',
        label: '原本を開く',
        type: 'external',
        target: 'https://docs.google.com/document/d/1B_GK3cknmtgGgpKVjKUerOOgQ7RgQcwwdLMBy12gBDo/edit?tab=t.0',
        icon: '🔗'
      }
    ],
    sourceUrl: 'https://docs.google.com/document/d/1B_GK3cknmtgGgpKVjKUerOOgQ7RgQcwwdLMBy12gBDo/edit?tab=t.0',
    notes: [
      '原本をコピーして作成してください',
      '【甲の会社名・団体名】等のプレースホルダーを置換してください'
    ]
  },
  {
    stepNumber: 3,
    title: '基本契約書の押印・送信',
    overview: 'マネーフォワードで押印位置を配置し、株式会社ゆめスタが押印して顧客に送信します。',
    status: 'pending',
    actions: [
      '押印位置を配置（顧客の「印」マーク、ゆめスタの「印」マーク）',
      '株式会社ゆめスタが押印',
      '顧客情報を入力（送信先メールアドレス、件名）',
      '送信'
    ],
    checklist: [
      { id: 's3-c1', text: '押印位置が正しく配置されているか', checked: false },
      { id: 's3-c2', text: 'ゆめスタが押印したか', checked: false },
      { id: 's3-c3', text: '送信先メールアドレスが正しいか', checked: false },
      { id: 's3-c4', text: '基本契約書送付「有」を確認したか', checked: false }
    ],
    guides: [
      {
        id: 's3-g1',
        label: 'マネーフォワードを開く',
        type: 'external',
        target: 'https://biz.moneyforward.com/',
        icon: '🔗'
      }
    ],
    notes: [
      '基本契約書の送付が「有」の場合のみ実施',
      '既存顧客（送付「無」）の場合はスキップ'
    ]
  },
  {
    stepNumber: 4,
    title: '申込書兼個別契約書作成',
    overview: 'Google Spreadsheetsの原本をコピーして、顧客情報と契約内容を入力し申込書を作成します。',
    status: 'pending',
    actions: [
      '<strong>ページ1: 申込書</strong><ul><li>申込日</li><li>顧客情報（企業名、代表者名、住所、電話、メール）</li><li>契約料金（税別）</li><li>自動更新後の月額料金（税別）</li><li>掲載期間（開始・終了月号）</li><li>広告仕様（サイズ、位置、デザイン）</li><li>商品内容・数量</li><li>お振込先（ゆうちょ銀行の情報）</li></ul>',
      '<strong>ページ2: 契約条件</strong><ul><li>修正不要（テンプレートのまま）</li></ul>',
      '<strong>ページ3: 重要事項説明</strong><ul><li>契約成立欄の顧客情報（住所、電話、企業名）</li><li>署名欄の日付</li><li>署名欄の企業名</li></ul>'
    ],
    checklist: [
      { id: 's4-c1', text: 'ページ1: 申込日が正しいか', checked: false },
      { id: 's4-c2', text: 'ページ1: 顧客情報がすべて正しく入力されているか', checked: false },
      { id: 's4-c3', text: 'ページ1: 契約料金が税別で記入されているか', checked: false },
      { id: 's4-c4', text: 'ページ1: 掲載期間が12ヶ月になっているか', checked: false },
      { id: 's4-c5', text: 'ページ3: 契約成立欄の顧客情報が正しいか', checked: false },
      { id: 's4-c6', text: 'ページ3: 署名欄の日付が正しいか', checked: false }
    ],
    guides: [
      {
        id: 's4-g1',
        label: '原本を開く',
        type: 'external',
        target: 'https://docs.google.com/spreadsheets/d/1sZWfMEwSBRyYD-j8qRAGwBLc2dO2B1b78r1B58GENIo/edit?gid=507376988#gid=507376988',
        icon: '🔗'
      }
    ],
    sourceUrl: 'https://docs.google.com/spreadsheets/d/1sZWfMEwSBRyYD-j8qRAGwBLc2dO2B1b78r1B58GENIo/edit?gid=507376988#gid=507376988',
    notes: [
      '原本をコピーして作成してください',
      '契約料金は必ず税別で記入してください'
    ]
  },
  {
    stepNumber: 5,
    title: '申込書の押印・送信',
    overview: 'マネーフォワードで押印位置を配置し、株式会社ゆめスタが押印して顧客に送信します。送信完了後、重要事項説明のご案内メールを送付します。',
    status: 'pending',
    actions: [
      '押印位置を配置（ページ1の契約成立箇所、承諾箇所、ページ3の署名欄）',
      '株式会社ゆめスタが押印',
      '送信',
      '送信完了メールを送る'
    ],
    checklist: [
      { id: 's5-c1', text: '押印位置が正しく配置されているか', checked: false },
      { id: 's5-c2', text: 'ゆめスタが押印したか', checked: false },
      { id: 's5-c3', text: 'マネーフォワードから送信したか', checked: false },
      { id: 's5-c4', text: '送信完了メールを送ったか', checked: false }
    ],
    guides: [
      {
        id: 's5-g1',
        label: 'メール例文を開く',
        type: 'modal',
        target: 'contract-send-complete',
        icon: '📧'
      },
      {
        id: 's5-g2',
        label: 'マネーフォワードを開く',
        type: 'external',
        target: 'https://biz.moneyforward.com/',
        icon: '🔗'
      }
    ]
  },
  {
    stepNumber: 6,
    title: '重要事項説明（推奨・任意）',
    overview: 'オンライン面談で契約内容を丁寧に説明し、顧客との信頼関係を構築します。',
    status: 'pending',
    actions: [
      '顧客から3候補の日時をもらう',
      'オンライン面談（Zoom、Google Meet等）で実施',
      '重要事項説明を実施（15〜20分程度）:<ul><li>契約期間・自動更新について</li><li>中途解約・返金について</li><li>原稿提出・掲載開始のタイミング</li><li>その他、重要事項説明書の内容</li></ul>',
      '顧客の質問対応'
    ],
    checklist: [
      { id: 's6-c1', text: '日程調整が完了したか', checked: false },
      { id: 's6-c2', text: 'オンライン面談を実施したか', checked: false },
      { id: 's6-c3', text: '契約期間・自動更新について説明したか', checked: false },
      { id: 's6-c4', text: '中途解約・返金について説明したか', checked: false },
      { id: 's6-c5', text: '原稿提出・掲載開始について説明したか', checked: false },
      { id: 's6-c6', text: '顧客の質問に回答したか', checked: false }
    ],
    guides: [],
    notes: [
      '弊社としては積極的に実施したい',
      '顧客から明確に不要の意思表示があった場合のみスキップ'
    ]
  },
  {
    stepNumber: 7,
    title: '契約完了確認',
    overview: 'マネーフォワードで契約完了を確認し、顧客が押印したことを確認します。',
    status: 'pending',
    actions: [
      'マネーフォワードで契約完了を確認',
      '顧客が押印したか確認'
    ],
    checklist: [
      { id: 's7-c1', text: 'マネーフォワードで契約完了になっているか', checked: false },
      { id: 's7-c2', text: '顧客が押印しているか', checked: false },
      { id: 's7-c3', text: '基本契約書と申込書の両方が完了しているか', checked: false }
    ],
    guides: [
      {
        id: 's7-g1',
        label: 'マネーフォワードを開く',
        type: 'external',
        target: 'https://biz.moneyforward.com/',
        icon: '🔗'
      }
    ]
  },
  {
    stepNumber: 8,
    title: '請求書作成・送付',
    overview: 'マネーフォワードで請求書を作成し、顧客に送付します。',
    status: 'pending',
    actions: [
      '請求書作成:<ul><li>件名: 広告掲載費</li><li>品目: ゆめスタマガジン掲載について</li><li>単価（税別）: 情報収集フォーマットの金額</li><li>数量: 1</li><li>単位: 式</li><li>支払期限: 情報収集フォーマットの支払期限</li></ul>',
      '顧客にメール送信'
    ],
    checklist: [
      { id: 's8-c1', text: '請求書の件名が正しいか', checked: false },
      { id: 's8-c2', text: '単価が税別で記入されているか', checked: false },
      { id: 's8-c3', text: '支払期限が正しいか', checked: false },
      { id: 's8-c4', text: '顧客に送信したか', checked: false }
    ],
    guides: [
      {
        id: 's8-g1',
        label: 'マネーフォワードを開く',
        type: 'external',
        target: 'https://biz.moneyforward.com/',
        icon: '🔗'
      }
    ]
  },
  {
    stepNumber: 9,
    title: '入金確認',
    overview: 'ゆうちょ銀行の口座を確認し、入金を確認します。',
    status: 'pending',
    actions: [
      'ゆうちょ銀行の口座を確認',
      '入金を確認'
    ],
    checklist: [
      { id: 's9-c1', text: 'ゆうちょダイレクトで確認したか', checked: false },
      { id: 's9-c2', text: '入金額が正しいか', checked: false },
      { id: 's9-c3', text: '入金日を記録したか', checked: false }
    ],
    guides: []
  },
  {
    stepNumber: 10,
    title: '入金管理シート更新',
    overview: '入金管理シートを開き、入金情報を記入します。',
    status: 'pending',
    actions: [
      '入金管理シートを開く',
      '以下を記入:<ul><li>顧客名</li><li>入金日</li><li>入金額</li><li>掲載期間</li></ul>'
    ],
    checklist: [
      { id: 's10-c1', text: '顧客名が正しく記入されているか', checked: false },
      { id: 's10-c2', text: '入金日が正しく記入されているか', checked: false },
      { id: 's10-c3', text: '入金額が正しく記入されているか', checked: false },
      { id: 's10-c4', text: '掲載期間が正しく記入されているか', checked: false }
    ],
    guides: []
  },
  {
    stepNumber: 11,
    title: '入金確認連絡・原稿依頼',
    overview: '入金確認メールを送信し、原稿情報フォームを送付します。',
    status: 'pending',
    actions: [
      '入金確認メールを送信',
      '原稿情報フォームを送付（提出期限: 7日以内）'
    ],
    checklist: [
      { id: 's11-c1', text: '入金確認メールを送ったか', checked: false },
      { id: 's11-c2', text: '原稿情報フォームを送ったか', checked: false },
      { id: 's11-c3', text: '提出期限（7日以内）を伝えたか', checked: false },
      { id: 's11-c4', text: '初稿提出期限（翌月7日）を伝えたか', checked: false }
    ],
    guides: [
      {
        id: 's11-g1',
        label: 'メール例文を開く',
        type: 'modal',
        target: 'payment-confirm',
        icon: '📧'
      }
    ],
    notes: [
      '入金確認月の翌月7日が初稿提出期限',
      '掲載開始は入金確認月の翌々月号'
    ]
  },
  {
    stepNumber: 12,
    title: '制作・校正',
    overview: '制作陣に通知し、制作開始。完成後、即日校正用原稿を顧客に送付します。',
    status: 'pending',
    actions: [
      '制作陣に通知（入金確認、原稿情報共有）',
      '制作開始',
      '制作完了後、即日校正用原稿を顧客に送付',
      '校正依頼メールを送信'
    ],
    checklist: [
      { id: 's12-c1', text: '制作陣に通知したか', checked: false },
      { id: 's12-c2', text: '原稿情報を共有したか', checked: false },
      { id: 's12-c3', text: '校正用原稿を送付したか', checked: false },
      { id: 's12-c4', text: '校正依頼メールを送ったか', checked: false },
      { id: 's12-c5', text: '修正期限を伝えたか', checked: false }
    ],
    guides: [
      {
        id: 's12-g1',
        label: 'メール例文を開く',
        type: 'modal',
        target: 'proofreading-request',
        icon: '📧'
      }
    ]
  },
  {
    stepNumber: 13,
    title: '掲載',
    overview: '顧客から確認OKをもらい、掲載します。掲載完了後、報告メールを送付します。',
    status: 'pending',
    actions: [
      '顧客から確認OKをもらう',
      '修正がある場合は対応',
      '修正完了後、再度確認',
      '確定した原稿を掲載',
      '掲載完了メールを送る'
    ],
    checklist: [
      { id: 's13-c1', text: '顧客から確認OKをもらったか', checked: false },
      { id: 's13-c2', text: '修正対応が完了したか（修正がある場合）', checked: false },
      { id: 's13-c3', text: '原稿を掲載したか', checked: false },
      { id: 's13-c4', text: '掲載完了メールを送ったか', checked: false }
    ],
    guides: [
      {
        id: 's13-g1',
        label: 'メール例文を開く',
        type: 'modal',
        target: 'publication-complete',
        icon: '📧'
      }
    ]
  }
];

export const milestones: Milestone[] = [
  { stepNumber: 1, label: '情報' },
  { stepNumber: 3, label: '契約' },
  { stepNumber: 7, label: '完了' },
  { stepNumber: 9, label: '入金' },
  { stepNumber: 13, label: '掲載' }
];
