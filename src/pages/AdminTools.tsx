import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function AdminTools() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Admin Tools - Express Credit & Financial Solutions";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Administrative tools for Express Credit & Financial Solutions.');
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <main className="container mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Admin Tools</h1>
          <p className="text-muted-foreground">Quick utilities and diagnostics.</p>
        </header>
        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostics</CardTitle>
              <CardDescription>Run audits and health checks.</CardDescription>
            </CardHeader>
            <CardContent>
              Coming soon.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
              <CardDescription>Admin-only maintenance tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              Coming soon.
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
