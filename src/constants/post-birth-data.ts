import type { ScheduleItem } from "@/api/tasks";
import type { TodoItem } from "@/components/tasks/todo-checklist-section";

const POST_BIRTH_TODOS = [
  {
    id: 1,
    priority: 10,
    priorityType: 1,
    text: "出生届を役所に提出する",
  },
  {
    id: 2,
    priority: 9,
    priorityType: 1,
    text: "健康保険の加入手続きをする",
  },
  {
    id: 3,
    priority: 8,
    priorityType: 1,
    text: "児童手当の申請をする",
  },
  {
    id: 4,
    priority: 10,
    priorityType: 3,
    text: "ママの産後うつに注意を払う",
  },
  {
    id: 5,
    priority: 9,
    priorityType: 2,
    text: "授乳のサポートをする",
  },
  {
    id: 6,
    priority: 8,
    priorityType: 2,
    text: "おむつ替えを積極的に行う",
  },
  {
    id: 7,
    priority: 9,
    priorityType: 2,
    text: "夜間の授乳・おむつ替えを分担する",
  },
  {
    id: 8,
    priority: 7,
    priorityType: 2,
    text: "赤ちゃんの沐浴を担当する",
  },
  {
    id: 9,
    priority: 8,
    priorityType: 2,
    text: "家事を率先して行う",
  },
  {
    id: 10,
    priority: 10,
    priorityType: 3,
    text: "ママの話を聞き精神的サポートをする",
  },
  {
    id: 11,
    priority: 8,
    priorityType: 1,
    text: "1ヶ月健診の付き添いをする",
  },
  {
    id: 12,
    priority: 7,
    priorityType: 1,
    text: "予防接種のスケジュールを確認する",
  },
  {
    id: 13,
    priority: 6,
    priorityType: 3,
    text: "ママの外出時間を作ってあげる",
  },
  {
    id: 14,
    priority: 8,
    priorityType: 3,
    text: "赤ちゃんとの時間を大切にする",
  },
  {
    id: 15,
    priority: 5,
    priorityType: 3,
    text: "写真・動画で成長記録を残す",
  },
] as const satisfies TodoItem[];

const POST_BIRTH_SCHEDULE = [
  {
    id: 1,
    text: "起床・ママの体調チェック",
    time: "06:00",
  },
  {
    id: 2,
    text: "朝の授乳とおむつ替え",
    time: "07:30",
  },
  {
    id: 3,
    text: "出生届の提出準備",
    time: "09:00",
  },
  {
    id: 4,
    text: "昼食づくりとママの休憩サポート",
    time: "12:00",
  },
  {
    id: 5,
    text: "児童手当申請に必要な書類整理",
    time: "14:00",
  },
  {
    id: 6,
    text: "健康保険加入手続きの確認",
    time: "17:30",
  },
  {
    id: 7,
    text: "夜の授乳・おむつ替えサポート",
    time: "20:00",
  },
  {
    id: 8,
    text: "ママのメンタルケアと一日の振り返り",
    time: "22:00",
  },
] as const satisfies ScheduleItem[];

export { POST_BIRTH_SCHEDULE, POST_BIRTH_TODOS };
