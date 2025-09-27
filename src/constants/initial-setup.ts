/**
 * 初期設定ページで使用される定数
 */

export const descriptionParagraphs = [
  "出産予定日を登録すると、出産前後の1ヶ月間に必要なTODOや情報を受け取れます。",
  "登録した情報はお使いの端末にのみ保存されるので、安心してご利用ください。",
] as const;

// 日付入力の制限値
export const DATE_LIMITS = {
  maxDate: "2100-12-31",
  minDate: "2000-01-01",
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  requiredDueDate: "出産予定日を入力してください。",
} as const;
