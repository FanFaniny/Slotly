import { Link } from "react-router-dom";

import { AuthPanel } from "@/components/AuthPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export function HomePage() {
  const { data: session } = trpc.auth.getSession.useQuery();
  const { data: master } = trpc.auth.getMaster.useQuery(undefined, {
    enabled: !!session,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Slotly</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Online booking for service professionals
        </p>
      </div>

      {session && master ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {master.displayName}</CardTitle>
            <CardDescription>
              Your public booking page is ready
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link to="/admin">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/${master.username}`}>View booking page</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Create an account to set up your booking page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthPanel />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
