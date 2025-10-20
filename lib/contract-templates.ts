/**
 * 契約種別別のテンプレートURL定義
 *
 * 契約種別（D列の値）に応じて、適切な契約書・申込書テンプレートを返す
 */

export type ContractService =
  | 'ゆめマガ'
  | 'ゆめスタパートナー'
  | 'ゆめスタ認証'
  | 'HP制作'
  | 'ポートフォリオ制作';

export interface ContractTemplate {
  /** 基本契約書原本のURL */
  contract: string;
  /** 申込書兼個別契約書原本のURL */
  application: string;
}

export const CONTRACT_TEMPLATES: Record<ContractService, ContractTemplate> = {
  'ゆめマガ': {
    contract: 'https://docs.google.com/document/d/1B_GK3cknmtgGgpKVjKUerOOgQ7RgQcwwdLMBy12gBDo/edit?tab=t.0',
    application: 'https://docs.google.com/spreadsheets/d/1sZWfMEwSBRyYD-j8qRAGwBLc2dO2B1b78r1B58GENIo/edit?gid=507376988#gid=507376988',
  },
  'ゆめスタパートナー': {
    contract: 'https://drive.google.com/file/d/PLACEHOLDER_PARTNER_CONTRACT_URL/view',  // 仮URL（要更新）
    application: 'https://drive.google.com/file/d/PLACEHOLDER_PARTNER_APPLICATION_URL/view',  // 仮URL（要更新）
  },
  'ゆめスタ認証': {
    contract: 'https://drive.google.com/file/d/PLACEHOLDER_AUTH_CONTRACT_URL/view',  // 仮URL（要更新）
    application: 'https://drive.google.com/file/d/PLACEHOLDER_AUTH_APPLICATION_URL/view',  // 仮URL（要更新）
  },
  'HP制作': {
    contract: 'https://drive.google.com/file/d/PLACEHOLDER_HP_CONTRACT_URL/view',  // 仮URL（要更新）
    application: 'https://drive.google.com/file/d/PLACEHOLDER_HP_APPLICATION_URL/view',  // 仮URL（要更新）
  },
  'ポートフォリオ制作': {
    contract: 'https://drive.google.com/file/d/PLACEHOLDER_PORTFOLIO_CONTRACT_URL/view',  // 仮URL（要更新）
    application: 'https://drive.google.com/file/d/PLACEHOLDER_PORTFOLIO_APPLICATION_URL/view',  // 仮URL（要更新）
  },
};

/**
 * 契約種別に応じたテンプレートURLを取得
 * @param contractService - 契約種別（D列の値）
 * @returns テンプレートURL（契約書・申込書）
 */
export function getContractTemplateUrls(contractService: ContractService): ContractTemplate {
  return CONTRACT_TEMPLATES[contractService];
}

/**
 * 契約種別が有効かチェック
 * @param contractService - チェックする契約種別
 * @returns 有効な契約種別の場合true
 */
export function isValidContractService(contractService: string): contractService is ContractService {
  return contractService in CONTRACT_TEMPLATES;
}
