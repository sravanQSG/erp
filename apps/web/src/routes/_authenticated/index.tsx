import { createFileRoute } from '@tanstack/react-router';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/use-auth';

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user } = useCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.email}.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your access</CardTitle>
          <CardDescription>
            {user?.tenantId
              ? `Tenant-scoped user (tenant ${user.tenantId})`
              : 'Platform-level account (not scoped to a tenant)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div>
            <span className="font-medium">Roles: </span>
            {user?.roles.length ? user.roles.join(', ') : 'none'}
          </div>
          <div>
            <span className="font-medium">Permissions: </span>
            {user?.permissions.length ? user.permissions.join(', ') : 'none'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
