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
          "sticky top-0 flex h-screen shrink-0 flex-col justify-between overflow-hidden border-r bg-card transition-[width] duration-300 ease-in-out select-none",
          isCollapsed ? "w-16" : "w-56",
        )}
      >
        <div>
          <div
            className={cn(
              "flex h-14 items-center border-b transition-all duration-300",
              isCollapsed ? "justify-center px-2" : "px-4",
            )}
          >
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center text-lg font-bold text-primary transition-opacity hover:opacity-80 focus:outline-none"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span>S</span>
              <span
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
                  isCollapsed ? "max-w-0 opacity-0" : "max-w-xs opacity-100",
                )}
              >
                lotly
              </span>
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
                    "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                    isCollapsed ? "justify-center px-0" : "gap-2 px-3",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
                      isCollapsed
                        ? "max-w-0 opacity-0 -translate-x-2"
                        : "max-w-xs opacity-100 translate-x-0",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className={cn("border-t p-3 transition-all duration-300", isCollapsed && "px-2")}>
          {master && (
            <p
              className={cn(
                "mb-2 overflow-hidden truncate text-xs text-muted-foreground transition-all duration-300 whitespace-nowrap",
                isCollapsed ? "max-h-0 opacity-0" : "max-h-6 opacity-100",
              )}
            >
              /{master.username}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full transition-all duration-300",
              isCollapsed ? "justify-center px-0" : "justify-start gap-2",
            )}
            onClick={handleSignOut}
            title={isCollapsed ? "Sign out" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
                isCollapsed
                  ? "max-w-0 opacity-0 -translate-x-2"
                  : "max-w-xs opacity-100 translate-x-0",
              )}
            >
              Sign out
            </span>
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
