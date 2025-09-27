import useSwr from "swr";

import type { TodoItem } from "@/components/tasks/todo-checklist-section";
import { POST_BIRTH_SCHEDULE, POST_BIRTH_TODOS } from "@/constants/post-birth-data";
import { fetcher } from "@/lib/fetcher";

type ScheduleItem = {
  id: number;
  text: string;
  time: string;
};

const API_PATH = "/tasks";

const endpoint = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}${API_PATH}`;

const isValidTodoItem = (value: unknown): value is TodoItem => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const source = value as Partial<TodoItem>;
  return (
    typeof source.id === "number" &&
    typeof source.priority === "number" &&
    typeof source.priorityType === "number" &&
    typeof source.text === "string" &&
    source.text.length > 0
  );
};

const isValidScheduleItem = (value: unknown): value is ScheduleItem => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const source = value as Partial<ScheduleItem>;
  return (
    typeof source.id === "number" &&
    typeof source.text === "string" &&
    source.text.length > 0 &&
    typeof source.time === "string" &&
    source.time.length > 0
  );
};

const STATIC_TODO_FALLBACK: TodoItem[] = POST_BIRTH_TODOS.map((item) => ({
  ...item,
}));

const STATIC_SCHEDULE_FALLBACK: ScheduleItem[] = POST_BIRTH_SCHEDULE.map((item) => ({
  ...item,
}));

for (const todo of STATIC_TODO_FALLBACK) {
  Object.freeze(todo);
}
Object.freeze(STATIC_TODO_FALLBACK);

for (const entry of STATIC_SCHEDULE_FALLBACK) {
  Object.freeze(entry);
}
Object.freeze(STATIC_SCHEDULE_FALLBACK);

const fetchTodoList = async (path: string) => {
  const raw = await fetcher<unknown>(`${endpoint}/${path}`);
  if (!Array.isArray(raw)) {
    throw new Error("Invalid todo payload");
  }

  const parsed = raw.filter(isValidTodoItem);
  return parsed;
};

const fetchSchedule = async () => {
  const raw = await fetcher<unknown>(`${endpoint}/schedule`);
  if (!Array.isArray(raw)) {
    throw new Error("Invalid schedule payload");
  }

  const parsed = raw.filter(isValidScheduleItem);
  return parsed;
};

export function useSyncTasks(path = "pre_birth") {
  return useSwr<TodoItem[]>(`${endpoint}/${path}`, () => fetchTodoList(path), {
    revalidateOnFocus: false,
  });
}

export const usePostBirthTasks = () =>
  useSwr<TodoItem[]>(
    `${endpoint}/post_birth`,
    async () => {
      try {
        const remote = await fetchTodoList("post_birth");
        if (remote.length === 0) {
          throw new Error("Empty todo payload");
        }

        return remote;
      } catch (_error) {
        return STATIC_TODO_FALLBACK;
      }
    },
    {
      fallbackData: STATIC_TODO_FALLBACK,
      revalidateOnFocus: false,
    }
  );

export const useSchedule = () =>
  useSwr<ScheduleItem[]>(
    `${endpoint}/schedule`,
    async () => {
      try {
        const remote = await fetchSchedule();
        if (remote.length === 0) {
          throw new Error("Empty schedule payload");
        }

        return remote;
      } catch (_error) {
        return STATIC_SCHEDULE_FALLBACK;
      }
    },
    {
      fallbackData: STATIC_SCHEDULE_FALLBACK,
      revalidateOnFocus: false,
    }
  );

export type { ScheduleItem };
