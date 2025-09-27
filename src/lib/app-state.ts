export type AppPhase = "pre-birth" | "post-birth";

export type AppState = {
  appState: AppPhase;
  completedTodos: string[];
  dueDate: string;
};

export const STORAGE_KEY = "papasapoAppState";

export const createInitialState = (dueDate: string): AppState => ({
  appState: "pre-birth",
  completedTodos: [],
  dueDate,
});

export const parseStoredState = (rawValue: string): AppState | null => {
  try {
    const parsed = JSON.parse(rawValue) as Partial<AppState> | null;
    if (!parsed) {
      return null;
    }

    if (typeof parsed.dueDate !== "string" || parsed.dueDate.length === 0) {
      return null;
    }

    const completedTodos = Array.isArray(parsed.completedTodos)
      ? parsed.completedTodos.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];

    return {
      appState: parsed.appState === "post-birth" ? "post-birth" : "pre-birth",
      completedTodos,
      dueDate: parsed.dueDate,
    };
  } catch {
    return null;
  }
};

export const loadStoredState = (): AppState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  return parseStoredState(rawValue);
};

export const saveAppState = (nextState: AppState) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
};
