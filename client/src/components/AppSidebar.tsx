import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  FileEdit,
  Loader2,
  Users,
  Compass,
  FileText,
  Vote,
  Globe2,
  Scale,
  AlertTriangle,
  Building2,
  UserPlus,
  Siren,
  DoorOpen,
  ShieldCheck,
  ClipboardCheck,
  ChevronDown,
  MessageSquare,
  Bell,
  Package,
  Flag, // FX-Exchange: Moderation
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NodeAdminBadge } from "@/components/NodeAdminBadge";
import { CONSENT_GATE_PATH, memberStatusLabel } from "@/lib/member-status";
import { canOpenAdminPanel, visibleNavItems, type NavAccess } from "@/lib/nav-access";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavPermissions } from "@/hooks/use-nav-permissions";
import { useEcosystem } from "@/contexts/EcosystemContext";
import { useModeratedEcosystems } from "@/hooks/use-discover"; // FX-Exchange
import { useConversations } from "@/hooks/use-messaging";
import { moderatedInSelection } from "@/lib/exchange"; // FX-Exchange

const menuItems = [
  { title: 'Communities', url: '/communities', icon: Users },
  { title: 'Updates', url: '/updates', icon: Bell },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Discover",
    url: "/discover",
    icon: Compass,
  },
  {
    title: "Me",
    url: "/me",
    icon: User,
  },
];

// tier: member = always visible (member rights); steward = platform perms or any ecosystem membership
type GovernanceItem = { title: string; url: string; icon: any; tier?: "member" | "steward" };

const governanceGroups: { label: string; defaultOpen: boolean; items: GovernanceItem[] }[] = [
  {
    label: "Active Governance",
    defaultOpen: true,
    items: [
      { title: "Agreements", url: "/agreements", icon: FileText },
      { title: "Proposals", url: "/proposals", icon: Vote },
      { title: "Decisions", url: "/decisions", icon: Scale },
    ],
  },
  {
    label: "Community",
    defaultOpen: false,
    items: [
      { title: "Members", url: "/members", icon: Users },
      { title: "Domains", url: "/domains", icon: Globe2 },
      { title: "Teams", url: "/teams", icon: Users },
      { title: "Ecosystems", url: "/ecosystems", icon: Building2 },
      { title: "Newcomers", url: "/onboarding", icon: UserPlus }, // FX-Onboard: stewards of a selected ecosystem only
    ],
  },
  {
    label: "Safety & Integrity",
    defaultOpen: false,
    items: [
      { title: "Conflicts", url: "/conflicts", icon: AlertTriangle, tier: "member" },
      { title: "Emergency", url: "/emergency", icon: Siren, tier: "member" }, // any member may declare (with a co-signer)
      { title: "Exit", url: "/exit", icon: DoorOpen, tier: "member" },
      { title: "Safeguards", url: "/safeguards", icon: ShieldCheck, tier: "member" },
      { title: "Compliance", url: "/compliance", icon: ClipboardCheck, tier: "steward" },
    ],
  },
];

// Messaging — /comms and /chat redirect here
const commsItems = [
  { title: "Messaging", url: "/messaging", icon: MessageSquare },
];


// `access` names the destination's own gate (lib/nav-access.ts).
const facilitatorItems: { title: string; url: string; icon: any; access: NavAccess }[] = [
  {
    title: "Manage Quizzes",
    url: "/quiz/manage",
    icon: FileEdit,
    access: "quiz-steward",
  },
  {
    title: "Manage Shares & Needs",
    url: "/admin",
    icon: Package,
    access: "admin-panel",
  },
];

const adminItems = [
  {
    title: "Node admins",
    url: "/admin/node-admins",
    icon: Users,
  },
  {
    title: "Node Administration",
    url: "/admin",
    icon: Settings,
  },
];

