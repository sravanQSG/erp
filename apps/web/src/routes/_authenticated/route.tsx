import { PERMISSIONS } from '@demo-erp/shared-types';
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser, useLogout } from '@/hooks/use-auth';
import { getCurrentUser, hasPermission, hasRole } from '@/lib/auth';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!getCurrentUser()) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthenticatedLayout,
});

const navLinkClass =
  'rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground';

function AuthenticatedLayout() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const isPlatformAdmin = hasRole(user, 'platform_admin');
  const canReadUsers = hasPermission(user, PERMISSIONS.USERS_READ);
  const canReadRoles = hasPermission(user, PERMISSIONS.ROLES_READ);
  const canReadAuditLog = hasPermission(user, PERMISSIONS.AUDIT_LOG_READ);

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-56 flex-col gap-1 border-r p-4">
        <div className="mb-4 text-lg font-semibold">demo-erp</div>
        <nav className="flex flex-col gap-1">
          <Link to="/" className={navLinkClass} activeProps={{ className: 'bg-accent' }}>
            Dashboard
          </Link>
          {isPlatformAdmin && (
            <Link
              to="/tenants"
              className={navLinkClass}
              activeProps={{ className: 'bg-accent' }}
            >
              Tenants
            </Link>
          )}
          {canReadUsers && (
            <Link
              to="/users"
              className={navLinkClass}
              activeProps={{ className: 'bg-accent' }}
            >
              Users
            </Link>
          )}
          {canReadRoles && (
            <Link
              to="/roles"
              className={navLinkClass}
              activeProps={{ className: 'bg-accent' }}
            >
              Roles
            </Link>
          )}
          {canReadAuditLog && (
            <Link
              to="/audit-log"
              className={navLinkClass}
              activeProps={{ className: 'bg-accent' }}
            >
              Audit Log
            </Link>
          )}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end border-b px-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {user?.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => logout.mutate()}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
