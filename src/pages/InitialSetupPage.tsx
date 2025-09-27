import { type ChangeEvent, type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppState } from "../lib/appState";
import { createInitialState, saveAppState } from "../lib/appState";

const descriptionParagraphs = [
  "出産予定日を登録すると、出産前後の1ヶ月間に必要なTODOや情報を受け取れます。",
  "登録した情報はお使いの端末にのみ保存されるので、安心してご利用ください。",
] as const;

type InitialSetupPageProps = {
  onConfigured?: (nextState: AppState) => void;
};

const InitialSetupPage = ({ onConfigured }: InitialSetupPageProps) => {
  const navigate = useNavigate();
  const [dueDate, setDueDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDueDate(event.target.value);
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dueDate) {
      setErrorMessage("出産予定日を入力してください。");
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
    <main className="flex min-h-screen flex-col items-center bg-slate-50 px-6 py-10 text-slate-800">
      <section className="w-full max-w-xl rounded-lg bg-white p-8 shadow-md">
        <h1 className="font-bold text-2xl">まずは出産予定日を登録しましょう</h1>
        <div className="mt-4 space-y-3">
          {descriptionParagraphs.map((paragraph) => (
            <p className="leading-relaxed" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm" htmlFor="due-date">
              出産予定日
            </label>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              id="due-date"
              max="9999-12-31"
              min="1900-01-01"
              name="due-date"
              onChange={handleChange}
              type="date"
              value={dueDate}
            />
            <p className="text-slate-500 text-xs">
              ※ 保存した情報はご利用のブラウザにのみ保存されます。
            </p>
          </div>
          {errorMessage ? (
            <p className="font-semibold text-rose-600 text-sm" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <button
            className="w-full rounded-md bg-indigo-600 px-4 py-3 font-semibold text-base text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            type="submit"
          >
            保存して始める
          </button>
        </form>
      </section>
    </main>
  );
};

export default InitialSetupPage;
