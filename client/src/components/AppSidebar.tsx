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
import { RoleBadge } from "./RoleBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
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
  const { user, signOut, isSigningOut } = useSupabaseAuth();
  const { legacyRole, canManageContent, canManageUsers, isAdmin } = usePermissions();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      await signOut();
      setLocation("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Get display name from user metadata or email
  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const displayName = `${firstName} ${lastName}`.trim() || user?.email?.split('@')[0] || "User";

  // Get role display for badge
  const roleDisplay = ((legacyRole || 'viewer').charAt(0).toUpperCase() + (legacyRole || 'viewer').slice(1)) as "Admin" | "Facilitator" | "Contributor" | "Viewer";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={`border-b ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className={`${isCollapsed ? 'h-8 w-8' : 'h-10 w-10'} rounded-lg bg-primary flex items-center justify-center flex-shrink-0`}>
            <Compass className={`${isCollapsed ? 'h-4 w-4' : 'h-5 w-5'} text-primary-foreground`} />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="font-bold text-lg truncate">Charting the Course</h2>
              <p className="text-xs text-muted-foreground">Learning Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
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
                  <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                  <AvatarFallback className="text-xs">
                    {displayName.split(' ').map(n => n[0]).join('').toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{roleDisplay}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
              <AvatarFallback>
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <RoleBadge role={roleDisplay} className="text-xs" />
            </div>
          </div>
        )}
        
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild className="w-full justify-center">
                <button onClick={handleLogout} disabled={isSigningOut} data-testid="button-logout">
                  {isSigningOut ? (
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
            <button onClick={handleLogout} disabled={isSigningOut} data-testid="button-logout">
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span>{isSigningOut ? "Logging out..." : "Logout"}</span>
            </button>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
