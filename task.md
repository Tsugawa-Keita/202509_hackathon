# 改良点メモ

## initial-setup-page.tsx

### 目的

- 入力とカレンダー周辺をモバイル優先で整理し、a11yと操作性を担保しつつ実装コストを最小化する（ハッカソン前提: 速度最優先・フロントのみで完結）。
- フロントエンドで静的に保持（サーバ不要）。必要であれば `localStorage` に選択値を保存。

#### チェックリスト

##### P0

- [x] 入力と説明文の関連付け（`aria-describedby` は `form` ではなく該当 `input` に付与）。
- [x] モバイルは `type="date"` のネイティブピッカーを使用。デスクトップはカスタムカレンダーをポップアップ表示（単一フィールドから起動／同時常時表示はしない）カレンダー実装は既存実装を流用する（既存 `Calendar` を使用／新規実装しない）。
- [x] 最小日付は「今日（ローカル）」を採用し、`input[min]` とカレンダー側（`fromDate` 等）双方に適用。0時で自動更新。
- [x] `max` を適用する。値は `src/constants/initial-setup.ts` に記載済みのものを用い、`input[max]` とカレンダー（例: `toDate`）に反映する。
- [x] ラベルと入力は `htmlFor`/`id` で関連付け。ボタンは `type="submit"` 明記。エラーはフィールド直下に1箇所、`aria-live="polite"` を付与。

##### P1

- [x] 並び順/余白の統一（入力 → 注意文 → カレンダー起動 → 選択中表示 → エラー → 決定、`gap` 固定）。
- [x] 表示は日本語、内部値は ISO `yyyy-MM-dd` で統一（ロケール混在を回避）。
- [x] カレンダー側でも制約適用（無効日は選択不可・クリック不可に）。
- [x] エラーメッセージ定義を `src/constants/initial-setup.ts` に記載する。表示タイミングは「入力即時（onChange）」で反映する。

##### P2

- [ ] キーボード操作・SR向け補助（選択中の値をテキストでも提示）。
- [ ] `useCallback` 最適化や `fieldset+legend` 採用（任意）。
- [ ] タイムゾーンは追加検討不要（`type="date"` のローカル日付運用で確定）。

##### P3

- [ ] `src/pages/initial-setup-page.tsx` を状態保存と画面遷移のみに絞り、UI/検出/ユーティリティを分離する最小リファクタ実施。
- [ ] `src/features/initial-setup/components/DueDateSection.tsx` を新設し、ラベル・入力・カレンダー・エラー表示をまとめて委譲。
- [ ] `src/features/initial-setup/hooks/useCoarsePointer.ts` を切り出し、ポインター種別の判定ロジックを再利用可能にする。
- [ ] `src/features/initial-setup/utils/date.ts` に `getTodayIso` など日付ユーティリティを集約し、辞書順比較ルールを明示化。

#### 変更イメージ

```tsx
// 単一フィールド + モバイルはネイティブ、デスクトップはポップアップでカレンダー
import { useEffect, useMemo, useState } from "react";

type CalendarProps = {
  selected?: Date;
  onSelect: (d: Date) => void;
  fromDate: Date; // 最小日
};

// 既存カレンダー（shadcn/react-day-picker 等）に置き換え可
function Calendar({ selected, onSelect, fromDate }: CalendarProps) {
  // 簡易ダミー: 実装は既存カレンダーに差し替え
  return (
    <div
      role="dialog"
      aria-label="カレンダー"
      className="rounded border bg-white p-3 shadow"
    >
      <button
        type="button"
        onClick={() => onSelect(new Date(Date.now()))}
        className="px-2 py-1 border rounded"
      >
        今日を選択（{formatYYYYMMDD(Date.now())}）
      </button>
    </div>
  );
}

const formatYYYYMMDD = (ms: number) => {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const parseYYYYMMDD = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const useIsCoarsePointer = () => {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return coarse;
};

export function DueDateInput() {
  const [value, setValue] = useState("");
  const [today, setToday] = useState(() => formatYYYYMMDD(Date.now()));
  const [open, setOpen] = useState(false);
  const isCoarse = useIsCoarsePointer();

  // 0時に最小日付を更新（ページを跨いでもズレない）
  useEffect(() => {
    const now = new Date(Date.now());
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const t = setTimeout(
      () => setToday(formatYYYYMMDD(Date.now())),
      +next - +now
    );
    return () => clearTimeout(t);
  }, [today]);

  const minDateObj = useMemo(() => parseYYYYMMDD(today), [today]);
  const isOutOfRange = value !== "" && value < today; // ISO 文字列の辞書順比較

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-2">
        <label htmlFor="due-date" className="block text-sm font-medium">
          出産予定日
        </label>
        <div className="flex items-start gap-2">
          <input
            id="due-date"
            name="due-date"
            type="date"
            min={today}
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            aria-describedby="due-date-help due-date-error"
            className="flex-1 border rounded px-3 py-2"
            required
          />
          {/* デスクトップのみカスタムカレンダーをポップアップで補完 */}
          {!isCoarse && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="border rounded px-3 py-2"
              >
                カレンダー
              </button>
              {open && (
                <div className="absolute z-50 mt-2">
                  <Calendar
                    buttonVariant="outline"
                    captionLayout="dropdown"
                    // 選択不可領域（当日より前と上限日以後）
                    disabled={{
                      before: minDateObj,
                      after: MAX_DATE_VALUE,
                    }}
                    endMonth={
                      new Date(
                        MAX_DATE_VALUE.getFullYear(),
                        MONTH_INDEX_DECEMBER
                      )
                    }
                    mode="single"
                    onSelect={(d) => {
                      handleCalendarSelect(d);
                      setCalendarOpen(false);
                    }}
                    selected={selectedDate}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <p id="due-date-help" className="text-xs text-gray-500">
          最小日付は本日（{today}）です。
        </p>
        {value && (
          <p aria-live="polite" className="text-xs text-gray-700">
            選択中: {value}
          </p>
        )}
        {isOutOfRange && (
          <p id="due-date-error" role="alert" className="text-sm text-red-600">
            本日より過去の日付は選べません。
          </p>
        )}
      </div>

      <button
        type="submit"
        className="h-11 rounded bg-black text-white disabled:bg-gray-400"
        disabled={value === "" || isOutOfRange}
      >
        保存して始める
      </button>
    </form>
  );
}
```

-

## pre-birth-page.tsx

-

## post-birth-page.tsx

-
