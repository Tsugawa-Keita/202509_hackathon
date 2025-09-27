/**
 * 出産前ページで使用される定数
 */

import { MAX_CLAMP_DAYS, MILLISECONDS_PER_DAY } from "./common";

export const DATA_URL = "/pre-birth.json";
export const TODO_DISPLAY_STEP = 5;

// 妊娠期間の制限値
export const PREGNANCY_LIMITS = {
  fullTermWeeks: 37,
  maxDays: MAX_CLAMP_DAYS,
  maxWeeks: 40,
  nearDueWeeks: 39,
} as const;

// 優先度タイプのバッジ設定
export const priorityTypeBadges: Record<
  number,
  { accent: string; label: string; support: string }
> = {
  1: {
    accent: "bg-rose-100 text-rose-700",
    label: "緊急対応",
    support: "出産当日までに必ず整えておきたい項目です。",
  },
  2: {
    accent: "bg-amber-100 text-amber-700",
    label: "準備",
    support: "赤ちゃんを迎える準備として押さえておきたい項目です。",
  },
  3: {
    accent: "bg-sky-100 text-sky-700",
    label: "サポート",
    support: "ママの心と体を支えるアクションです。",
  },
};

// 妊娠週数に基づく母親の状態管理
export const getMotherSummaryByWeeks = (weeksPregnant: number) => {
  if (weeksPregnant >= PREGNANCY_LIMITS.nearDueWeeks) {
    return {
      body: "前駆陣痛が増えやすく、体力の消耗も大きくなります。こまめな休息が最優先です。",
      mind: "出産への緊張と待ち遠しさが入り混じる時期です。不安を言語化できる場を用意してあげましょう。",
      support:
        "こまめな水分補給の声かけや温かい飲み物の用意、夜間のサポート体制を整えておきましょう。",
      title: "出産直前のママの状態",
    };
  }

  if (weeksPregnant >= PREGNANCY_LIMITS.fullTermWeeks) {
    return {
      body: "お腹の張りが強まり、腰痛や睡眠の質低下が目立つ時期です。",
      mind: "出産に向けた実感が高まりつつ、気持ちが揺らぎやすくなります。",
      support:
        "短時間の散歩やストレッチを一緒に行い、日常の家事は積極的に肩代わりしましょう。",
      title: "臨月のママの状態",
    };
  }

  return {
    body: "体重増加とむくみが現れやすく、睡眠時の体勢が辛くなり始めます。",
    mind: "出産準備のタスクが増え、焦りや負担を感じやすい時期です。",
    support:
      "TODOの棚卸しを一緒に行い、優先度の高い準備をあなたが先導しましょう。",
    title: "産前1ヶ月のママの状態",
  };
};

export const MILLISECONDS_PER_PREGNANCY_DAY = MILLISECONDS_PER_DAY;
