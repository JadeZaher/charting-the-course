import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import QuizList from "@/pages/QuizList";
import QuizManagement from "@/pages/QuizManagement";
import TakeQuiz from "@/pages/TakeQuiz";
import QuizResults from "@/pages/QuizResults";
import Profile from "@/pages/Profile";
import PublicProfile from "@/pages/PublicProfile";
import AdminPanel from "@/pages/AdminPanel";
import MapView from "@/pages/MapView";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show login page while loading or not authenticated
  if (isLoading || !isAuthenticated) {
    return <Route path="/" component={Login} />;
  }

  // Show app pages when authenticated
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/quizzes" component={QuizList} />
      <Route path="/quiz/manage" component={QuizManagement} />
      <Route path="/quiz/take/:id" component={TakeQuiz} />
      <Route path="/quiz/results/:id" component={QuizResults} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/:userId" component={PublicProfile} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/map" component={MapView} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthGate sidebarStyle={sidebarStyle} />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AuthGate({ sidebarStyle }: { sidebarStyle: React.CSSProperties }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show login page when not authenticated
  if (isLoading || !isAuthenticated) {
    return <Login />;
  }

  // Show app with sidebar when authenticated
  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-8">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
