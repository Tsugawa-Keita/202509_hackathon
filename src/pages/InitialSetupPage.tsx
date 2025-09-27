import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { format, isValid, parseISO } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DATE_LIMITS,
  descriptionParagraphs,
  ERROR_MESSAGES,
} from "../constants/initialSetup";
import type { AppState } from "../lib/appState";
import { createInitialState, saveAppState } from "../lib/appState";

const HIGHLIGHTS = [
  {
    heading: "出産前後のTODOを自動整理",
    body: "出産予定日の前後1ヶ月で必要になる手続きや買い物リストを時系列で把握できます。",
  },
  {
    heading: "パートナーや家族との共有準備に",
    body: "すぐに確認できる静的なリファレンスとして、準備状況の可視化に役立ちます。",
  },
] as const;

const REMINDERS = [
  "入力した予定日はブラウザにのみ保存され、外部には送信されません。",
  "登録後もトップページの設定メニューからいつでも更新できます。",
] as const;

const RANGE_GUIDANCE_MESSAGE = `${DATE_LIMITS.MIN_DATE} から ${DATE_LIMITS.MAX_DATE} の間で入力してください。`;

type InitialSetupPageProps = {
  onConfigured?: (nextState: AppState) => void;
};

const MIN_DATE_VALUE = parseISO(DATE_LIMITS.MIN_DATE);
const MAX_DATE_VALUE = parseISO(DATE_LIMITS.MAX_DATE);

const formatIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

const parseDueDate = (value: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return undefined;
  }

  return parsed;
};

const InitialSetupPage = ({ onConfigured }: InitialSetupPageProps) => {
  const navigate = useNavigate();
  const [dueDate, setDueDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedDate = useMemo(() => parseDueDate(dueDate), [dueDate]);

  const isWithinAllowedRange = (date: Date) => {
    const time = date.getTime();
    return (
      time >= MIN_DATE_VALUE.getTime() && time <= MAX_DATE_VALUE.getTime()
    );
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDueDate(event.target.value);
    if (errorMessage) {
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

    setDueDate(formatIsoDate(nextDate));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dueDate) {
      setErrorMessage(ERROR_MESSAGES.REQUIRED_DUE_DATE);
      return;
    }

    const validatedDate = parseDueDate(dueDate);
    if (!validatedDate) {
      setErrorMessage(RANGE_GUIDANCE_MESSAGE);
      return;
    }

    if (!isWithinAllowedRange(validatedDate)) {
      setErrorMessage(RANGE_GUIDANCE_MESSAGE);
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
    <main className="min-h-screen bg-slate-50 py-16 text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-4">
        <Card className="border-none shadow-lg">
          <CardHeader className="gap-4 pb-0">
            <Badge className="w-fit" variant="secondary">
              STEP 1
            </Badge>
            <CardTitle className="font-bold text-3xl md:text-4xl">
              出産予定日を登録しましょう
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              {descriptionParagraphs[0]}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-12 pb-12 pt-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <section className="space-y-8">
              <div className="space-y-6">
                {HIGHLIGHTS.map(({ heading, body }) => (
                  <div
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                    key={heading}
                  >
                    <h2 className="text-xl font-semibold text-slate-900">
                      {heading}
                    </h2>
                    <p className="mt-2 text-base leading-relaxed text-slate-600">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100/70 p-6 text-sm leading-relaxed text-slate-600">
                {descriptionParagraphs[1]}
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                {REMINDERS.map((reminder) => (
                  <li className="flex items-start gap-2" key={reminder}>
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>{reminder}</span>
                  </li>
                ))}
              </ul>
            </section>
            <form
              aria-describedby="due-date-guidance"
              className="flex h-fit flex-col gap-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
              onSubmit={handleSubmit}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    className="text-sm font-semibold text-slate-700"
                    htmlFor="due-date"
                  >
                    出産予定日
                  </Label>
                  <Input
                    id="due-date"
                    max={DATE_LIMITS.MAX_DATE}
                    min={DATE_LIMITS.MIN_DATE}
                    name="due-date"
                    onChange={handleChange}
                    type="date"
                    value={dueDate}
                  />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <Calendar
                    buttonVariant="outline"
                    captionLayout="dropdown-buttons"
                    fromDate={MIN_DATE_VALUE}
                    mode="single"
                    onSelect={handleCalendarSelect}
                    selected={selectedDate}
                    toDate={MAX_DATE_VALUE}
                  />
                </div>
                <p className="text-xs text-slate-500" id="due-date-guidance">
                  {RANGE_GUIDANCE_MESSAGE}
                </p>
                {selectedDate ? (
                  <p className="text-xs font-medium text-slate-600">
                    選択中の日付: {formatIsoDate(selectedDate)}
                  </p>
                ) : null}
              </div>
              {errorMessage ? (
                <p className="text-sm font-semibold text-rose-600" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <Button className="h-11 text-base" type="submit">
                保存して始める
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-slate-100 border-t bg-slate-50 px-8 py-6 text-slate-600 text-sm">
            <p>
              登録が完了すると、ダッシュボードで必要な準備タスクが解放されます。
            </p>
            <p>
              情報はすべて端末内に保存され、ハッカソン期間中いつでもリセット可能です。
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
};

export default InitialSetupPage;
