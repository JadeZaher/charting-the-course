import { Switch, Route, useLocation, Redirect } from "wouter";
import { lazy, Suspense, useEffect, useRef } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SupportChatProvider } from "@/contexts/SupportChatContext";
import { EcosystemProvider, useEcosystem } from "@/contexts/EcosystemContext";
import { PageContextProvider } from "@/contexts/PageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavPermissions } from "@/hooks/use-nav-permissions";
import { routeAccess, type NavAccess } from "@/lib/nav-access";
import { Loader2 } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import LandingPage from "@/pages/LandingPage";
import About from "@/pages/About";
import GovernanceModel from "@/pages/GovernanceModel";
import Login, { takeStashedRedirect } from "@/pages/Login";
import { consentGateRedirect, isHeldAtConsentGate } from "@/lib/consent-gate";
import Dashboard from "@/pages/Dashboard";
import QuizManagement from "@/pages/QuizManagement";
import TakeQuiz from "@/pages/TakeQuiz";
import QuizResults from "@/pages/QuizResults";
import MePage from "@/pages/me/MePage";
import ConsentGatePage from "@/pages/ConsentGatePage";
import PublicProfile from "@/pages/PublicProfile";
import AdminPanel from "@/pages/AdminPanel";
import NodeAudit from "@/pages/NodeAudit";
import UserManagement from "@/pages/UserManagement";
import UserQuizHistory from "@/pages/UserQuizHistory";
const DiscoverHub = lazy(() => import("@/pages/discover/DiscoverHub"));
const SharesNeedsForm = lazy(() => import("@/pages/discover/SharesNeedsForm"));
const CollaborationForm = lazy(() => import("@/pages/discover/CollaborationForm"));
const CollaborationDetail = lazy(() => import("@/pages/discover/CollaborationDetail"));
const ModerationPage = lazy(() => import("@/pages/discover/ModerationPanel")); // FX-Exchange
import NotFound from "@/pages/not-found";
// Orientation Portal pages
import EthosDetail from "@/pages/EthosDetail";
import OrientationGate from "@/pages/OrientationGate";
import OrientationJourney from "@/pages/OrientationJourney";
import OrientationComplete from "@/pages/OrientationComplete";
import { AgreementList, AgreementDetail, AgreementForm, AgreementHistory } from '@/pages/governance/agreements';
import { ProposalList, ProposalDetail, ProposalForm } from '@/pages/governance/proposals';
import { MemberList, MemberDetail, MemberForm } from '@/pages/governance/members';
import { DomainList, DomainDetail, DomainForm } from '@/pages/governance/domains';
import { DecisionList, DecisionDetail } from '@/pages/governance/decisions';
import { OnboardingList, OnboardingCeremony } from '@/pages/governance/onboarding';
import { ConflictList, ConflictDetail, ConflictForm } from '@/pages/governance/conflicts';
const RepairAgreementForm = lazy(() => import('./pages/governance/conflicts/RepairAgreementForm'));
import { EcosystemListPage, EcosystemDetailPage, EcosystemFormPage } from '@/pages/governance/ecosystems';
import { EmergencyDashboard, EmergencyDetail } from '@/pages/governance/emergency';
import { ExitList, ExitDetail, ExitForm } from '@/pages/governance/exit';
import { SafeguardsDashboard, AuditList, AuditDetail } from '@/pages/governance/safeguards';
import MessagingLayout from '@/pages/messaging/MessagingLayout';
import { EcosystemPicker } from "@/components/EcosystemPicker";
import { FloatingComms } from "@/components/FloatingComms";
import { RouteGuidePanel } from "@/components/RouteGuidePanel";
import { EmergencyBanner } from "@/components/governance/emergency/EmergencyBanner";
import ComplianceDashboard from '@/pages/compliance/ComplianceDashboard';

// Loading spinner component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-live="polite">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" aria-hidden="true" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function SkipLink() {
  return <a className="skip-link" href="#main-content">Skip to content</a>;
}

/** Login URL that returns the member to `path` (plus the current query) after sign-in. */
function loginRedirectHref(path: string) {
  return `/login?redirect=${encodeURIComponent(path + window.location.search)}`;
}

/** Move focus to #main-content after client-side navigation unless the new page placed it. */
function useFocusMainOnNavigate(location: string) {
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const main = document.getElementById("main-content");
    if (!main) return;
    const active = document.activeElement;
    if (active && active !== document.body && active !== main && main.contains(active)) return;
    main.focus({ preventScroll: true });
  }, [location]);
}

function PublicPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <SkipLink />
      <div id="main-content" tabIndex={-1} className="min-h-screen">
        {children}
        <footer className="border-t border-border p-5"><a className="underline" href="/node/audit">Public node support history</a></footer>
      </div>
    </div>
  );
}

