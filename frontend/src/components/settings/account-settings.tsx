"use client";

import { BookOpen, LogOut, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export function AccountSettings() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const signOut = async () => {
    try {
      await logout();
    } catch {
      toast.error("Could not sign out cleanly. Your session was cleared locally.");
    }
    router.replace("/login");
  };

  return (
    <>
      <PageHeader title="Settings" description="Your account and session." breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]} />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>The administrator you are signed in as.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <div className="flex items-center gap-3 py-3">
                <User aria-hidden className="size-4 text-muted-foreground" />
                <dt className="w-28 text-sm text-muted-foreground">Username</dt>
                <dd className="text-sm font-medium">{user?.username}</dd>
              </div>
              <div className="flex items-center gap-3 py-3">
                <ShieldCheck aria-hidden className="size-4 text-muted-foreground" />
                <dt className="w-28 text-sm text-muted-foreground">Role</dt>
                <dd className="text-sm font-medium capitalize">{user?.role.toLowerCase()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Session</CardTitle>
              <CardDescription>Sessions end automatically after 30 minutes of inactivity.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={signOut}>
              <LogOut /> Sign out
            </Button>
            <Button asChild variant="ghost">
              <a href="/swagger-ui/index.html" target="_blank" rel="noreferrer">
                <BookOpen /> API documentation
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
