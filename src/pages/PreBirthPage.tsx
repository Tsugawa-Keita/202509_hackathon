import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppState } from "../lib/appState";
import { saveAppState } from "../lib/appState";

type PreBirthPageProps = {
  onStateChange?: (nextState: AppState) => void;
  state: AppState;
};

type TodoItem = {
  id: number;
  priority: number;
  priorityType: number;
  text: string;
};

const DATA_URL = "/pre-birth.json";
const TODO_DISPLAY_STEP = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

const priorityTypeBadges: Record<
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

const createDisplayDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "未設定";
  }

  return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日`;
};

const clampDays = (value: number) => {
  if (value < 0) {
    return 0;
  }

  if (value > 280) {
    return 280;
  }

  return value;
};

const PreBirthPage = ({ onStateChange, state }: PreBirthPageProps) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [visibleCount, setVisibleCount] = useState(TODO_DISPLAY_STEP);
  const [completedIds, setCompletedIds] = useState<string[]>(
    state.completedTodos
  );

  useEffect(() => {
    let isActive = true;

    const loadTodos = async () => {
      try {
        const response = await fetch(DATA_URL, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error("failed to load");
        }

        const data = (await response.json()) as TodoItem[];
        if (!isActive) {
          return;
        }

        setTodos(data);
        setLoadError("");
      } catch {
        if (!isActive) {
          return;
        }
        setLoadError(
          "TODOリストの読み込みに失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTodos();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setCompletedIds(state.completedTodos);
  }, [state.completedTodos]);

  const sortedTodos = useMemo(() => {
    if (todos.length === 0) {
      return [] as TodoItem[];
    }

    const copy = [...todos];
    copy.sort((left, right) => {
      if (right.priority === left.priority) {
        return left.id - right.id;
      }

      return right.priority - left.priority;
    });

    return copy;
  }, [todos]);

  useEffect(() => {
    if (visibleCount > sortedTodos.length) {
      setVisibleCount(sortedTodos.length);
    }
  }, [sortedTodos, visibleCount]);

  const daysUntilDue = useMemo(() => {
    const dueDate = new Date(state.dueDate);
    const dueTime = dueDate.getTime();
    if (Number.isNaN(dueTime)) {
      return 0;
    }

    const diff = Math.ceil((dueTime - Date.now()) / DAY_MS);
    return clampDays(diff);
  }, [state.dueDate]);

  const weeksPregnant = useMemo(() => {
    const estimatedWeeks = 40 - Math.ceil(daysUntilDue / 7);
    if (estimatedWeeks < 0) {
      return 0;
    }

    if (estimatedWeeks > 40) {
      return 40;
    }

    return estimatedWeeks;
  }, [daysUntilDue]);

  const motherSummary = useMemo(() => {
    if (weeksPregnant >= 39) {
      return {
        body: "前駆陣痛が増えやすく、体力の消耗も大きくなります。こまめな休息が最優先です。",
        mind: "出産への緊張と待ち遠しさが入り混じる時期です。不安を言語化できる場を用意してあげましょう。",
        support:
          "こまめな水分補給の声かけや温かい飲み物の用意、夜間のサポート体制を整えておきましょう。",
        title: "出産直前のママの状態",
      };
    }

    if (weeksPregnant >= 37) {
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
  }, [weeksPregnant]);

  const completedCount = useMemo(() => {
    if (sortedTodos.length === 0) {
      return 0;
    }

    return sortedTodos.reduce(
      (total, todo) =>
        completedIds.includes(String(todo.id)) ? total + 1 : total,
      0
    );
  }, [completedIds, sortedTodos]);

  const progressPercentage = useMemo(() => {
    if (sortedTodos.length === 0) {
      return 0;
    }

    return Math.round((completedCount / sortedTodos.length) * 100);
  }, [completedCount, sortedTodos]);

  const displayTodos = useMemo(() => {
    if (sortedTodos.length === 0) {
      return [] as TodoItem[];
    }

    return sortedTodos.slice(0, visibleCount);
  }, [sortedTodos, visibleCount]);

  const handleToggleTodo = useCallback(
    (todoId: number) => {
      const sourceId = String(todoId);
      setCompletedIds((prev) => {
        const hasId = prev.includes(sourceId);
        const nextCompleted = hasId
          ? prev.filter((value) => value !== sourceId)
          : prev.concat(sourceId);

        const nextState: AppState = {
          ...state,
          completedTodos: nextCompleted,
        };

        saveAppState(nextState);
        if (onStateChange) {
          onStateChange(nextState);
        }

        return nextCompleted;
      });
    },
    [onStateChange, state]
  );

  const handleShowMore = useCallback(() => {
    setVisibleCount((prev) => {
      const nextCount = prev + TODO_DISPLAY_STEP;
      if (nextCount >= sortedTodos.length) {
        return sortedTodos.length;
      }

      return nextCount;
    });
  }, [sortedTodos.length]);

  const dueDateDisplay = useMemo(
    () => createDisplayDate(state.dueDate),
    [state.dueDate]
  );
  const isShowMoreDisabled = displayTodos.length >= sortedTodos.length;

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-100 px-6 py-12 text-slate-900">
      <section className="w-full max-w-4xl rounded-2xl bg-white p-10 shadow-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-semibold text-indigo-500 text-sm uppercase tracking-widest">
              出産準備の今を把握しましょう
            </p>
            <h1 className="mt-2 font-bold text-3xl lg:text-4xl">
              出産予定日まであと{daysUntilDue}日
            </h1>
            <p className="mt-2 text-base text-slate-600">
              予定日: {dueDateDisplay}
            </p>
          </div>
          <div className="rounded-xl bg-indigo-50 px-5 py-4 text-indigo-900">
            <p className="font-semibold text-xs">現在の進捗</p>
            <p className="mt-1 font-bold text-2xl">
              {completedCount} / {sortedTodos.length} 件
            </p>
            <p className="text-sm">達成率 {progressPercentage}%</p>
          </div>
        </div>
      </section>

      <section className="mt-10 w-full max-w-4xl rounded-2xl bg-white p-8 shadow-md">
        <div className="flex flex-col items-center gap-6 lg:flex-row">
          <div className="flex h-40 w-40 items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-24 w-24 text-indigo-500" viewBox="0 0 128 128">
              <title>お腹の中で丸まる赤ちゃんのアイコン</title>
              <circle
                cx="64"
                cy="64"
                fill="currentColor"
                opacity="0.15"
                r="60"
              />
              <path
                d="M86 55a22 22 0 0 0-44 0v18a14 14 0 0 0 28 0v-6a6 6 0 1 1 12 0v6a26 26 0 0 1-52 0V55a34 34 0 1 1 68 0v12a6 6 0 0 1-12 0z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-2xl">
              赤ちゃんが生まれたら、赤ちゃんアイコンを長押し
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              生まれた瞬間をアプリに記録する準備をしておきましょう。赤ちゃんが誕生したら、このアイコンを長押しすることで出産後モードへ切り替える予定です。
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 w-full max-w-4xl rounded-2xl bg-white p-8 shadow-md">
        <header>
          <p className="font-semibold text-indigo-500 text-sm">ママの状態</p>
          <h2 className="mt-2 font-bold text-2xl">{motherSummary.title}</h2>
        </header>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <article className="rounded-xl bg-slate-50 p-5">
            <h3 className="font-semibold text-base text-slate-700">
              身体の変化
            </h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              {motherSummary.body}
            </p>
          </article>
          <article className="rounded-xl bg-slate-50 p-5">
            <h3 className="font-semibold text-base text-slate-700">
              気持ちのゆらぎ
            </h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              {motherSummary.mind}
            </p>
          </article>
          <article className="rounded-xl bg-slate-50 p-5">
            <h3 className="font-semibold text-base text-slate-700">
              パパのサポート
            </h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              {motherSummary.support}
            </p>
          </article>
        </div>
      </section>

      <section className="mt-10 w-full max-w-4xl rounded-2xl bg-white p-8 shadow-md">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-semibold text-indigo-500 text-sm">パパのTODO</p>
            <h2 className="mt-1 font-bold text-2xl">
              今やるべきことを整理しましょう
            </h2>
          </div>
          {loadError ? (
            <p className="font-semibold text-rose-600 text-sm" role="alert">
              {loadError}
            </p>
          ) : null}
        </header>

        {isLoading ? (
          <p className="mt-6 text-slate-500 text-sm">
            TODOリストを読み込み中です…
          </p>
        ) : (
          <>
            <ul className="mt-6 space-y-4">
              {displayTodos.map((todo) => {
                const id = `pre-birth-todo-${todo.id}`;
                const badge =
                  priorityTypeBadges[todo.priorityType] ??
                  priorityTypeBadges[2];
                const isChecked = completedIds.includes(String(todo.id));

                return (
                  <li
                    className="rounded-xl border border-slate-200 p-5 shadow-sm"
                    key={todo.id}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div>
                          <input
                            checked={isChecked}
                            className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                            id={id}
                            onChange={() => handleToggleTodo(todo.id)}
                            type="checkbox"
                          />
                        </div>
                        <div>
                          <label
                            className="font-semibold text-base text-slate-800"
                            htmlFor={id}
                          >
                            {todo.text}
                          </label>
                          <p className="mt-2 text-slate-500 text-sm">
                            {badge.support}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 font-semibold text-xs ${badge.accent}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {sortedTodos.length === 0 ? (
              <p className="mt-6 text-slate-500 text-sm">
                表示できるTODOがありません。
              </p>
            ) : null}
            <div className="mt-8 flex justify-center">
              <button
                className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-sm text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isShowMoreDisabled}
                onClick={handleShowMore}
                onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleShowMore();
                  }
                }}
                type="button"
              >
                さらに表示
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default PreBirthPage;
