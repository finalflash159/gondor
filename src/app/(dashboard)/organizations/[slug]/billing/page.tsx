'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Building, Loader2, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [loading, setLoading] = useState(true);
  const [userOrgRole, setUserOrgRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      try {
        const [orgRes, sessionRes] = await Promise.all([
          fetch(`/api/organizations/${slug}`),
          fetch('/api/auth/session'),
        ]);

        if (orgRes.ok && sessionRes.ok) {
          const orgJson = await orgRes.json();
          const orgData = orgJson?.data ?? orgJson;
          const sessionJson = await sessionRes.json();
          const userId = sessionJson?.user?.id;
          const myMembership = orgData?.members?.find(
            (member: { userId: string; role: string }) => member.userId === userId
          );
          setUserOrgRole(myMembership?.role ?? null);
        } else {
          setUserOrgRole(null);
        }
      } catch {
        setUserOrgRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userOrgRole || userOrgRole === 'member') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-danger" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          You need admin or owner role to manage billing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription and billing</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Billing Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This feature is currently under development. Contact us at support@gondor.dev for enterprise pricing.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => window.location.href = 'mailto:support@gondor.dev'}>
            Contact Sales
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
