import { Navigate } from "react-router-dom";

import { AuthPanel } from "@/components/AuthPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export function LoginPage() {
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();

  if (isLoading) return <p className="text-center text-muted-foreground">Loading…</p>;
  if (session) return <Navigate to="/admin" replace />;

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your Slotly dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthPanel />
        </CardContent>
      </Card>
    </div>
  );
}
