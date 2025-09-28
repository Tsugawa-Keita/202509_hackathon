import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { priorityTypeBadges as defaultPriorityTypeBadges, TODO_DISPLAY_STEP } from "@/constants/pre-birth";
import type { AppState } from "@/lib/app-state";
import { saveAppState } from "@/lib/app-state";

export type TodoItem = {
  id: number;
  priority: number;
  priorityType: number;
  text: string;
  task?: string;
};

type UseTodoChecklistArgs = {
  onStateChange?: (nextState: AppState) => void;
  state: AppState;
  todos?: TodoItem[];
  isLoading?: boolean;
  loadError?: string;
};

type TodoChecklistState = {
  completedCount: number;
  completedTodos: TodoItem[];
  completedIdSet: Set<string>;
  displayTodos: TodoItem[];
  handleShowMore: () => void;
  handleToggleTodo: (todoId: number) => void;
  isLoading: boolean;
  isShowMoreDisabled: boolean;
  loadError: string;
  progressPercentage: number;
  totalCount: number;
};

const PERCENT_SCALE = 100;

export const useTodoChecklist = ({
  isLoading = false,
  loadError = "",
  onStateChange,
  state,
  todos: sourceTodos,
}: UseTodoChecklistArgs): TodoChecklistState => {
  const [visibleCount, setVisibleCount] = useState(TODO_DISPLAY_STEP);
  const [completedIds, setCompletedIds] = useState<string[]>(state.completedTodos);

  const todos = sourceTodos ?? [];

  useEffect(() => {
    setCompletedIds(state.completedTodos);
  }, [state.completedTodos]);

  const completedIdSet = useMemo(() => new Set(completedIds), [completedIds]);

  const sortedTodos = useMemo(() => {
    if (todos.length === 0) {
      return [] as TodoItem[];
    }

    const copy = [...todos];
    copy.sort((left, right) => {
      // priorityType 昇順 → priority 昇順 → id 昇順
      if (left.priorityType !== right.priorityType) {
        return left.priorityType - right.priorityType;
      }
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      return left.id - right.id;
    });

    return copy;
  }, [todos]);

  const pendingTodos = useMemo(
    () => sortedTodos.filter((todo) => !completedIdSet.has(String(todo.id))),
    [completedIdSet, sortedTodos]
  );
  const pendingCount = pendingTodos.length;

  useEffect(() => {
    if (pendingCount === 0) {
      if (visibleCount !== 0) {
        setVisibleCount(0);
      }
      return;
    }

    if (visibleCount === 0) {
      setVisibleCount(Math.min(TODO_DISPLAY_STEP, pendingCount));
      return;
    }

    if (visibleCount > pendingCount) {
      setVisibleCount(pendingCount);
    }
  }, [pendingCount, visibleCount]);

  const completedCount = useMemo(() => {
    if (sortedTodos.length === 0) {
      return 0;
    }

    return sortedTodos.reduce((total, todo) => (completedIdSet.has(String(todo.id)) ? total + 1 : total), 0);
  }, [completedIdSet, sortedTodos]);

  const completedTodos = useMemo(
    () => sortedTodos.filter((todo) => completedIdSet.has(String(todo.id))),
    [completedIdSet, sortedTodos]
  );

  const progressPercentage = useMemo(() => {
    if (sortedTodos.length === 0) {
      return 0;
    }

    return Math.round((completedCount / sortedTodos.length) * PERCENT_SCALE);
  }, [completedCount, sortedTodos]);

  const displayTodos = useMemo(() => {
    if (pendingTodos.length === 0) {
      return [] as TodoItem[];
    }

    return pendingTodos.slice(0, visibleCount);
  }, [pendingTodos, visibleCount]);

  const handleToggleTodo = useCallback(
    (todoId: number) => {
      const sourceId = String(todoId);
      setCompletedIds((prev) => {
        const hasId = prev.includes(sourceId);
        const nextCompleted = hasId ? prev.filter((value) => value !== sourceId) : prev.concat(sourceId);

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
      if (nextCount >= pendingCount) {
        return pendingCount;
      }

      return nextCount;
    });
  }, [pendingCount]);

  const isShowMoreDisabled = visibleCount >= pendingCount;

  return {
    completedCount,
    completedTodos,
    completedIdSet,
    displayTodos,
    handleShowMore,
    handleToggleTodo,
    isLoading,
    isShowMoreDisabled,
    loadError,
    progressPercentage,
    totalCount: sortedTodos.length,
  };
};

type BadgeMap = Record<number, { accent: string; label: string; support: string }>;

