/**
 * 初期設定ページで使用される定数
 */

// 日付入力の制限値
export const DATE_LIMITS = {
  maxDate: "2029-12-31",
  minDate: "2000-01-01",
} as const;

export const ERROR_MESSAGES = {
  requiredDueDate: "出産予定日を入力してください。",
} as const;

// 可変の範囲エラー文言を生成（最小日は実行時に当日へ更新するため）
export const buildRangeError = (minIso: string, maxIso: string) =>
  `${minIso} から ${maxIso} の間で入力してください。`;
