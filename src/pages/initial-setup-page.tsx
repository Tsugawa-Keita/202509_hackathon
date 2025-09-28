import { format, isValid, parseISO } from "date-fns";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildRangeError, DATE_LIMITS, ERROR_MESSAGES } from "../constants/initial-setup";
import type { AppState } from "../lib/app-state";
import { createInitialState, saveAppState } from "../lib/app-state";

// 本日のローカル日付を ISO (yyyy-MM-dd) で返す
const getTodayIso = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

type InitialSetupPageProps = {
  onConfigured?: (nextState: AppState) => void;
};

const MAX_DATE_VALUE = parseISO(DATE_LIMITS.maxDate);

const formatIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

// DayPicker の月インデックスは 0=1月 ... 11=12月
const MONTH_INDEX_DECEMBER = 11;

const parseDueDate = (value: string) => {
  if (!value) {
    return;
  }

  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return;
  }

  return parsed;
};

const InitialSetupPage = ({ onConfigured }: InitialSetupPageProps) => {
  const navigate = useNavigate();
  const [dueDate, setDueDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [todayIso, setTodayIso] = useState(getTodayIso);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [isCoarsePointer, setCoarsePointer] = useState(false);

  // 0時に最小日付を自動更新
  useEffect(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const t = window.setTimeout(() => setTodayIso(getTodayIso()), +next - +now);
    return () => window.clearTimeout(t);
  }, []);

  // モバイル（coarse pointer）検出で挙動分岐
  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }
    const mql = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const selectedDate = useMemo(() => parseDueDate(dueDate), [dueDate]);

  const minDateObj = useMemo(() => parseISO(todayIso), [todayIso]);

  const isWithinAllowedRange = (date: Date) => {
    const time = date.getTime();
    return time >= minDateObj.getTime() && time <= MAX_DATE_VALUE.getTime();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setDueDate(next);
    // 入力即時で範囲チェック（ISO文字列の辞書順比較でOK）
    if (!next) {
      setErrorMessage("");
      return;
    }
    if (next < todayIso || next > DATE_LIMITS.maxDate) {
      setErrorMessage(buildRangeError(todayIso, DATE_LIMITS.maxDate));
    } else {
      setErrorMessage("");
    }
  };

  const handleCalendarSelect = (nextDate: Date | undefined) => {
    if (!nextDate) {
      setDueDate("");
      return;
    }

    if (!isWithinAllowedRange(nextDate)) {
      return;
    }

    const nextIso = formatIsoDate(nextDate);
    setDueDate(nextIso);
    // カレンダー選択も即時バリデーション
    if (nextIso < todayIso || nextIso > DATE_LIMITS.maxDate) {
      setErrorMessage(buildRangeError(todayIso, DATE_LIMITS.maxDate));
    } else {
      setErrorMessage("");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dueDate) {
      setErrorMessage(ERROR_MESSAGES.requiredDueDate);
      return;
    }

    const validatedDate = parseDueDate(dueDate);
    if (!validatedDate) {
      setErrorMessage(buildRangeError(todayIso, DATE_LIMITS.maxDate));
      return;
    }

    if (!isWithinAllowedRange(validatedDate)) {
      setErrorMessage(buildRangeError(todayIso, DATE_LIMITS.maxDate));
      return;
    }

    const nextState = createInitialState(dueDate);
    saveAppState(nextState);
    if (onConfigured) {
      onConfigured(nextState);
    }
    navigate("/", { replace: true });
  };

  return (
    <main className="flex items-center min-h-dvh bg-[#C5E4CA] py-12 text-foreground md:py-20">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <Card className="border border-border bg-background text-card-foreground shadow-xl">
          <CardHeader className="gap-2 pb-0">
            <CardTitle className="text-center font-semibold text-xl">出産予定日を登録</CardTitle>
          </CardHeader>
          <CardContent className="">
            <form
              className="flex h-fit flex-col gap-6 rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-7"
              onSubmit={handleSubmit}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="block font-medium text-muted-foreground text-sm" htmlFor="due-date">
                    出産予定日
                  </Label>
                  <Input
                    aria-describedby="due-date-guidance due-date-error"
                    id="due-date"
                    max={DATE_LIMITS.maxDate}
                    min={todayIso}
                    name="due-date"
                    onChange={handleChange}
                    type="date"
                    value={dueDate}
                  />
                </div>
                {/* デスクトップのみカスタムカレンダーをポップアップで表示 */}
                {!isCoarsePointer && (
                  <div className="relative">
                    <Button onClick={() => setCalendarOpen((v) => !v)} type="button" variant="outline">
                      カレンダーを開く
                    </Button>
                    {isCalendarOpen && (
                      <div className="absolute z-50 mt-2 rounded-xl border border-border bg-muted p-4">
                        <Calendar
                          buttonVariant="outline"
                          captionLayout="dropdown"
                          disabled={{
                            before: minDateObj,
                            after: MAX_DATE_VALUE,
                          }}
                          endMonth={new Date(MAX_DATE_VALUE.getFullYear(), MONTH_INDEX_DECEMBER)}
                          mode="single"
                          onSelect={(d) => {
                            handleCalendarSelect(d);
                            setCalendarOpen(false);
                          }}
                          selected={selectedDate}
                          startMonth={new Date(minDateObj.getFullYear(), minDateObj.getMonth(), 1)}
                        />
                      </div>
                    )}
                  </div>
                )}
                {errorMessage ? (
                  <p className="font-semibold text-destructive text-sm" id="due-date-error" role="alert">
                    {errorMessage}
                  </p>
                ) : null}
              </div>
              <Button className="h-11 text-base" type="submit">
                保存して始める
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default InitialSetupPage;
