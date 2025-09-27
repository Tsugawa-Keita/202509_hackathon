import { useEffect, useMemo, useState } from "react";
import type { ScheduleItem } from "@/api/tasks";
import { usePostBirthTasks, useSchedule } from "@/api/tasks";
import TodoChecklistSection, {
  type TodoItem,
  useTodoChecklist,
} from "@/components/tasks/todo-checklist-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { createDisplayDate, MILLISECONDS_PER_DAY } from "../constants/common";
import {
  ANCHOR_IDS,
  PAGE_CONTENT,
  POST_BIRTH_PRIORITY_BADGES,
  SECTION_DESCRIPTIONS,
  SECTION_TITLES,
} from "../constants/post-birth";
import type { AppState } from "../lib/app-state";

type PostBirthPageProps = {
  state: AppState;
};

const calculateDaysAfterBirth = (dueDate: string) => {
  const recordedDate = new Date(dueDate);
  const recordedTime = recordedDate.getTime();

  if (Number.isNaN(recordedTime)) {
    return 0;
  }

  const diff = Math.floor((Date.now() - recordedTime) / MILLISECONDS_PER_DAY);
  return diff < 0 ? 0 : diff;
};

const getImportantTask = (
  tasks: TodoItem[] | undefined,
  completedIdSet: Set<string>
) => {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  const pending = tasks.filter((task) => !completedIdSet.has(String(task.id)));

  if (pending.length === 0) {
    return null;
  }

  const compareTodoPriority = (left: TodoItem, right: TodoItem) => {
    if (left.priorityType !== right.priorityType) {
      return left.priorityType - right.priorityType;
    }
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }
    return left.id - right.id;
  };

  return pending.reduce(
    (current, candidate) => {
      if (!current) {
        return candidate;
      }

      if (compareTodoPriority(candidate, current) < 0) {
        return candidate;
      }

      return current;
    },
    null as (typeof pending)[number] | null
  );
};

const formatProgressLabel = (completed: number, total: number) =>
  `${completed} / ${total} 件`;

const IMPORTANT_TASK_EMPTY_MESSAGE =
  "未完了のTODOはありません。お疲れさまでした！";
const IMPORTANT_TASK_HEADING = "次にやるべきこと";
const IMPORTANT_TASK_LINK_HINT = "タップするとTODO一覧に移動します";
const SCHEDULE_EMPTY_MESSAGE = "表示できるスケジュールがありません。";

type ImportantTaskContentParams = {
  anchorId: string;
  importantTask: TodoItem | null;
  isChecklistReady: boolean;
};

const buildImportantTaskContent = ({
  anchorId,
  importantTask,
  isChecklistReady,
}: ImportantTaskContentParams) => {
  if (!isChecklistReady) {
    return null;
  }

  if (!importantTask) {
    return (
      <p className="text-slate-600 text-sm">{IMPORTANT_TASK_EMPTY_MESSAGE}</p>
    );
  }

  const priorityBadge =
    POST_BIRTH_PRIORITY_BADGES[importantTask.priorityType] ??
    POST_BIRTH_PRIORITY_BADGES[1];

  return (
    <a
      className="mt-4 flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800 transition hover:shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
      href={`#${anchorId}`}
    >
      <span className="font-semibold text-sm">{IMPORTANT_TASK_HEADING}</span>
      <span className="font-bold text-lg">{importantTask.text}</span>
      <Badge className={priorityBadge.accent}>{priorityBadge.label}</Badge>
      <span className="text-rose-700/90 text-xs">
        {IMPORTANT_TASK_LINK_HINT}
      </span>
    </a>
  );
};

type ScheduleContentParams = {
  schedule: ScheduleItem[] | undefined;
  isScheduleReady: boolean;
};

