import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useCognitoAuth } from "@/hooks/useCognitoAuth";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import WorkflowCreate from "./pages/workflows/WorkflowCreate";
import WorkflowDetail from "./pages/workflows/WorkflowDetail";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>; path: string }) {
  const { user, loading } = useCognitoAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user, loading } = useCognitoAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} path="/dashboard" />
      </Route>
      <Route path="/workflows/create">
        <ProtectedRoute component={WorkflowCreate} path="/workflows/create" />
      </Route>
      <Route path="/workflows/:id">
        <ProtectedRoute component={WorkflowDetail} path="/workflows/:id" />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={UserManagement} path="/users" />
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
