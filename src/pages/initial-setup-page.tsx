import { format, isValid, parseISO } from "date-fns";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DATE_LIMITS, ERROR_MESSAGES } from "../constants/initial-setup";
import type { AppState } from "../lib/app-state";
import { createInitialState, saveAppState } from "../lib/app-state";

const RANGE_GUIDANCE_MESSAGE = `${DATE_LIMITS.minDate} から ${DATE_LIMITS.maxDate} の間で入力してください。`;

type InitialSetupPageProps = {
  onConfigured?: (nextState: AppState) => void;
};

const MIN_DATE_VALUE = parseISO(DATE_LIMITS.minDate);
const MAX_DATE_VALUE = parseISO(DATE_LIMITS.maxDate);

const formatIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

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

  const selectedDate = useMemo(() => parseDueDate(dueDate), [dueDate]);
  const selectedDateLabel = useMemo(
    () => (selectedDate ? format(selectedDate, "PPP") : ""),
    [selectedDate]
  );

  const isWithinAllowedRange = (date: Date) => {
    const time = date.getTime();
    return time >= MIN_DATE_VALUE.getTime() && time <= MAX_DATE_VALUE.getTime();
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
      setErrorMessage(ERROR_MESSAGES.requiredDueDate);
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
    <main className="min-h-dvh bg-background py-12 text-foreground md:py-20">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <Card className="border border-border bg-card text-card-foreground shadow-xl">
          <CardHeader className="gap-2 pb-0">
            <Badge className="w-fit" variant="secondary">
              STEP 1
            </Badge>
            <CardTitle className="font-semibold text-3xl md:text-[2.75rem]">
              出産予定日を登録しましょう
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-10">
            <form
              aria-describedby="due-date-guidance"
              className="flex h-fit flex-col gap-6 rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-7"
              onSubmit={handleSubmit}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    className="block font-medium text-muted-foreground text-sm"
                    htmlFor="due-date"
                  >
                    出産予定日
                  </Label>
                  <Input
                    id="due-date"
                    max={DATE_LIMITS.maxDate}
                    min={DATE_LIMITS.minDate}
                    name="due-date"
                    onChange={handleChange}
                    type="date"
                    value={dueDate}
                  />
                </div>
                <div className="rounded-xl border border-border bg-muted p-4">
                  <Calendar
                    buttonVariant="outline"
                    captionLayout="dropdown"
                    mode="single"
                    onSelect={handleCalendarSelect}
                    selected={selectedDate}
                  />
                </div>
                <p
                  className="text-muted-foreground text-xs"
                  id="due-date-guidance"
                >
                  {RANGE_GUIDANCE_MESSAGE}
                </p>
                {selectedDate ? (
                  <p
                    aria-live="polite"
                    className="font-medium text-muted-foreground text-xs"
                  >
                    選択中の日付: {selectedDateLabel} (
                    {formatIsoDate(selectedDate)})
                  </p>
                ) : null}
              </div>
              {errorMessage ? (
                <p
                  className="font-semibold text-destructive text-sm"
                  role="alert"
                >
                  {errorMessage}
                </p>
              ) : null}
              <Button className="h-11 text-base" type="submit">
                保存して始める
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-border border-t bg-muted/60 px-5 py-6 text-muted-foreground text-sm sm:px-7">
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