// Menu item with tooltip for collapsed state
function MenuItemWithTooltip({
  item,
  isActive,
  isCollapsed
}: {
  item: { title: string; url: string; icon: any };
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const button = (
    <SidebarMenuButton asChild isActive={isActive}>
      <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
        <item.icon className="h-4 w-4" />
        <span>{item.title}</span>
      </Link>
    </SidebarMenuButton>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

function CollapsibleGovernanceGroup({
  group,
  location,
  isCollapsed,
}: {
  group: (typeof governanceGroups)[number];
  location: string;
  isCollapsed: boolean;
}) {
  const [open, setOpen] = useState(group.defaultOpen);

  return (
    <SidebarGroup>
      <SidebarGroupLabel asChild>
        <button
          type="button"
          className="flex w-full cursor-pointer select-none items-center justify-between"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span>{group.label}</span>
          {!isCollapsed && (
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                open ? "" : "-rotate-90"
              }`}
            />
          )}
        </button>
      </SidebarGroupLabel>
      {(open || isCollapsed) && (
        <SidebarGroupContent>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <MenuItemWithTooltip
                  item={item}
                  isActive={
                    location === item.url ||
                    location.startsWith(item.url + "/")
                  }
                  isCollapsed={isCollapsed}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { member, user, isNodeAdmin, logout } = useAuth();
  const { canManageContent, canManageUsers, isAdmin } = usePermissions();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { ecosystems, selectedIds, toggleEcosystem } = useEcosystem();

  // The mobile sheet overlays the page; close it once a navigation lands.
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location, isMobile, setOpenMobile]);

  const isCollapsed = state === "collapsed";
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const hasStewardAccess = isAdmin || canManageUsers || canManageContent || ecosystems.length > 0;
  // G-Authority: Administration and AdminPanel links follow the server's platform-admin flag, not the profile;
  // Manage Quizzes and Newcomers follow the server's steward rule for the selected ecosystems (FX-Onboard, pass 03);
  // the /quiz/manage route and the Dashboard read the same permissions, so no link opens Access Denied.
  const permissions = useNavPermissions();
  const showAdministration = canOpenAdminPanel(permissions);
  const visibleFacilitatorItems = visibleNavItems(facilitatorItems, permissions);
  const showNewcomers = permissions.stewardsSelection;
  // FX-Exchange: Moderation for an exchange steward of a selected ecosystem (the server's own steward list).
  const showModeration = moderatedInSelection(useModeratedEcosystems().data, selectedIds).length > 0;
  // The same list (and 30 s poll) as the drawer's launcher, so the link, the drawer and /messaging agree.
  const unreadMessages = (useConversations().data?.conversations ?? []).reduce((sum, conversation) => sum + conversation.unread_count, 0);

  const displayName = user?.display_name || member?.display_name || 'User';

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setLocation("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={`border-b-2 border-sidebar-border ${isCollapsed ? 'p-0.5' : 'p-4'}`}>
        <Link
          href="/dashboard"
          aria-label="NEOS dashboard"
          className={`flex min-h-14 items-center text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${isCollapsed ? 'justify-center' : 'w-full'}`}
        >
          {isCollapsed ? (
            <span className="text-xl font-black tracking-[-0.08em]">N.</span>
          ) : (
            <span className="grid gap-1">
              <span className="text-[0.625rem] font-black uppercase tracking-[0.24em] text-sidebar-foreground/65">Governance / Index 01</span>
              <span className="text-xl font-black uppercase leading-[0.92] tracking-[-0.045em]">NEOS</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent onClick={event => { if (isMobile && (event.target as Element).closest('a[href]')) setOpenMobile(false); }}>
        {isNodeAdmin && <SidebarGroup><SidebarGroupLabel>Node support</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><MenuItemWithTooltip item={{title:'Node Administration',url:'/admin',icon:Settings}} isActive={location.startsWith('/admin')} isCollapsed={isCollapsed} /></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>}
        {!isCollapsed && ecosystems.length > 1 && (
          <SidebarGroup>
            <SidebarGroupLabel>Current ecosystem</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex flex-col gap-1 px-1">
                {ecosystems.map((eco) => {
                  const isActive = selectedIds.includes(eco.id);
                  return (
                    <button
                      key={eco.id}
                      onClick={() => toggleEcosystem(eco.id)}
                      aria-pressed={isActive}
                      className={`flex min-h-11 items-center gap-2 border-l-2 px-3 py-2 text-left text-sm font-semibold transition-colors ${
                        isActive
                          ? 'border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'border-transparent text-sidebar-foreground/70 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{eco.name}</span>
                    </button>
                  );
                })}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Core / 01</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                let isActive = location === item.url;
                if (item.url === '/dashboard') isActive = isActive || location === '/';
                if (item.url === '/discover') {
                  isActive = isActive || location.startsWith('/discover/') || location.startsWith('/ethos/') || location.startsWith('/orientation/');
                }
                // legacy member-surface paths redirect to /me
                if (item.url === '/me') {
                  isActive = isActive || location === '/profile' || location === '/my-quiz-history' || location.startsWith('/settings/');
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <MenuItemWithTooltip
                      item={item}
                      isActive={isActive}
                      isCollapsed={isCollapsed}
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {governanceGroups.map((group) => {
          // tier-gated: member-right items always visible; steward items proxy via membership until H4 role tiers
          const items =
            group.label === "Safety & Integrity"
              ? group.items.filter((item) => item.tier === "member" || hasStewardAccess)
              : group.items.filter((item) => item.url !== "/onboarding" || showNewcomers);
          return (
            <CollapsibleGovernanceGroup
              key={group.label}
              group={{ ...group, items }}
              location={location}
              isCollapsed={isCollapsed}
            />
          );
        })}

        {member?.id && <SidebarGroup>
          <SidebarGroupLabel>Communication</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === '/messaging' || location.startsWith('/comms') || location.startsWith('/chat')}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {unreadMessages > 0 && (
                        <span className="ml-auto inline-flex min-w-5 shrink-0 items-center justify-center bg-destructive px-1 text-[0.68rem] font-bold leading-5 text-destructive-foreground">
                          <span aria-hidden="true">{unreadMessages > 99 ? "99+" : unreadMessages}</span>
                          <span className="sr-only">, {unreadMessages} unread</span>
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>}

        {/* FX-Exchange: shares-and-needs moderation for stewards of the selected ecosystem */}
        {showModeration && (
          <SidebarGroup>
            <SidebarGroupLabel>Stewarding</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <MenuItemWithTooltip
                    item={{ title: "Moderation", url: "/discover/moderation", icon: Flag }}
                    isActive={location === "/discover/moderation"}
                    isCollapsed={isCollapsed}
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleFacilitatorItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Content Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleFacilitatorItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <MenuItemWithTooltip
                      item={item}
                      isActive={location === item.url || (item.url === '/admin#shares-needs' && location === '/admin')}
                      isCollapsed={isCollapsed}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showAdministration && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  // Custom active logic
                  let isActive = false;
                  if (item.url === '/admin/users') {
                    isActive = location.startsWith('/admin/users');
                  } else if (item.url === '/admin') {
                    isActive = location === '/admin';
                  } else {
                    isActive = location === item.url;
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <MenuItemWithTooltip
                        item={item}
                        isActive={isActive}
                        isCollapsed={isCollapsed}
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>

      <SidebarGroup><SidebarGroupContent><SidebarMenu><SidebarMenuItem><MenuItemWithTooltip item={{ title: "Public support history", url: "/node/audit", icon: ClipboardCheck }} isActive={location.startsWith("/node/audit")} isCollapsed={isCollapsed} /></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>
      <SidebarFooter className={`border-t-2 border-sidebar-border ${isCollapsed ? 'p-0.5' : 'p-4'}`}>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <Avatar className="h-9 w-9 border-2 border-sidebar-border rounded-none">
                  <AvatarFallback className="text-xs">
                    {displayName.split(' ').map(n => n[0]).join('').toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{displayName}</p>
              {member?.current_status && (
                <p className="text-xs text-muted-foreground">{memberStatusLabel(member.current_status)}</p>
              )}
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-11 w-11 border-2 border-sidebar-border rounded-none">
              <AvatarFallback>
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              {isNodeAdmin && <NodeAdminBadge />}
              {member?.current_status === "pending_consent" ? (
                <Link href={CONSENT_GATE_PATH} className="text-xs font-medium text-link underline underline-offset-2">
                  {memberStatusLabel(member.current_status)}
                </Link>
              ) : member?.current_status ? (
                <p className="text-xs text-muted-foreground">{memberStatusLabel(member.current_status)}</p>
              ) : null}
            </div>
          </div>
        )}

        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild className="w-full justify-center">
                {/* Icon-only here; the tooltip is not its accessible name. */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  data-testid="button-logout"
                  aria-label={isLoggingOut ? "Logging out" : "Logout"}
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        ) : (
          <SidebarMenuButton asChild className="w-full">
            <button onClick={handleLogout} disabled={isLoggingOut} data-testid="button-logout">
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </button>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
