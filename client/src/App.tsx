import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/Login";
import AgentDashboard from "./pages/agent/Dashboard";
import ClientDashboard from "./pages/client/Dashboard";

function App() {
  const { isLoading, isAuthenticated, isAgent } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="text-[#8b949e] text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/auth/verify">
        {/* Server handles redirect after verify — this is fallback */}
        <LoginPage />
      </Route>

      <Route path="/dashboard">
        {isAuthenticated ? (
          isAgent ? <AgentDashboard /> : <ClientDashboard />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/">
        <Redirect to={isAuthenticated ? "/dashboard" : "/login"} />
      </Route>
    </Switch>
  );
}

export default App;
