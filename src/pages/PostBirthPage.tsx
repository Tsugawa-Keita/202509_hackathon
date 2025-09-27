import { useMemo } from "react";
import { usePostBirthTasks, useSchedule } from "@/api/tasks";
import TodoChecklistSection, {
  useTodoChecklist,
} from "@/components/tasks/TodoChecklistSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createDisplayDate } from "../constants/common";
import {
  ANCHOR_IDS,
  PAGE_CONTENT,
  POST_BIRTH_PRIORITY_BADGES,
  SECTION_DESCRIPTIONS,
  SECTION_TITLES,
} from "../constants/postBirth";
import type { AppState } from "../lib/appState";

type PostBirthPageProps = {
  state: AppState;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const PostBirthPage = ({ state }: PostBirthPageProps) => {
  const {
    data: tasks,
    error: tasksError,
    isLoading: isTasksLoading,
  } = usePostBirthTasks();
  const {
    data: schedule,
    error: scheduleError,
    isLoading: isScheduleLoading,
  } = useSchedule();

  const todoChecklist = useTodoChecklist({
    isLoading: Boolean(isTasksLoading),
    loadError: tasksError
      ? "事務的タスクの読み込みに失敗しました。時間をおいて再度お試しください。"
      : "",
    state,
    todos: tasks ?? [],
  });

  const daysAfterBirth = useMemo(() => {
    const recordedDate = new Date(state.dueDate);
    const recordedTime = recordedDate.getTime();
    if (Number.isNaN(recordedTime)) {
      return 0;
    }

    const diff = Math.floor((Date.now() - recordedTime) / DAY_MS);
    if (diff < 0) {
      return 0;
    }
    return diff;
  }, [state.dueDate]);

  const dueDateDisplay = useMemo(
    () => createDisplayDate(state.dueDate),
    [state.dueDate]
  );

  const importantTask = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return null;
    }

    const pending = tasks.filter(
      (task) => !todoChecklist.completedIdSet.has(String(task.id))
    );
    if (pending.length === 0) {
      return null;
    }

    return pending.reduce(
      (current, candidate) => {
        if (!current) {
          return candidate;
        }

        if (candidate.priority > current.priority) {
          return candidate;
        }

        if (
          candidate.priority === current.priority &&
          candidate.id < current.id
        ) {
          return candidate;
        }

        return current;
      },
      null as (typeof pending)[number] | null
    );
  }, [tasks, todoChecklist.completedIdSet]);

  const progressLabel = `${todoChecklist.completedCount} / ${todoChecklist.totalCount} 件`;

  return (
    <main
      className="flex min-h-screen flex-col items-center bg-slate-100 px-6 py-12 text-slate-900"
      id="top"
    >
      <Card className="w-full max-w-4xl border-none bg-white shadow-md">
        <CardHeader className="gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription className="text-indigo-500 uppercase tracking-widest">
              {PAGE_CONTENT.TITLE}
            </CardDescription>
            <CardTitle className="mt-2 font-bold text-3xl lg:text-4xl">
              {PAGE_CONTENT.HERO_HIGHLIGHT}
              {daysAfterBirth}日
            </CardTitle>
            <p className="mt-2 text-base text-slate-600">
              記録日: {dueDateDisplay}
            </p>
          </div>
          <Card className="w-full max-w-xs border-none bg-indigo-50 px-5 py-4 text-indigo-900 shadow-none lg:w-auto">
            <CardHeader className="gap-1 p-0">
              <CardDescription className="font-semibold text-indigo-500/80 text-xs">
                タスクの進捗
              </CardDescription>
              <CardTitle className="font-bold text-2xl text-indigo-900">
                {progressLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="flex items-center justify-between text-sm">
                <span>達成率</span>
                <span>{todoChecklist.progressPercentage}%</span>
              </div>
              <Progress
                aria-label="タスク達成率"
                className="mt-2 h-3"
                value={todoChecklist.progressPercentage}
              />
            </CardContent>
          </Card>
        </CardHeader>
        <CardContent>
          <p className="text-base text-slate-600 leading-relaxed">
            {PAGE_CONTENT.DESCRIPTION}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md">
        <CardHeader>
          <CardDescription className="text-rose-500">
            {SECTION_TITLES.IMPORTANT_TASK}
          </CardDescription>
          <CardTitle className="font-bold text-2xl">
            {SECTION_DESCRIPTIONS.IMPORTANT_TASK}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todoChecklist.isLoading ? (
            <p className="text-slate-500 text-sm">タスクを読み込み中です…</p>
          ) : null}
          {todoChecklist.loadError ? (
            <p className="text-rose-600 text-sm" role="alert">
              {todoChecklist.loadError}
            </p>
          ) : null}
          {todoChecklist.isLoading ||
          todoChecklist.loadError ? null : importantTask ? (
            <a
              className="mt-4 flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800 transition hover:shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
              href={`#${ANCHOR_IDS.TASKS}`}
            >
              <span className="font-semibold text-sm">次にやるべきこと</span>
              <span className="font-bold text-lg">{importantTask.text}</span>
              <Badge
                className={
                  (
                    POST_BIRTH_PRIORITY_BADGES[importantTask.priorityType] ??
                    POST_BIRTH_PRIORITY_BADGES[1]
                  ).accent
                }
              >
                {
                  (
                    POST_BIRTH_PRIORITY_BADGES[importantTask.priorityType] ??
                    POST_BIRTH_PRIORITY_BADGES[1]
                  ).label
                }
              </Badge>
              <span className="text-rose-700/90 text-xs">
                タップすると事務的タスク一覧に移動します
              </span>
            </a>
          ) : (
            <p className="text-slate-600 text-sm">
              未完了の事務的タスクはありません。お疲れさまでした！
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md">
        <CardHeader>
          <CardDescription className="text-indigo-500">
            {SECTION_TITLES.SCHEDULE}
          </CardDescription>
          <CardTitle className="font-bold text-2xl">
            {SECTION_DESCRIPTIONS.SCHEDULE}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isScheduleLoading ? (
            <p className="text-slate-500 text-sm">
              スケジュールを読み込み中です…
            </p>
          ) : null}
          {scheduleError ? (
            <p className="text-rose-600 text-sm" role="alert">
              スケジュールの取得に失敗しました。時間をおいて再度読み込んでください。
            </p>
          ) : null}
          {isScheduleLoading || scheduleError ? null : schedule &&
            schedule.length > 0 ? (
            <ol className="relative border-indigo-100 border-l-2 pl-6">
              {schedule.map((item, index) => (
                <li className="mb-8 last:mb-0" key={item.id}>
                  <div className="-left-[11px] absolute mt-1 h-5 w-5 rounded-full border-2 border-white bg-indigo-500" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-indigo-500 text-sm">
                      {item.time}
                    </span>
                    <span className="text-base text-slate-800">
                      {item.text}
                    </span>
                  </div>
                  {index === 0 ? (
                    <span className="sr-only">スケジュール開始</span>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-slate-600 text-sm">
              表示できるスケジュールがありません。
            </p>
          )}
        </CardContent>
      </Card>

      <TodoChecklistSection
        badgeMap={POST_BIRTH_PRIORITY_BADGES}
        checklist={todoChecklist}
        description={SECTION_TITLES.TASKS}
        emptyMessage="すべて完了しました。次のステップに備えましょう。"
        sectionId={ANCHOR_IDS.TASKS}
        showMoreLabel="追加のタスクを表示"
        title={SECTION_DESCRIPTIONS.TASKS}
      />

      <div className="mt-6 flex w-full max-w-4xl justify-end">
        <Button asChild className="px-4 py-2" variant="outline">
          <a href="#top">ページ上部に戻る</a>
        </Button>
      </div>
    </main>
  );
};

export default PostBirthPage;
