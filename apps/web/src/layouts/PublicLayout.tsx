import { useState } from "react";
import {
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FeedbackWidget } from "@/components/ui/FeedbackWidget";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export function PublicLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session } = trpc.auth.getSession.useQuery();

  const createReview = trpc.public.review.createReview.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted successfully!");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const { data: findReviews } = trpc.public.review.getReviews.useQuery();

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  const handleFeedback = (feedback: string, rating: number) => {
    createReview.mutate({
      rating: rating,
      comment: feedback,
    });
  }

  const navLinks = [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/profile", label: "Profile", icon: User, exact: false },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col justify-between border-r bg-card p-4 transition-transform duration-200 md:static md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="text-xl font-bold text-primary"
              onClick={() => setIsSidebarOpen(false)}
            >
              Slotly
            </Link>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:bg-accent md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            {session && (
              <Link
                to="/admin"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        <div className="border-t pt-4">
          {session ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <Link to="/login" onClick={() => setIsSidebarOpen(false)}>
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex h-14 items-center border-b px-4 md:hidden">
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 font-semibold">Slotly</span>
        </header>

        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
      {/* Feedback Widget */}
      <FeedbackWidget
        handleFeedback={handleFeedback}
        findReviews={findReviews}
      />
    </div>
  );
}
