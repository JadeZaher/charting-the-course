import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EcosystemProvider } from "@/contexts/EcosystemContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import LandingPage from "@/pages/LandingPage";
import About from "@/pages/About";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import QuizList from "@/pages/QuizList";
import QuizzesOnboardingHub from "@/pages/QuizzesOnboardingHub";
import QuizManagement from "@/pages/QuizManagement";
import TakeQuiz from "@/pages/TakeQuiz";
import QuizResults from "@/pages/QuizResults";
import Profile from "@/pages/Profile";
import PublicProfile from "@/pages/PublicProfile";
import AdminPanel from "@/pages/AdminPanel";
import UserManagement from "@/pages/UserManagement";
import UserQuizHistory from "@/pages/UserQuizHistory";
import MyQuizHistory from "@/pages/MyQuizHistory";
import { lazy, Suspense } from "react";
const DiscoverHub = lazy(() => import("@/pages/discover/DiscoverHub"));
const SharesNeedsForm = lazy(() => import("@/pages/discover/SharesNeedsForm"));
const CollaborationForm = lazy(() => import("@/pages/discover/CollaborationForm"));
const CollaborationDetail = lazy(() => import("@/pages/discover/CollaborationDetail"));
import NotFound from "@/pages/not-found";
import MapPage from "@/pages/MapPage";
import JourneyMapList from "@/pages/JourneyMapList";
import JourneyMapEditor from "@/pages/JourneyMapEditor";
// Orientation Portal pages
import Discover from "@/pages/Discover";
import EthosDetail from "@/pages/EthosDetail";
import OrientationGate from "@/pages/OrientationGate";
import OrientationJourney from "@/pages/OrientationJourney";
import OrientationComplete from "@/pages/OrientationComplete";
import GovernanceDashboard from "@/pages/governance/DashboardHome";
import { AgreementList, AgreementDetail, AgreementForm, AgreementHistory } from '@/pages/governance/agreements';
import { ProposalList, ProposalDetail, ProposalForm } from '@/pages/governance/proposals';
import { MemberList, MemberDetail, MemberForm } from '@/pages/governance/members';
import { DomainList, DomainDetail, DomainForm } from '@/pages/governance/domains';
import { DecisionList, DecisionDetail } from '@/pages/governance/decisions';
import { OnboardingList, OnboardingCeremony } from '@/pages/governance/onboarding';
import { ConflictList, ConflictDetail, ConflictForm } from '@/pages/governance/conflicts';
import { EcosystemListPage, EcosystemDetailPage, EcosystemFormPage } from '@/pages/governance/ecosystems';
import { EmergencyDashboard, EmergencyDetail } from '@/pages/governance/emergency';
import { ExitList, ExitDetail, ExitForm } from '@/pages/governance/exit';
import { SafeguardsDashboard, AuditList, AuditDetail } from '@/pages/governance/safeguards';
import MessagingLayout from '@/pages/messaging/MessagingLayout';
import ChatPanel from '@/pages/chat/ChatPanel';
import CommsPage from '@/pages/communications/CommsPage';
import { EcosystemPicker } from "@/components/EcosystemPicker";
import { FloatingComms } from "@/components/FloatingComms";
import ComplianceDashboard from '@/pages/compliance/ComplianceDashboard';
import NotificationPreferences from '@/pages/settings/NotificationPreferences';

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
  requiredPermission?: 'canManageUsers' | 'canManageContent' | 'canProxyQuiz' | 'canViewAnalytics' | 'isAdmin';
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const { canManageUsers, canManageContent, canProxyQuiz, canViewAnalytics, isAdmin, isLoading: permLoading, error: permError } = usePermissions();
  const [location] = useLocation();

  // Show loading only for auth check
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  // Show error if permission fetch failed
  if (permError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Error Loading Permissions</h1>
          <p className="text-muted-foreground">{(permError as Error).message || 'Failed to load user permissions'}</p>
          <a href="/" className="text-primary underline" onClick={() => window.location.reload()}>
            Retry
          </a>
        </div>
      </div>
    );
  }

  // Check permission if required
  if (requiredPermission && !permLoading) {
    const permissionMap: Record<string, boolean> = {
      canManageUsers,
      canManageContent,
      canProxyQuiz,
      canViewAnalytics,
      isAdmin,
    };
    
    if (!permissionMap[requiredPermission]) {
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
  }

  return <Component />;
}

