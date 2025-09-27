import { useCallback, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import type { AppState } from "./lib/appState";
import { loadStoredState } from "./lib/appState";
import InitialSetupPage from "./pages/InitialSetupPage";
import MainPage from "./pages/MainPage";

const App = () => {
  const [state, setState] = useState<AppState | null>(() => loadStoredState());

  const handleConfigured = useCallback((nextState: AppState) => {
    setState(nextState);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            state ? (
              <MainPage state={state} />
            ) : (
              <Navigate replace to="/setup" />
            )
          }
          index
        />
        <Route
          element={
            state ? (
              <Navigate replace to="/" />
            ) : (
              <InitialSetupPage onConfigured={handleConfigured} />
            )
          }
          path="/setup"
        />
        <Route
          element={<Navigate replace to={state ? "/" : "/setup"} />}
          path="*"
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
