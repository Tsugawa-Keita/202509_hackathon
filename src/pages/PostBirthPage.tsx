import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PAGE_CONTENT, SUMMARY_LABELS } from "../constants/postBirth";
import type { AppState } from "../lib/appState";

type PostBirthPageProps = {
  state: AppState;
};

const PostBirthPage = ({ state }: PostBirthPageProps) => {
  const summaryItems = [
    { label: SUMMARY_LABELS.DUE_DATE, value: state.dueDate },
    {
      label: SUMMARY_LABELS.COMPLETED_TODOS,
      value: String(state.completedTodos.length),
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-100 px-6 py-12 text-slate-900">
      <Card className="w-full max-w-2xl border-none bg-white shadow-md">
        <CardHeader>
          <CardTitle className="font-bold text-3xl">
            {PAGE_CONTENT.TITLE}
          </CardTitle>
          <CardDescription className="text-base text-slate-600 leading-relaxed">
            {PAGE_CONTENT.DESCRIPTION}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {summaryItems.map((item) => (
              <li key={item.label}>
                <Card className="flex flex-row items-center justify-between gap-0 border-slate-100 px-4 py-3 shadow-sm">
                  <span className="font-semibold text-slate-600 text-sm">
                    {item.label}
                  </span>
                  <span className="font-bold text-base text-slate-900">
                    {item.value}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
};

export default PostBirthPage;