// Protected Route wrapper. `access` gates a page by the same rule as its links (lib/nav-access.ts), never the profile.
function ProtectedRoute({ 
  component: Component,
  requiredPermission,
  access,
}: { 
  component: React.ComponentType;
  requiredPermission?: 'canManageUsers' | 'canManageContent' | 'canProxyQuiz' | 'canViewAnalytics' | 'isAdmin';
  access?: NavAccess;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const { canManageUsers, canManageContent, canProxyQuiz, canViewAnalytics, isAdmin, isLoading: permLoading, error: permError } = usePermissions();
  const navPermissions = useNavPermissions();
  const { selectionRestored } = useEcosystem();
  const [location] = useLocation();

  // Show loading only for auth check
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect to={loginRedirectHref(location)} />;
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

  if (access) {
    const verdict = routeAccess(access, navPermissions, selectionRestored);
    if (verdict === 'wait') return <LoadingScreen />;
    if (verdict === 'deny') return <AccessDenied reason={ACCESS_DENIED_REASONS[access]} />;
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
    
    if (!permissionMap[requiredPermission]) return <AccessDenied />;
  }

  return <Component />;
}

/** Why a page gated by `access` refused, in the words of its rule. */
const ACCESS_DENIED_REASONS: Record<NavAccess, string> = {
  'quiz-steward': 'Managing quizzes is for a steward of the selected ecosystem or a platform admin.',
  'admin-panel': 'This page is for assigned node admins.',
};

function AccessDenied({ reason }: { reason?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
        {reason && <p className="text-muted-foreground">{reason}</p>}
        <a href="/" className="text-primary underline">Go to Dashboard</a>
      </div>
    </div>
  );
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
          <Route path="/node/audit/:id" component={NodeAudit} />
          <Route path="/node/audit" component={NodeAudit} />
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

      {/* Governance dashboard — folded into ecosystems */}
      <Route path="/governance">
        <Redirect to="/ecosystems" />
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

      {/* Legacy discovery entry point */}
      <Route path="/explore">
        <Redirect to="/discover" />
      </Route>

      {/* Quizzes land on the member's own quiz history (G-Onboard; /onboarding is the stewards' Newcomers list) */}
      <Route path="/quizzes">
        <Redirect to="/my-quiz-history" />
      </Route>
      <Route path="/quiz/take/:id">
        <ProtectedRoute component={TakeQuiz} />
      </Route>
      <Route path="/quiz/results/:id">
        <ProtectedRoute component={QuizResults} />
      </Route>
      
      {/* Quiz management: the same rule as its links, a steward of the selected ecosystem or a platform admin (pass 03) */}
      <Route path="/quiz/manage">
        <ProtectedRoute component={QuizManagement} access="quiz-steward" />
      </Route>
      
      {/* Me — member-owned surface: profile, notifications, quiz history */}
      <Route path="/me">
        <ProtectedRoute component={MePage} />
      </Route>

      {/* Agreement-consent gate for pending memberships (CONSENT_GATE_PATH; the OAuth callback lands here) */}
      <Route path="/welcome/consent">
        <ProtectedRoute component={ConsentGatePage} />
      </Route>

      {/* Legacy member-surface paths — folded into /me */}
      <Route path="/profile">
        <Redirect to="/me" />
      </Route>
      <Route path="/my-quiz-history">
        <Redirect to="/me" />
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
      {/* FX-Exchange: moderation for every exchange steward (the list is steward-scoped by the server) */}
      <Route path="/discover/moderation">
        <Suspense fallback={<LoadingScreen />}><ProtectedRoute component={ModerationPage} /></Suspense>
      </Route>
      <Route path="/discover/hub">
        <Redirect to="/discover" />
      </Route>

      {/* Visual discovery hub - all authenticated users */}
      <Route path="/discover">
        <Suspense fallback={<LoadingScreen />}><ProtectedRoute component={DiscoverHub} /></Suspense>
      </Route>

      {/* Solutions catalogue — folded into discover; orientation journeys remain */}
      <Route path="/solutions">
        <Redirect to="/discover" />
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

      {/* Map page — folded into discover */}
      <Route path="/map">
        <Redirect to="/discover" />
      </Route>

      {/* Journey Map Builder — folded into onboarding flows */}
      <Route path="/admin/journey-maps/new">
        <Redirect to="/onboarding" />
      </Route>
      <Route path="/admin/journey-maps/:id">
        <Redirect to="/onboarding" />
      </Route>
      <Route path="/admin/journey-maps">
        <Redirect to="/onboarding" />
      </Route>

      {/* Admin panel - requires canManageUsers permission */}
      <Route path="/admin/node-admins"><ProtectedRoute component={AdminPanel} access="admin-panel" /></Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminPanel} access="admin-panel" />
      </Route>
      
      {/* User Management - requires isAdmin permission */}
      <Route path="/admin/users">
        <Redirect to="/admin" replace />
      </Route>
      <Route path="/admin/users/:userId/history">
        <Redirect to="/admin" replace />
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
      <Route path="/conflicts/:conflictId/repair-agreements/new"><ProtectedRoute component={RepairAgreementForm} /></Route>
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

      {/* Messaging — /comms and /chat are legacy entries */}
      <Route path="/comms"><Redirect to="/messaging" /></Route>
      <Route path="/messaging"><ProtectedRoute component={MessagingLayout} /></Route>
      <Route path="/chat"><Redirect to="/messaging" /></Route>

      {/* Compliance */}
      <Route path="/compliance">
        <ProtectedRoute component={ComplianceDashboard} />
      </Route>

      {/* Notification settings — folded into /me */}
      <Route path="/settings/notifications">
        <Redirect to="/me" />
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
  const { isAuthenticated, isLoading, pendingConsents, ecosystems, member, isNodeAdmin } = useAuth();
  const [location, navigate] = useLocation();
  useFocusMainOnNavigate(location);
  const gateInput = { isAuthenticated, pendingConsents, memberships: ecosystems, member };
  const heldAtGate = isHeldAtConsentGate(gateInput);

  // OAuth returns to /dashboard; resume the deep link stashed before leaving (see Login.tsx).
  // Keyed on auth and gate state, not navigation: it runs once per sign-in, or once when consent lifts the gate.
  // While the gate holds the member the stash stays put, so consenting lands them where they were going.
  useEffect(() => {
    if (isLoading || !isAuthenticated || heldAtGate) return;
    const destination = takeStashedRedirect();
    if (destination && destination !== location) navigate(destination, { replace: true });
  }, [isAuthenticated, isLoading, heldAtGate]);

  // Public routes that don't need the sidebar
  const publicPaths = ['/login', '/about', '/governance-model', '/users/', '/node/audit'];
  const isPublicPath = publicPaths.some(path => location.startsWith(path));
  const isLandingPage = location === '/';

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Pending members stay on the consent gate wherever a link lands them (lib/consent-gate.ts).
  const consentRedirect = consentGateRedirect({ ...gateInput, isNodeAdmin, path: location });
  if (consentRedirect) {
    return <Redirect to={consentRedirect} replace />;
  }

  // Show landing page for unauthenticated users at root
  if (!isAuthenticated && isLandingPage) {
    return <PublicPageFrame><LandingPage /></PublicPageFrame>;
  }

  // Show public routes without sidebar
  if (!isAuthenticated || isPublicPath) {
    return (
      <PublicPageFrame>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/about" component={About} />
          <Route path="/governance-model" component={GovernanceModel} />
          <Route path="/users/:username" component={PublicProfile} />
          <Route path="/node/audit/:id" component={NodeAudit} />
          <Route path="/node/audit" component={NodeAudit} />
          {!isAuthenticated && <Route><Redirect to={loginRedirectHref(location)} /></Route>}
          {isAuthenticated && <Route><Redirect to="/dashboard" /></Route>}
        </Switch>
      </PublicPageFrame>
    );
  }

  if (isNodeAdmin && !member?.id && ['/', '/dashboard', '/messaging'].includes(location)) return <Redirect to="/admin" replace />;

  // Show authenticated layout with sidebar
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <SkipLink />
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b-2 border-strong-border bg-background px-[var(--page-gutter)]">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            {member?.id && <EcosystemPicker />}
            <div className="flex items-center gap-2">
              {member?.id && <NotificationCenter />}
              <ThemeToggle />
            </div>
          </header>
          {member?.id && <EmergencyBanner />}
          {/* --route-guide-width is set by RouteGuidePanel while it is docked open at lg+ */}
          <main id="main-content" tabIndex={-1} className="route-shell min-w-0 flex-1 overflow-auto lg:pr-[calc(var(--page-gutter)_+_var(--route-guide-width,0px))]">
            <AuthenticatedRoutes />
          </main>
        </div>
      </div>
      <FloatingComms />
      <RouteGuidePanel />
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SupportChatProvider>
        <EcosystemProvider>
          <PageContextProvider>
            <ThemeProvider>
              <TooltipProvider>
                <AppLayout />
                <Toaster />
              </TooltipProvider>
            </ThemeProvider>
          </PageContextProvider>
        </EcosystemProvider>
        </SupportChatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
