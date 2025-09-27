import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { clampDays, createDisplayDate } from "../constants/common";
import {
  DATA_URL,
  DAY_MS,
  getMotherSummaryByWeeks,
  PREGNANCY_LIMITS,
  priorityTypeBadges,
  TODO_DISPLAY_STEP,
} from "../constants/preBirth";
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

const DAYS_PER_WEEK = 7;
const PERCENT_SCALE = 100;

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

    const applySuccess = (data: TodoItem[]) => {
      if (!isActive) {
        return;
      }
      setTodos(data);
      setLoadError("");
    };

    const applyFailure = () => {
      if (!isActive) {
        return;
      }
      setLoadError(
        "TODOリストの読み込みに失敗しました。時間をおいて再度お試しください。"
      );
    };

    const finishLoading = () => {
      if (isActive) {
        setIsLoading(false);
      }
    };

    const loadTodos = async () => {
      try {
        const response = await fetch(DATA_URL, { cache: "force-cache" });
        if (!response.ok) {
          throw new Error("failed to load");
        }

        const data = (await response.json()) as TodoItem[];
        applySuccess(data);
      } catch {
        applyFailure();
      } finally {
        finishLoading();
      }
    };

    loadTodos();

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
    const estimatedWeeks =
      PREGNANCY_LIMITS.MAX_WEEKS - Math.ceil(daysUntilDue / DAYS_PER_WEEK);
    if (estimatedWeeks < 0) {
      return 0;
    }

    if (estimatedWeeks > PREGNANCY_LIMITS.MAX_WEEKS) {
      return PREGNANCY_LIMITS.MAX_WEEKS;
    }

    return estimatedWeeks;
  }, [daysUntilDue]);

  const motherSummary = useMemo(
    () => getMotherSummaryByWeeks(weeksPregnant),
    [weeksPregnant]
  );

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

    return Math.round((completedCount / sortedTodos.length) * PERCENT_SCALE);
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
      <Card className="w-full max-w-4xl border-none bg-white shadow-md">
        <CardHeader className="gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription className="text-indigo-500 uppercase tracking-widest">
              出産準備の今を把握しましょう
            </CardDescription>
            <CardTitle className="mt-2 font-bold text-3xl lg:text-4xl">
              出産予定日まであと{daysUntilDue}日
            </CardTitle>
            <p className="mt-2 text-base text-slate-600">
              予定日: {dueDateDisplay}
            </p>
          </div>
          <Card className="w-full max-w-xs border-none bg-indigo-50 px-5 py-4 text-indigo-900 shadow-none lg:w-auto">
            <CardHeader className="gap-1 p-0">
              <CardDescription className="font-semibold text-indigo-500/80 text-xs">
                現在の進捗
              </CardDescription>
              <CardTitle className="font-bold text-2xl text-indigo-900">
                {completedCount} / {sortedTodos.length} 件
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="flex items-center justify-between text-sm">
                <span>達成率</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress className="mt-2 h-3" value={progressPercentage} />
            </CardContent>
          </Card>
        </CardHeader>
      </Card>

      <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md">
        <CardContent className="flex flex-col items-center gap-6 pt-8 lg:flex-row">
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
          <div className="flex-1 space-y-3">
            <h2 className="font-semibold text-2xl">
              赤ちゃんが生まれたら、赤ちゃんアイコンを長押し
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              生まれた瞬間をアプリに記録する準備をしておきましょう。赤ちゃんが誕生したら、このアイコンを長押しすることで出産後モードへ切り替える予定です。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md">
        <CardHeader>
          <CardDescription className="text-indigo-500">
            ママの状態
          </CardDescription>
          <CardTitle className="font-bold text-2xl">
            {motherSummary.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <Card className="border-none bg-slate-50 p-5 shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-semibold text-base text-slate-700">
                  身体の変化
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  {motherSummary.body}
                </p>
              </CardContent>
            </Card>
            <Card className="border-none bg-slate-50 p-5 shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-semibold text-base text-slate-700">
                  気持ちのゆらぎ
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  {motherSummary.mind}
                </p>
              </CardContent>
            </Card>
            <Card className="border-none bg-slate-50 p-5 shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-semibold text-base text-slate-700">
                  パパのサポート
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                  {motherSummary.support}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardDescription className="text-indigo-500">
              パパのTODO
            </CardDescription>
            <CardTitle className="font-bold text-2xl">
              今やるべきことを整理しましょう
            </CardTitle>
          </div>
          {loadError ? (
            <p className="font-semibold text-rose-600 text-sm" role="alert">
              {loadError}
            </p>
          ) : null}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-slate-500 text-sm">
              TODOリストを読み込み中です…
            </p>
          ) : (
            <>
              <ul className="space-y-4">
                {displayTodos.map((todo) => {
                  const id = `pre-birth-todo-${todo.id}`;
                  const badge =
                    priorityTypeBadges[todo.priorityType] ??
                    priorityTypeBadges[2];
                  const isChecked = completedIds.includes(String(todo.id));

                  return (
                    <li key={todo.id}>
                      <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-4">
                            <Checkbox
                              aria-labelledby={`${id}-label`}
                              checked={isChecked}
                              id={id}
                              onCheckedChange={() => handleToggleTodo(todo.id)}
                            />
                            <div>
                              <Label
                                className="font-semibold text-base text-slate-800"
                                htmlFor={id}
                                id={`${id}-label`}
                              >
                                {todo.text}
                              </Label>
                              <p className="mt-2 text-slate-500 text-sm">
                                {badge.support}
                              </p>
                            </div>
                          </div>
                          <Badge className={badge.accent}>{badge.label}</Badge>
                        </div>
                      </Card>
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
                <Button
                  className="px-5 py-3 text-sm"
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
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default PreBirthPage;
