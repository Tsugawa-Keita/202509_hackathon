import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSyncTasks } from "@/api/tasks";
import TodoChecklistSection, { useTodoChecklist } from "@/components/tasks/todo-checklist-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { clampDays, createDisplayDate } from "../constants/common";
import { getMotherSummaryByWeeks, MILLISECONDS_PER_PREGNANCY_DAY, PREGNANCY_LIMITS } from "../constants/pre-birth";
import type { AppState } from "../lib/app-state";
import { saveAppState } from "../lib/app-state";

type PreBirthPageProps = {
  onStateChange?: (nextState: AppState) => void;
  state: AppState;
};

const DAYS_PER_WEEK = 7;
const LONG_PRESS_DURATION_MS = 800;

const PreBirthPage = ({ onStateChange, state }: PreBirthPageProps) => {
  const { data: tasks, error: tasksError, isLoading: isTasksLoading } = useSyncTasks();

  const todoChecklist = useTodoChecklist({
    isLoading: Boolean(isTasksLoading),
    loadError: tasksError ? "TODOリストの読み込みに失敗しました。時間をおいて再度お試しください。" : "",
    onStateChange,
    state,
    todos: tasks ?? [],
  });
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const openConfirmation = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const startHoldTimer = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    clearHoldTimer();
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      openConfirmation();
    }, LONG_PRESS_DURATION_MS);
  }, [clearHoldTimer, openConfirmation]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) {
        return;
      }
      startHoldTimer();
    },
    [startHoldTimer]
  );

  const handlePointerEnd = useCallback(() => {
    clearHoldTimer();
  }, [clearHoldTimer]);

  const handleDoubleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      clearHoldTimer();
      openConfirmation();
    },
    [clearHoldTimer, openConfirmation]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.repeat) {
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        startHoldTimer();
      }
    },
    [startHoldTimer]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        clearHoldTimer();
      }
    },
    [clearHoldTimer]
  );

  useEffect(() => () => clearHoldTimer(), [clearHoldTimer]);

  const handleConfirmTransition = useCallback(() => {
    const nextState: AppState = {
      ...state,
      appState: "post-birth",
    };

    saveAppState(nextState);
    if (onStateChange) {
      onStateChange(nextState);
    }
    setConfirmOpen(false);
    navigate("/post-birth");
  }, [navigate, onStateChange, state]);

  const daysUntilDue = useMemo(() => {
    const dueDate = new Date(state.dueDate);
    const dueTime = dueDate.getTime();
    if (Number.isNaN(dueTime)) {
      return 0;
    }

    const diff = Math.ceil((dueTime - Date.now()) / MILLISECONDS_PER_PREGNANCY_DAY);
    return clampDays(diff);
  }, [state.dueDate]);

  const weeksPregnant = useMemo(() => {
    const estimatedWeeks = PREGNANCY_LIMITS.maxWeeks - Math.ceil(daysUntilDue / DAYS_PER_WEEK);
    if (estimatedWeeks < 0) {
      return 0;
    }

    if (estimatedWeeks > PREGNANCY_LIMITS.maxWeeks) {
      return PREGNANCY_LIMITS.maxWeeks;
    }

    return estimatedWeeks;
  }, [daysUntilDue]);

  const motherSummary = useMemo(() => getMotherSummaryByWeeks(weeksPregnant), [weeksPregnant]);
  const dueDateDisplay = useMemo(() => createDisplayDate(state.dueDate), [state.dueDate]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-100 px-6 py-12 text-slate-900">
      <Card className="w-full max-w-4xl border-none bg-white shadow-md">
        <CardHeader className="gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription className="text-indigo-500 uppercase tracking-widest">
              出産準備の今を把握しましょう
            </CardDescription>
            <CardTitle className="mt-2 font-bold text-3xl lg:text-4xl">出産予定日まであと{daysUntilDue}日</CardTitle>
            <p className="mt-2 text-base text-slate-600">予定日: {dueDateDisplay}</p>
          </div>
          <Card className="w-full max-w-xs border-none bg-indigo-50 px-5 py-4 text-indigo-900 shadow-none lg:w-auto">
            <CardHeader className="gap-1 p-0">
              <CardDescription className="font-semibold text-indigo-500/80 text-xs">現在の進捗</CardDescription>
              <CardTitle className="font-bold text-2xl text-indigo-900">
                {todoChecklist.completedCount} / {todoChecklist.totalCount} 件
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="flex items-center justify-between text-sm">
                <span>達成率</span>
                <span>{todoChecklist.progressPercentage}%</span>
              </div>
              <Progress className="mt-2 h-3" value={todoChecklist.progressPercentage} />
            </CardContent>
          </Card>
        </CardHeader>
      </Card>

      <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md">
        <CardContent className="flex flex-col items-center gap-6 pt-8 lg:flex-row">
          <button
            aria-label="赤ちゃんが生まれたら長押しで出産後モードに切り替える"
            className="flex h-40 w-40 transform items-center justify-center rounded-full bg-indigo-100 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 active:scale-95"
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onPointerCancel={handlePointerEnd}
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerEnd}
            onPointerUp={handlePointerEnd}
            type="button"
          >
            <img
              alt="胎内で丸まる赤ちゃんのイラスト"
              className="h-24 w-24 object-contain"
              height={400}
              src="/taiji.png"
              width={375}
            />
          </button>
          <div className="flex-1 space-y-3">
            <h2 className="font-semibold text-2xl">赤ちゃんが生まれたら、赤ちゃんアイコンを長押し</h2>
            <p className="text-base text-slate-600 leading-relaxed">
              生まれた瞬間をアプリに記録する準備をしておきましょう。赤ちゃんが誕生したら、このアイコンを長押しすることで出産後モードへ切り替える可能です。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md">
        <CardHeader>
          <CardDescription className="text-indigo-500">ママの状態</CardDescription>
          <CardTitle className="font-bold text-2xl">{motherSummary.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <Card className="border-none bg-slate-50 p-5 shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-semibold text-base text-slate-700">身体の変化</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{motherSummary.body}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-slate-50 p-5 shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-semibold text-base text-slate-700">気持ちのゆらぎ</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{motherSummary.mind}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-slate-50 p-5 shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-semibold text-base text-slate-700">パパのサポート</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{motherSummary.support}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <TodoChecklistSection checklist={todoChecklist} />

      <Dialog onOpenChange={setConfirmOpen} open={isConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>出産後モードに切り替えますか？</DialogTitle>
            <DialogDescription>赤ちゃんが生まれたことを記録し、出産後のガイドに移動します。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setConfirmOpen(false)} type="button" variant="outline">
              いいえ
            </Button>
            <Button onClick={handleConfirmTransition} type="button">
              はい、切り替える
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default PreBirthPage;
