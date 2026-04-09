import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  MessageSquare,
  Bot,
  Siren,
  DoorOpen,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

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

const governanceItems = [
  { title: "Governance", url: "/governance", icon: LayoutDashboard },
  { title: "Agreements", url: "/agreements", icon: FileText },
  { title: "Proposals", url: "/proposals", icon: Vote },
  { title: "Members", url: "/members", icon: Users },
  { title: "Domains", url: "/domains", icon: Globe2 },
  { title: "Decisions", url: "/decisions", icon: Scale },
  { title: "Conflicts", url: "/conflicts", icon: AlertTriangle },
  { title: "Ecosystems", url: "/ecosystems", icon: Building2 },
  { title: "Onboarding", url: "/onboarding", icon: UserPlus },
  { title: "Emergency", url: "/emergency", icon: Siren },
  { title: "Exit", url: "/exit", icon: DoorOpen },
  { title: "Safeguards", url: "/safeguards", icon: ShieldCheck },
];

const communicationItems = [
  { title: "Messaging", url: "/messaging", icon: MessageSquare },
  { title: "AI Chat", url: "/chat", icon: Bot },
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

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { member, logout } = useAuth();
  const { canManageContent, canManageUsers, isAdmin, canAccessDiscover } = usePermissions();
  const { state } = useSidebar();

  const { data: ethosAccessRows = [] } = useQuery({
    queryKey: ['ethos-user-access-sidebar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('ethos_user_access')
        .select('ethos_id')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });
  const hasEthosAccess = ethosAccessRows.length > 0;
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
              <p className="text-xs text-muted-foreground">Governance Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                // Discover is only visible to admins or users with at least one ethos_user_access row
                if (item.url === '/discover' && !isAdmin && !hasEthosAccess) return null;

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

        <SidebarGroup>
          <SidebarGroupLabel>Governance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {governanceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <MenuItemWithTooltip
                    item={item}
                    isActive={location === item.url || location.startsWith(item.url + '/')}
                    isCollapsed={isCollapsed}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Communication</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communicationItems.map((item) => (
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