type TodoChecklistSectionProps = {
  badgeMap?: BadgeMap;
  checklist: TodoChecklistState;
  description?: string;
  emptyMessage?: string;
  sectionId?: string;
  showMoreLabel?: string;
  title?: string;
};

const TodoChecklistSection = ({
  badgeMap,
  checklist,
  description,
  emptyMessage,
  sectionId,
  showMoreLabel,
  title,
}: TodoChecklistSectionProps) => {
  const {
    completedIdSet,
    completedTodos,
    completedCount,
    displayTodos,
    handleShowMore,
    handleToggleTodo,
    isLoading,
    isShowMoreDisabled,
    loadError,
  } = checklist;

  useEffect(() => {
   console.log(displayTodos) 
  }, [displayTodos])

  const priorityBadges = badgeMap ?? defaultPriorityTypeBadges;
  const fallbackBadge = priorityBadges[2] ??
    priorityBadges[1] ?? {
      accent: "bg-slate-200 text-slate-700",
      label: "タスク",
      support: "サポート内容を確認しましょう。",
    };
  const idPrefix = sectionId ? `${sectionId}-todo` : "todo";
  const headerDescription = description ?? "パパのTODO";
  const headerTitle = title ?? "今やるべきことを整理しましょう";
  const resolvedEmptyMessage = emptyMessage ?? "表示できるTODOがありません。";
  const resolvedShowMoreLabel = showMoreLabel ?? "さらに表示";
  const [isCompletedOpen, setCompletedOpen] = useState(false);
  const completedListId = `${idPrefix}-completed-list`;

  return (
    <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md" id={sectionId}>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardDescription className="text-slate">{headerDescription}</CardDescription>
          <CardTitle className="font-bold text-2xl">{headerTitle}</CardTitle>
        </div>
        {loadError ? (
          <p className="font-semibold text-rose-600 text-sm" role="alert">
            {loadError}
          </p>
        ) : null}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-slate-500 text-sm">TODOリストを読み込み中です…</p>
        ) : (
          <>
            <ul className="space-y-4">
              {displayTodos.map((todo) => {
                const id = `${idPrefix}-${todo.id}`;
                const badge = priorityBadges[todo.priorityType] ?? fallbackBadge;
                const isChecked = completedIdSet.has(String(todo.id));

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
                            <Label className="font-semibold text-base text-slate-800" htmlFor={id} id={`${id}-label`}>
                              {todo.task}
                            </Label>
                            {/* <p className="mt-2 text-slate-500 text-sm">{badge.support}</p> */}
                          </div>
                        </div>
                        <Badge className={badge.accent}>{badge.label}</Badge>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
            {displayTodos.length === 0 ? <p className="mt-6 text-slate-500 text-sm">{resolvedEmptyMessage}</p> : null}
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
                {resolvedShowMoreLabel}
              </Button>
            </div>
            {completedTodos.length > 0 ? (
              <section className="mt-10 border-slate-200 border-t pt-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-700 text-sm">完了したタスク（{completedCount}件）</h3>
                  <Button
                    aria-controls={completedListId}
                    aria-expanded={isCompletedOpen}
                    className="px-3 py-2 text-xs"
                    onClick={() => setCompletedOpen((prev) => !prev)}
                    type="button"
                    variant="secondary"
                  >
                    {isCompletedOpen ? "非表示" : "表示"}
                  </Button>
                </div>
                {isCompletedOpen ? (
                  <ul className="mt-4 space-y-3" id={completedListId}>
                    {completedTodos.map((todo) => {
                      const id = `${idPrefix}-completed-${todo.id}`;
                      const badge = priorityBadges[todo.priorityType] ?? fallbackBadge;

                      return (
                        <li key={todo.id}>
                          <Card className="border-slate-100 bg-slate-50 p-4 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div className="flex items-start gap-4">
                                <Checkbox
                                  aria-labelledby={`${id}-label`}
                                  checked
                                  id={id}
                                  onCheckedChange={() => handleToggleTodo(todo.id)}
                                />
                                <div>
                                  <Label
                                    className="font-semibold text-base text-slate-500 line-through"
                                    htmlFor={id}
                                    id={`${id}-label`}
                                  >
                                    {todo.text}
                                  </Label>
                                  <p className="mt-2 text-slate-400 text-sm">{badge.support}</p>
                                </div>
                              </div>
                              <Badge className={`${badge.accent} opacity-70`}>{badge.label}</Badge>
                            </div>
                          </Card>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TodoChecklistSection;

export type { TodoChecklistSectionProps, TodoChecklistState };
