import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type AppPhase = "pre-birth" | "post-birth";

export type AppState = {
  appState: AppPhase;
  completedTodos: string[];
  dueDate: string;
};

export const STORAGE_KEY = "papasapoAppState";

const createInitialState = (dueDate: string): AppState => ({
  appState: "pre-birth",
  completedTodos: [],
  dueDate,
});

type InitialSetupPageProps = {
  onConfigured?: (nextState: AppState) => void;
};

const descriptionParagraphs = [
  "出産予定日を登録すると、出産前後の1ヶ月間に必要なTODOや情報を受け取れます。",
  "登録した情報はお使いの端末にのみ保存されるので、安心してご利用ください。",
] as const;

const InitialSetupPage = ({ onConfigured }: InitialSetupPageProps) => {
  const [dueDate, setDueDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const paragraphs = useMemo(() => [...descriptionParagraphs], []);

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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    if (onConfigured) {
      onConfigured(nextState);
      return;
    }
    setIsSaved(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 px-6 py-10 text-slate-800">
      <section className="w-full max-w-xl rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold">まずは出産予定日を登録しましょう</h1>
        <div className="mt-4 space-y-3">
          {paragraphs.map((paragraph) => (
            <p className="leading-relaxed" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold" htmlFor="due-date">
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
            <p className="text-xs text-slate-500">
              ※ 保存した情報はご利用のブラウザにのみ保存されます。
            </p>
          </div>
          {errorMessage ? (
            <p className="text-sm font-semibold text-rose-600" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {isSaved && !onConfigured ? (
            <p className="text-sm text-emerald-600" role="status">
              保存が完了しました。メインページの準備が整うまで少々お待ちください。
            </p>
          ) : null}
          <button
            className="w-full rounded-md bg-indigo-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