const buildScheduleContent = ({
  isScheduleReady,
  schedule,
}: ScheduleContentParams) => {
  if (!isScheduleReady) {
    return null;
  }

  if (!schedule || schedule.length === 0) {
    return <p className="text-slate-600 text-sm">{SCHEDULE_EMPTY_MESSAGE}</p>;
  }

  return (
    <ol className="relative border-indigo-100 border-l-2 pl-6">
      {schedule.map((item, index) => (
        <li className="mb-8 last:mb-0" key={item.id}>
          <div className="-left-[11px] absolute mt-1 h-5 w-5 rounded-full border-2 border-white bg-indigo-500" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-indigo-500 text-sm">
              {item.time}
            </span>
            <span className="text-base text-slate-800">{item.text}</span>
          </div>
          {index === 0 ? (
            <span className="sr-only">スケジュール開始</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
};

const CELEBRATION_STORAGE_KEY = "postBirthCelebrationSeen";

const PostBirthPage = ({ state }: PostBirthPageProps) => {
  const [isCelebrationOpen, setCelebrationOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storage = window.localStorage;
      const hasSeen = storage.getItem(CELEBRATION_STORAGE_KEY) === "true";

      if (!hasSeen) {
        setCelebrationOpen(true);
        storage.setItem(CELEBRATION_STORAGE_KEY, "true");
      }
    } catch {
      setCelebrationOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isCelebrationOpen || typeof window === "undefined") {
      return;
    }

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (reduceMotionQuery.matches) {
      return;
    }

    let isActive = true;
    let animationFrame = 0;

    const launchConfetti = async () => {
      try {
        const module = await import("canvas-confetti");

        if (!isActive) {
          return;
        }

        const { default: confetti } = module;
        const duration = 4000;
        const endTime = Date.now() + duration;

        confetti({
          particleCount: 80,
          spread: 100,
          origin: { x: 0.5, y: 0.6 },
          startVelocity: 70,
          ticks: 250,
        });

        const frame = () => {
          confetti({
            particleCount: 12,
            spread: 70,
            origin: { x: 0, y: 0.8 },
            startVelocity: 55,
            angle: 60,
            ticks: 200,
          });
          confetti({
            particleCount: 12,
            spread: 70,
            origin: { x: 1, y: 0.8 },
            startVelocity: 55,
            angle: 120,
            ticks: 200,
          });

          if (!isActive || Date.now() >= endTime) {
            return;
          }

          animationFrame = window.requestAnimationFrame(frame);
        };

        frame();
      } catch {
        /* no-op */
      }
    };

    launchConfetti().catch(() => {
      /* no-op */
    });

    return () => {
      isActive = false;
      window.cancelAnimationFrame(animationFrame);
    };
  }, [isCelebrationOpen]);

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
      ? "TODOの読み込みに失敗しました。時間をおいて再度お試しください。"
      : "",
    state,
    todos: tasks ?? [],
  });

  const daysAfterBirth = useMemo(
    () => calculateDaysAfterBirth(state.dueDate),
    [state.dueDate]
  );

  const dueDateDisplay = useMemo(
    () => createDisplayDate(state.dueDate),
    [state.dueDate]
  );

  const importantTask = useMemo(
    () => getImportantTask(tasks, todoChecklist.completedIdSet),
    [tasks, todoChecklist.completedIdSet]
  );

  const progressLabel = formatProgressLabel(
    todoChecklist.completedCount,
    todoChecklist.totalCount
  );

  const isChecklistReady =
    !todoChecklist.isLoading && todoChecklist.loadError === "";
  const importantTaskContent = buildImportantTaskContent({
    anchorId: ANCHOR_IDS.tasks,
    importantTask,
    isChecklistReady,
  });

  const isScheduleReady = !isScheduleLoading && scheduleError == null;
  const scheduleContent = buildScheduleContent({
    isScheduleReady,
    schedule,
  });

  return (
    <>
      <Dialog onOpenChange={setCelebrationOpen} open={isCelebrationOpen}>
        <DialogContent
          aria-describedby="post-birth-celebration"
          role="alertdialog"
        >
          <DialogHeader>
            <DialogTitle>ご出産おめでとうございます！</DialogTitle>
            <DialogDescription id="post-birth-celebration">
              ここまでの準備、本当にお疲れさまでした。これからのサポートも私たちにお任せください。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setCelebrationOpen(false)} type="button">
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <main
        className="flex min-h-screen flex-col items-center bg-slate-100 px-6 py-12 text-slate-900"
        id="top"
      >
        <Card className="w-full max-w-4xl border-none bg-white shadow-md">
          <CardHeader className="gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardDescription className="text-indigo-500 uppercase tracking-widest">
                {PAGE_CONTENT.title}
              </CardDescription>
              <CardTitle className="mt-2 font-bold text-3xl lg:text-4xl">
                {PAGE_CONTENT.heroHighlight}
                {daysAfterBirth}日
              </CardTitle>
              <p className="mt-2 text-base text-slate-600">
                記録日: {dueDateDisplay}
              </p>
            </div>
            <Card className="w-full max-w-xs border-none bg-indigo-50 px-5 py-4 text-indigo-900 shadow-none lg:w-auto">
              <CardHeader className="gap-1 p-0">
                <CardDescription className="font-semibold text-indigo-500/80 text-xs">
                  TODOの進捗
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
                  aria-label="TODO達成率"
                  className="mt-2 h-3"
                  value={todoChecklist.progressPercentage}
                />
              </CardContent>
            </Card>
          </CardHeader>
          <CardContent>
            <p className="text-base text-slate-600 leading-relaxed">
              {PAGE_CONTENT.description}
            </p>
          </CardContent>
        </Card>

        <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md">
          <CardHeader>
            <CardDescription className="text-rose-500">
              {SECTION_TITLES.importantTask}
            </CardDescription>
            <CardTitle className="font-bold text-2xl">
              {SECTION_DESCRIPTIONS.importantTask}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todoChecklist.isLoading ? (
              <p className="text-slate-500 text-sm">TODOを読み込み中です…</p>
            ) : null}
            {todoChecklist.loadError ? (
              <p className="text-rose-600 text-sm" role="alert">
                {todoChecklist.loadError}
              </p>
            ) : null}
            {importantTaskContent}
          </CardContent>
        </Card>

        <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md">
          <CardHeader>
            <CardDescription className="text-indigo-500">
              {SECTION_TITLES.schedule}
            </CardDescription>
            <CardTitle className="font-bold text-2xl">
              {SECTION_DESCRIPTIONS.schedule}
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
            {scheduleContent}
          </CardContent>
        </Card>

        <TodoChecklistSection
          badgeMap={POST_BIRTH_PRIORITY_BADGES}
          checklist={todoChecklist}
          description={SECTION_TITLES.tasks}
          emptyMessage="すべて完了しました。次のステップに備えましょう。"
          sectionId={ANCHOR_IDS.tasks}
          showMoreLabel="追加のTODOを表示"
          title={SECTION_DESCRIPTIONS.tasks}
        />

        <div className="mt-6 flex w-full max-w-4xl justify-end">
          <Button asChild className="px-4 py-2" variant="outline">
            <a href="#top">ページ上部に戻る</a>
          </Button>
        </div>
      </main>
    </>
  );
};

export default PostBirthPage;
