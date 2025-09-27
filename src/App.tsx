import { useCallback, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { AppState } from "./lib/appState";
import { loadStoredState } from "./lib/appState";
import InitialSetupPage from "./pages/InitialSetupPage";
import PostBirthPage from "./pages/PostBirthPage";
import PreBirthPage from "./pages/PreBirthPage";

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
