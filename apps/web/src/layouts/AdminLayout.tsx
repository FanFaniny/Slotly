import { useState } from "react";
import {
  BarChart3,
  Calendar,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/calendar", label: "Calendar", icon: Calendar },
  { to: "/admin/services", label: "Services", icon: Wrench },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const { data: master } = trpc.auth.getMaster.useQuery(undefined, {
    enabled: !!session,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col justify-between border-r bg-card transition-all duration-300",
          isCollapsed ? "w-16" : "w-56",
        )}
      >
        <div>
          <div
            className={cn(
              "flex h-14 items-center border-b px-4",
              isCollapsed && "justify-center px-2",
            )}
          >
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-lg font-bold text-primary transition-opacity hover:opacity-80 focus:outline-none"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? "S" : "Slotly"}
            </button>
          </div>
          <nav className="space-y-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.to === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isCollapsed && "justify-center px-2",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className={cn("border-t p-3", isCollapsed && "px-2")}>
          {master && !isCollapsed && (
            <p className="mb-2 truncate text-xs text-muted-foreground">
              /{master.username}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full",
              isCollapsed ? "justify-center px-2" : "justify-start",
            )}
            onClick={handleSignOut}
            title={isCollapsed ? "Sign out" : undefined}
          >
            <LogOut className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-2")} />
            {!isCollapsed && "Sign out"}
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
