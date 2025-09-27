/**
 * 複数のページで共通して使用される定数
 */

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MIN_CLAMP_DAYS = 0;
const MAX_CLAMP_DAYS = 280;

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
  if (value < MIN_CLAMP_DAYS) {
    return MIN_CLAMP_DAYS;
  }

  if (value > MAX_CLAMP_DAYS) {
    return MAX_CLAMP_DAYS;
  }

  return value;
};

export const MILLISECONDS_PER_DAY =
  HOURS_PER_DAY *
  MINUTES_PER_HOUR *
  SECONDS_PER_MINUTE *
  MILLISECONDS_PER_SECOND;

export { MAX_CLAMP_DAYS };
