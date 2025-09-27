/**
 * 複数のページで共通して使用される定数
 */

// 日付フォーマット関連
export const createDisplayDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "未設定";
  }

  return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日`;
};

// 数値制限関数
export const clampDays = (value: number) => {
  if (value < 0) {
    return 0;
  }

  if (value > 280) {
    return 280;
  }

  return value;
};
