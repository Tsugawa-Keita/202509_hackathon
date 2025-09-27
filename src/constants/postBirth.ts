/**
 * 出産後ページで使用される定数
 */

export const PAGE_CONTENT = {
  DESCRIPTION:
    "赤ちゃんとママのケア、そして役所への届け出をスムーズに進めましょう。今日やることをひと目で確認できます。",
  HERO_HIGHLIGHT: "生後",
  TITLE: "出産おめでとうございます",
} as const;

export const SECTION_TITLES = {
  IMPORTANT_TASK: "最優先で済ませたい事務手続き",
  SCHEDULE: "1日のスケジュール",
  TASKS: "事務的タスク一覧",
} as const;

export const SECTION_DESCRIPTIONS = {
  IMPORTANT_TASK:
    "最も優先度の高いタスクです。完了していない場合は、まずここから対応しましょう。",
  SCHEDULE:
    "赤ちゃんとママのリズムを整えるためのモデルケースです。時間に縛られすぎず、目安として活用してください。",
  TASKS:
    "優先度順に並んでいます。完了した項目はチェックを入れて記録しましょう。",
} as const;

export const ANCHOR_IDS = {
  TASKS: "administrative-tasks",
} as const;

export const POST_BIRTH_PRIORITY_BADGES: Record<
  number,
  { accent: string; label: string; support: string }
> = {
  1: {
    accent: "bg-rose-100 text-rose-700",
    label: "事務手続き",
    support: "出生届や健康保険など期限が決まっている手続きです。",
  },
  2: {
    accent: "bg-amber-100 text-amber-700",
    label: "生活サポート",
    support: "家事や育児を分担し、ママの体を最優先で休ませましょう。",
  },
  3: {
    accent: "bg-sky-100 text-sky-700",
    label: "メンタルケア",
    support: "ママと赤ちゃんの心を整える時間を意識的に持ちましょう。",
  },
} as const;
