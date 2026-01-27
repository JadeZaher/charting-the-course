import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Loader2 } from "lucide-react";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import QuizList from "@/pages/QuizList";
import QuizManagement from "@/pages/QuizManagement";
import TakeQuiz from "@/pages/TakeQuiz";
import QuizResults from "@/pages/QuizResults";
import Profile from "@/pages/Profile";
import PublicProfile from "@/pages/PublicProfile";
import AdminPanel from "@/pages/AdminPanel";
import UserManagement from "@/pages/UserManagement";
import UserQuizHistory from "@/pages/UserQuizHistory";
import MapView from "@/pages/MapView";
import NotFound from "@/pages/not-found";

// Loading spinner component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({ 
  component: Component,
  requiredPermission,
}: { 
  component: React.ComponentType;
  requiredPermission?: 'canAccessAdminPanel' | 'canCreateQuizzes' | 'canManageUsers' | 'isAdmin';
}) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const { permissions, isLoading: roleLoading, error: roleError } = useRoleAccess();
  const [location] = useLocation();

  // Show loading only for auth check, not for role (role has fallback)
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  // Show error if role fetch failed (optional - can be removed if you want silent fallback)
  if (roleError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Error Loading Permissions</h1>
          <p className="text-muted-foreground">{(roleError as Error).message || 'Failed to load user permissions'}</p>
          <a href="/" className="text-primary underline" onClick={() => window.location.reload()}>
            Retry
          </a>
        </div>
      </div>
    );
  }

  // Check permission if required (don't wait for role loading - use fallback permissions)
  if (requiredPermission && !roleLoading && !permissions[requiredPermission]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <a href="/" className="text-primary underline">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  return <Component />;
}

// Public routes that don't require auth
function PublicRoutes() {
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If already authenticated and on login page, redirect to dashboard
  if (isAuthenticated && location === '/login') {
    return <Redirect to="/" />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/users/:username" component={PublicProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Authenticated routes with sidebar layout
function AuthenticatedRoutes() {
  return (
    <Switch>
      {/* Public accessible routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      {/* Quiz routes - all authenticated users can take quizzes */}
      <Route path="/quizzes">
        <ProtectedRoute component={QuizList} />
      </Route>
      <Route path="/quiz/take/:id">
        <ProtectedRoute component={TakeQuiz} />
      </Route>
      <Route path="/quiz/results/:id">
        <ProtectedRoute component={QuizResults} />
      </Route>
      
      {/* Quiz management - requires canCreateQuizzes permission */}
      <Route path="/quiz/manage">
        <ProtectedRoute component={QuizManagement} requiredPermission="canCreateQuizzes" />
      </Route>
      
      {/* Profile - all authenticated users */}
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      
      {/* Admin panel - requires canAccessAdminPanel permission */}
      <Route path="/admin">
        <ProtectedRoute component={AdminPanel} requiredPermission="canAccessAdminPanel" />
      </Route>
      
      {/* User Management - requires isAdmin permission */}
      <Route path="/admin/users">
        <ProtectedRoute component={UserManagement} requiredPermission="isAdmin" />
      </Route>
      <Route path="/admin/users/:userId/history">
        <ProtectedRoute component={UserQuizHistory} requiredPermission="isAdmin" />
      </Route>
      
      {/* Map view - all authenticated users */}
      <Route path="/map">
        <ProtectedRoute component={MapView} />
      </Route>
      
      {/* Fallback to public routes for unmatched paths */}
      <Route>
        <PublicRoutes />
      </Route>
    </Switch>
  );
}

// Main app layout with authentication
function AppLayout() {
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const [location] = useLocation();

  // Public routes that don't need the sidebar
  const publicPaths = ['/login', '/users/'];
  const isPublicPath = publicPaths.some(path => location.startsWith(path));

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show public routes without sidebar
  if (!isAuthenticated || isPublicPath) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/users/:username" component={PublicProfile} />
        {!isAuthenticated && <Route><Redirect to="/login" /></Route>}
        {isAuthenticated && <Route><Redirect to="/" /></Route>}
      </Switch>
    );
  }

  // Show authenticated layout with sidebar
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-3 sm:p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 min-w-0">
            <AuthenticatedRoutes />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppLayout />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
