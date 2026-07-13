import { useState } from "react";
import { Bell, Settings, AlertTriangle, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

interface Notification {
  id: string;
  type: "urgent" | "standard" | "digest";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

// Placeholder notifications for UI shell - will be connected to real data later
const PLACEHOLDER_NOTIFICATIONS: Notification[] = [];

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications] = useState<Notification[]>(PLACEHOLDER_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "standard":
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case "digest":
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center border border-background p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <Button asChild variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <Link href="/settings/notifications">
                <Settings className="h-3.5 w-3.5" />
                <span className="sr-only">Notification settings</span>
              </Link>
            </Button>
          </div>
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No new notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll see governance updates, proposal activity, and community alerts here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-accent/50 cursor-pointer transition-colors ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">{typeIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.timestamp}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 bg-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Mark all as read
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
