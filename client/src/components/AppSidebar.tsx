import { useState } from "react";
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
  BookOpen,
  User,
  Settings,
  LogOut,
  FileEdit,
  Loader2,
  Users,
  Compass,
  MapPin,
  Map,
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
  Bell,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useEcosystem } from "@/contexts/EcosystemContext";

const menuItems = [
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
    title: "Quizzes",
    url: "/quizzes",
    icon: BookOpen,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Map",
    url: "/map",
    icon: MapPin,
  },
];

const governanceGroups = [
  {
    label: "Active Governance",
    defaultOpen: true,
    items: [
      { title: "Dashboard", url: "/governance", icon: LayoutDashboard },
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
      { title: "Ecosystems", url: "/ecosystems", icon: Building2 },
      { title: "Onboarding", url: "/onboarding", icon: UserPlus },
    ],
  },
  {
    label: "Safety & Integrity",
    defaultOpen: false,
    items: [
      { title: "Conflicts", url: "/conflicts", icon: AlertTriangle },
      { title: "Emergency", url: "/emergency", icon: Siren },
      { title: "Exit", url: "/exit", icon: DoorOpen },
      { title: "Safeguards", url: "/safeguards", icon: ShieldCheck },
      { title: "Compliance", url: "/compliance", icon: ClipboardCheck },
    ],
  },
];

// Communications — split view with AI chat + messaging
const commsItems = [
  { title: "Communications", url: "/comms", icon: MessageSquare },
];


const facilitatorItems = [
  {
    title: "Manage Quizzes",
    url: "/quiz/manage",
    icon: FileEdit,
  },
];

const adminItems = [
  {
    title: "Manage Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Journey Maps",
    url: "/admin/journey-maps",
    icon: Map,
  },
  {
    title: "Admin Panel",
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
      <SidebarGroupLabel
        className="cursor-pointer select-none flex items-center justify-between"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{group.label}</span>
        {!isCollapsed && (
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
              open ? "" : "-rotate-90"
            }`}
          />
        )}
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
  const { member, logout } = useAuth();
  const { canManageContent, canManageUsers, isAdmin, canAccessDiscover } = usePermissions();
  const { state } = useSidebar();
  const { ecosystems, selectedIds, toggleEcosystem } = useEcosystem();

  const isCollapsed = state === "collapsed";
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = member?.display_name || 'User';

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
      <SidebarHeader className={`border-b ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className={`${isCollapsed ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg bg-primary flex items-center justify-center flex-shrink-0`}>
            <Compass className={`${isCollapsed ? 'h-4 w-4' : 'h-5 w-5'} text-primary-foreground`} />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="font-bold text-lg truncate">NEOS</h2>
              <p className="text-xs text-muted-foreground">Governance OS</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!isCollapsed && ecosystems.length > 1 && (
          <SidebarGroup>
            <SidebarGroupLabel>Ecosystems</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex flex-col gap-1 px-1">
                {ecosystems.map((eco) => {
                  const isActive = selectedIds.includes(eco.id);
                  return (
                    <button
                      key={eco.id}
                      onClick={() => toggleEcosystem(eco.id)}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                // Discover is only visible to admins or users with at least one ethos_user_access row
                if (item.url === '/discover' && !canAccessDiscover) return null;

                let isActive = location === item.url;
                if (item.url === '/dashboard') isActive = isActive || location === '/';
                if (item.url === '/discover') {
                  isActive = isActive || location.startsWith('/ethos/') || location.startsWith('/orientation/');
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

        {governanceGroups.map((group) => (
          <CollapsibleGovernanceGroup
            key={group.label}
            group={group}
            location={location}
            isCollapsed={isCollapsed}
          />
        ))}

        <SidebarGroup>
          <SidebarGroupLabel>Communication</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canManageContent && (
          <SidebarGroup>
            <SidebarGroupLabel>Quiz Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {facilitatorItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <MenuItemWithTooltip
                      item={item}
                      isActive={location === item.url}
                      isCollapsed={isCollapsed}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(isAdmin || canManageUsers) && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  // Custom active logic
                  let isActive = false;
                  if (item.url === '/admin/users') {
                    isActive = location.startsWith('/admin/users');
                  } else if (item.url === '/admin/journey-maps') {
                    isActive = location.startsWith('/admin/journey-maps');
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

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <MenuItemWithTooltip
                  item={{ title: "Notifications", url: "/settings/notifications", icon: Bell }}
                  isActive={location === '/settings/notifications'}
                  isCollapsed={isCollapsed}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`border-t ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {displayName.split(' ').map(n => n[0]).join('').toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{displayName}</p>
              {member?.current_status && (
                <p className="text-xs text-muted-foreground">{member.current_status}</p>
              )}
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              {member?.current_status && (
                <p className="text-xs text-muted-foreground">{member.current_status}</p>
              )}
            </div>
          </div>
        )}

        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild className="w-full justify-center">
                <button onClick={handleLogout} disabled={isLoggingOut} data-testid="button-logout">
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
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