// Public routes that don't require auth
function PublicRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
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
      {/* Dashboard - authenticated home */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>

      {/* About page (also accessible when authenticated) */}
      <Route path="/about" component={About} />

      {/* Governance dashboard */}
      <Route path="/governance">
        <ProtectedRoute component={GovernanceDashboard} />
      </Route>

      {/* Agreement routes */}
      <Route path="/agreements/new">
        <ProtectedRoute component={AgreementForm} />
      </Route>
      <Route path="/agreements/:id/edit">
        <ProtectedRoute component={AgreementForm} />
      </Route>
      <Route path="/agreements/:id/history">
        <ProtectedRoute component={AgreementHistory} />
      </Route>
      <Route path="/agreements/:id">
        <ProtectedRoute component={AgreementDetail} />
      </Route>
      <Route path="/agreements">
        <ProtectedRoute component={AgreementList} />
      </Route>

      {/* Proposal routes */}
      <Route path="/proposals/new">
        <ProtectedRoute component={ProposalForm} />
      </Route>
      <Route path="/proposals/:id/edit">
        <ProtectedRoute component={ProposalForm} />
      </Route>
      <Route path="/proposals/:id">
        <ProtectedRoute component={ProposalDetail} />
      </Route>
      <Route path="/proposals">
        <ProtectedRoute component={ProposalList} />
      </Route>

      {/* Explore / Discover hub - all authenticated users */}
      <Route path="/explore">
        <ProtectedRoute component={DiscoverHub} />
      </Route>

      {/* Quiz & Onboarding hub */}
      <Route path="/quizzes">
        <ProtectedRoute component={QuizzesOnboardingHub} />
      </Route>
      <Route path="/quiz/take/:id">
        <ProtectedRoute component={TakeQuiz} />
      </Route>
      <Route path="/quiz/results/:id">
        <ProtectedRoute component={QuizResults} />
      </Route>
      
      {/* Quiz management - requires canManageContent permission */}
      <Route path="/quiz/manage">
        <ProtectedRoute component={QuizManagement} requiredPermission="canManageContent" />
      </Route>
      
      {/* Profile - all authenticated users */}
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      
      {/* My Quiz History - all authenticated users */}
      <Route path="/my-quiz-history">
        <ProtectedRoute component={MyQuizHistory} />
      </Route>

      {/* Discover Hub — cross-ecosystem collaboration */}
      <Route path="/discover/shares-needs/new">
        <Suspense fallback={<LoadingScreen />}><ProtectedRoute component={SharesNeedsForm} /></Suspense>
      </Route>
      <Route path="/discover/collaborations/new">
        <Suspense fallback={<LoadingScreen />}><ProtectedRoute component={CollaborationForm} /></Suspense>
      </Route>
      <Route path="/discover/collaborations/:id">
        <Suspense fallback={<LoadingScreen />}><ProtectedRoute component={CollaborationDetail} /></Suspense>
      </Route>
      <Route path="/discover/hub">
        <Suspense fallback={<LoadingScreen />}><ProtectedRoute component={DiscoverHub} /></Suspense>
      </Route>

      {/* Orientation Portal - all authenticated users */}
      <Route path="/discover">
        <ProtectedRoute component={Discover} />
      </Route>
      <Route path="/ethos/:slug">
        <ProtectedRoute component={EthosDetail} />
      </Route>
      <Route path="/ethos/:slug/detail">
        <ProtectedRoute component={EthosDetail} />
      </Route>
      <Route path="/orientation/:ethos_slug/complete">
        <ProtectedRoute component={OrientationComplete} />
      </Route>
      <Route path="/orientation/:ethos_slug/journey">
        <ProtectedRoute component={OrientationJourney} />
      </Route>
      <Route path="/orientation/:ethos_slug">
        <ProtectedRoute component={OrientationGate} />
      </Route>

      {/* Map page - all authenticated users */}
      <Route path="/map">
        <ProtectedRoute component={MapPage} />
      </Route>

      {/* Journey Map Builder - requires canManageContent */}
      <Route path="/admin/journey-maps/new">
        <ProtectedRoute component={JourneyMapEditor} requiredPermission="canManageContent" />
      </Route>
      <Route path="/admin/journey-maps/:id">
        <ProtectedRoute component={JourneyMapEditor} requiredPermission="canManageContent" />
      </Route>
      <Route path="/admin/journey-maps">
        <ProtectedRoute component={JourneyMapList} requiredPermission="canManageContent" />
      </Route>

      {/* Admin panel - requires canManageUsers permission */}
      <Route path="/admin">
        <ProtectedRoute component={AdminPanel} requiredPermission="canManageUsers" />
      </Route>
      
      {/* User Management - requires isAdmin permission */}
      <Route path="/admin/users">
        <ProtectedRoute component={UserManagement} requiredPermission="isAdmin" />
      </Route>
      <Route path="/admin/users/:userId/history">
        <ProtectedRoute component={UserQuizHistory} requiredPermission="isAdmin" />
      </Route>
      
      {/* Members */}
      <Route path="/members/new"><ProtectedRoute component={MemberForm} /></Route>
      <Route path="/members/:id/edit"><ProtectedRoute component={MemberForm} /></Route>
      <Route path="/members/:id"><ProtectedRoute component={MemberDetail} /></Route>
      <Route path="/members"><ProtectedRoute component={MemberList} /></Route>

      {/* Domains */}
      <Route path="/domains/new"><ProtectedRoute component={DomainForm} /></Route>
      <Route path="/domains/:id/edit"><ProtectedRoute component={DomainForm} /></Route>
      <Route path="/domains/:id"><ProtectedRoute component={DomainDetail} /></Route>
      <Route path="/domains"><ProtectedRoute component={DomainList} /></Route>

      {/* Decisions */}
      <Route path="/decisions/:id"><ProtectedRoute component={DecisionDetail} /></Route>
      <Route path="/decisions"><ProtectedRoute component={DecisionList} /></Route>

      {/* Onboarding */}
      <Route path="/onboarding/:memberId/ceremony"><ProtectedRoute component={OnboardingCeremony} /></Route>
      <Route path="/onboarding"><ProtectedRoute component={OnboardingList} /></Route>

      {/* Conflicts */}
      <Route path="/conflicts/new"><ProtectedRoute component={ConflictForm} /></Route>
      <Route path="/conflicts/:id/edit"><ProtectedRoute component={ConflictForm} /></Route>
      <Route path="/conflicts/:id"><ProtectedRoute component={ConflictDetail} /></Route>
      <Route path="/conflicts"><ProtectedRoute component={ConflictList} /></Route>

      {/* Ecosystems */}
      <Route path="/ecosystems/new"><ProtectedRoute component={EcosystemFormPage} /></Route>
      <Route path="/ecosystems/:id/edit"><ProtectedRoute component={EcosystemFormPage} /></Route>
      <Route path="/ecosystems/:id"><ProtectedRoute component={EcosystemDetailPage} /></Route>
      <Route path="/ecosystems"><ProtectedRoute component={EcosystemListPage} /></Route>

      {/* Emergency */}
      <Route path="/emergency/:id"><ProtectedRoute component={EmergencyDetail} /></Route>
      <Route path="/emergency"><ProtectedRoute component={EmergencyDashboard} /></Route>

      {/* Exit */}
      <Route path="/exit/new"><ProtectedRoute component={ExitForm} /></Route>
      <Route path="/exit/:id"><ProtectedRoute component={ExitDetail} /></Route>
      <Route path="/exit"><ProtectedRoute component={ExitList} /></Route>

      {/* Safeguards */}
      <Route path="/safeguards/audits/:id"><ProtectedRoute component={AuditDetail} /></Route>
      <Route path="/safeguards/audits"><ProtectedRoute component={AuditList} /></Route>
      <Route path="/safeguards"><ProtectedRoute component={SafeguardsDashboard} /></Route>

      {/* Communications — split view with AI chat + messaging */}
      <Route path="/comms"><ProtectedRoute component={CommsPage} /></Route>
      <Route path="/messaging"><ProtectedRoute component={MessagingLayout} /></Route>
      <Route path="/chat"><ProtectedRoute component={ChatPanel} /></Route>

      {/* Compliance */}
      <Route path="/compliance">
        <ProtectedRoute component={ComplianceDashboard} />
      </Route>

      {/* Settings */}
      <Route path="/settings/notifications">
        <ProtectedRoute component={NotificationPreferences} />
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
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Public routes that don't need the sidebar
  const publicPaths = ['/login', '/about', '/users/'];
  const isPublicPath = publicPaths.some(path => location.startsWith(path));
  const isLandingPage = location === '/';

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show landing page for unauthenticated users at root
  if (!isAuthenticated && isLandingPage) {
    return <LandingPage />;
  }

  // Show public routes without sidebar
  if (!isAuthenticated || isPublicPath) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/about" component={About} />
        <Route path="/users/:username" component={PublicProfile} />
        {!isAuthenticated && <Route><Redirect to="/" /></Route>}
        {isAuthenticated && <Route><Redirect to="/dashboard" /></Route>}
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
            <EcosystemPicker />
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 min-w-0">
            <AuthenticatedRoutes />
          </main>
        </div>
      </div>
      <FloatingComms />
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EcosystemProvider>
          <ThemeProvider>
            <TooltipProvider>
              <AppLayout />
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </EcosystemProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
