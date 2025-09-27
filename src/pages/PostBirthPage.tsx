import type { AppState } from "../lib/appState";

type PostBirthPageProps = {
  state: AppState;
};

const PostBirthPage = ({ state }: PostBirthPageProps) => {
  const summaryItems = [
    { label: "出産予定日", value: state.dueDate },
    {
      label: "完了したTODO数",
      value: String(state.completedTodos.length),
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-100 px-6 py-12 text-slate-900">
      <section className="w-full max-w-2xl rounded-lg bg-white p-10 shadow-md">
        <h1 className="font-bold text-3xl">出産後ダッシュボードは準備中です</h1>
        <p className="mt-4 text-base leading-relaxed">
          出産後フェーズ向けの体験を開発中です。現在保存している情報は以下の通りです。
        </p>
        <ul className="mt-6 space-y-3">
          {summaryItems.map((item) => (
            <li
              className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3 shadow-sm"
              key={item.label}
            >
              <span className="font-semibold text-slate-600 text-sm">
                {item.label}
              </span>
              <span className="font-bold text-base text-slate-900">
                {item.value}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};

export default PostBirthPage;
