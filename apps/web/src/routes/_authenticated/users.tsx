import type { TenantUserResponse } from '@demo-erp/shared-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { DataTable, type ColumnDef } from '@/components/data-table';
import { QueryError } from '@/components/query-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInviteUser, useTenantUsers } from '@/queries/users.queries';

export const Route = createFileRoute('/_authenticated/users')({
  component: UsersPage,
});

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required'),
  roleNames: z.string().optional(),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

const columns: ColumnDef<TenantUserResponse>[] = [
  { accessorKey: 'displayName', header: 'Name' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Invited',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
];

function UsersPage() {
  const { data: users, isLoading, isError, error } = useTenantUsers();
  const [inviteOpen, setInviteOpen] = useState(false);
  const inviteUser = useInviteUser();
  const form = useForm<InviteFormValues>({ resolver: zodResolver(inviteSchema) });

  const onInvite = (values: InviteFormValues) => {
    const roleNames = values.roleNames
      ?.split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    inviteUser.mutate(
      { ...values, roleNames: roleNames?.length ? roleNames : undefined },
      {
        onSuccess: () => {
          setInviteOpen(false);
          form.reset();
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-muted-foreground">Users within your tenant.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>Invite user</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : isError ? (
        <QueryError error={error} />
      ) : (
        <DataTable columns={columns} data={users ?? []} emptyMessage="No users yet." />
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onInvite)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-password">Temporary password</Label>
              <Input id="invite-password" type="password" {...form.register('password')} />
              {form.formState.errors.password && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-display-name">Display name</Label>
              <Input id="invite-display-name" {...form.register('displayName')} />
              {form.formState.errors.displayName && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.displayName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-roles">Role names (comma-separated, default: member)</Label>
              <Input id="invite-roles" placeholder="member" {...form.register('roleNames')} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={inviteUser.isPending}>
                {inviteUser.isPending ? 'Inviting...' : 'Invite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
