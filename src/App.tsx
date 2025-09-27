import { useCallback, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { AppState } from "./lib/app-state";
import { loadStoredState } from "./lib/app-state";
import InitialSetupPage from "./pages/initial-setup-page";
import PostBirthPage from "./pages/post-birth-page";
import PreBirthPage from "./pages/pre-birth-page";

const App = () => {
  const [state, setState] = useState<AppState | null>(() => loadStoredState());

  const handleStateReplace = useCallback((nextState: AppState) => {
    setState(nextState);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            state ? (
              <Navigate
                replace
                to={
                  state.appState === "post-birth" ? "/post-birth" : "/pre-birth"
                }
              />
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
              <InitialSetupPage onConfigured={handleStateReplace} />
            )
          }
          path="/setup"
        />
        <Route
          element={
            state ? (
              <PreBirthPage onStateChange={handleStateReplace} state={state} />
            ) : (
              <Navigate replace to="/setup" />
            )
          }
          path="/pre-birth"
        />
        <Route
          element={
            state ? (
              <PostBirthPage state={state} />
            ) : (
              <Navigate replace to="/setup" />
            )
          }
          path="/post-birth"
        />
        <Route
          element={
            state ? (
              <Navigate
                replace
                to={
                  state.appState === "post-birth" ? "/post-birth" : "/pre-birth"
                }
              />
            ) : (
              <Navigate replace to="/setup" />
            )
          }
          path="*"
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
