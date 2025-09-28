import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSyncTasks } from "@/api/tasks";
import TodoChecklistSection, { useTodoChecklist } from "@/components/tasks/todo-checklist-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
      // ページ遷移時に完了タスクリストをクリア
      completedTodos: [],
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

  // ママの状態カードをカルーセル化するためのスライド情報
  const slides = useMemo(
    () => [
      { key: "body", title: "身体の変化", text: motherSummary.body },
      { key: "mind", title: "気持ちのゆらぎ", text: motherSummary.mind },
      { key: "support", title: "パパのサポート", text: motherSummary.support },
    ],
    [motherSummary.body, motherSummary.mind, motherSummary.support]
  );

  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = slides.length;

  // 選択スライドの追従
  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentIndex(carouselApi.selectedScrollSnap());
    onSelect();
    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
      carouselApi.off("reInit", onSelect);
    };
  }, [carouselApi]);

  // 自動再生（ループ前提）
  useEffect(() => {
    if (!carouselApi) return;
    const id = window.setInterval(() => {
      if (!carouselApi) return;
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, 6000);
    return () => window.clearInterval(id);
  }, [carouselApi]);

  useEffect(() => {
    console.log(todoChecklist);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#C5E4CA] px-6 py-12 text-slate-900">
      <Card className="w-full max-w-4xl border-none bg-white shadow-md">
        <CardHeader className="gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription className="text-slate uppercase tracking-widest">
              出産準備の今を把握しましょう
            </CardDescription>
            <CardTitle className="mt-2 font-bold text-3xl lg:text-4xl">出産予定日まであと{daysUntilDue}日</CardTitle>
            <p className="mt-2 text-base text-slate-600">予定日: {dueDateDisplay}</p>
          </div>
          <Card className="w-full max-w-xs border-none bg-[#fdf6e6] px-5 py-4 text-slate shadow-none lg:w-auto">
            <CardHeader className="gap-1 p-0">
              <CardDescription className="font-semibold text-slate text-xs">現在の進捗</CardDescription>
              <CardTitle className="font-bold text-2xl text-slate">
                {todoChecklist.completedCount} / {todoChecklist.totalCount} 件
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="flex items-center justify-between text-sm">
                <span>達成率</span>
                <span>{todoChecklist.progressPercentage}%</span>
              </div>
              <Progress
                className="!border-[#b8b8b8] mt-2 h-6 border-1 bg-[#C5E4CA]"
                value={todoChecklist.progressPercentage}
              />
            </CardContent>
          </Card>
        </CardHeader>
      </Card>

      <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md">
        <CardContent className="flex flex-col items-center gap-6 pt-8 lg:flex-row">
          <button
            aria-label="赤ちゃんが生まれたら長押しで出産後モードに切り替える"
            className="flex h-60 w-60 transform items-center justify-center rounded-full bg-[#fdf6e6] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 active:scale-95"
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
              className="h-40 w-40 object-contain"
              height={400}
              src="/taiji.png"
              width={375}
            />
          </button>
          <div className="flex-1 space-y-3">
            <h2 className="font-semibold text-2xl">赤ちゃんが生まれたら、赤ちゃんアイコンを長押し</h2>
            <p className="text-base text-slate-600 leading-relaxed">
              生まれた瞬間をアプリに記録する準備をしておきましょう。赤ちゃんが誕生したら、このアイコンを長押しすることで出産後モードへ切り替え可能です。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-10 w-full max-w-4xl border-none bg-white shadow-md">
        <CardHeader>
          <CardDescription className="text-slate">ママの状態</CardDescription>
          <CardTitle className="font-bold text-2xl">{motherSummary.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Carousel className="mt-4" opts={{ loop: true }} setApi={setCarouselApi}>
            <CarouselContent>
              {slides.map((s) => (
                <CarouselItem key={s.key}>
                  <Card className="border-none bg-slate-50 p-5 shadow-none">
                    <CardHeader className="p-0">
                      <CardTitle className="font-semibold text-base text-slate-700">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                      <p className="mt-2 text-slate-600 text-sm leading-relaxed">{s.text}</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious aria-label="前のスライド" className="border-slate-100" />
            <CarouselNext aria-label="次のスライド" className="border-slate-100" />
          </Carousel>
          <div className="mt-3 flex items-center justify-end text-slate-600 text-sm">
            <span aria-live="polite">
              {currentIndex + 1} / {totalSlides}
            </span>
          </div>
        </CardContent>
      </Card>

      <TodoChecklistSection checklist={todoChecklist} />

      <Dialog onOpenChange={setConfirmOpen} open={isConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>出産後モードに切り替えますか？</DialogTitle>
            <DialogDescription>赤ちゃんが生まれたことを記録し、 出産後のガイドに移動します。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="bg-white font-[MPLUSRounded1c-Medium] text-black tracking-wider shadow-sm"
              onClick={() => setConfirmOpen(false)}
              type="button"
            >
              いいえ
            </Button>
            <Button
              className="font-[MPLUSRounded1c-Medium] text-white tracking-wider"
              onClick={handleConfirmTransition}
              type="button"
            >
              はい、切り替える
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default PreBirthPage;
