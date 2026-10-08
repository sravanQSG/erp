import type { TenantResponse } from '@demo-erp/shared-types';
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
import {
  useBootstrapTenantAdmin,
  useCreateTenant,
  useTenants,
} from '@/queries/tenants.queries';

export const Route = createFileRoute('/_authenticated/tenants')({
  component: TenantsPage,
});

const createTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Lowercase letters, digits, and underscores only; must start with a letter',
    ),
});
type CreateTenantValues = z.infer<typeof createTenantSchema>;

const bootstrapAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required'),
});
type BootstrapAdminValues = z.infer<typeof bootstrapAdminSchema>;

const columns: ColumnDef<TenantResponse>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'schemaName', header: 'Schema' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
];

function TenantsPage() {
  const { data: tenants, isLoading, isError, error } = useTenants();
  const [createOpen, setCreateOpen] = useState(false);
  const [bootstrapTenant, setBootstrapTenant] = useState<TenantResponse | null>(null);

  const createTenant = useCreateTenant();
  const bootstrapAdmin = useBootstrapTenantAdmin();

  const createForm = useForm<CreateTenantValues>({
    resolver: zodResolver(createTenantSchema),
  });
  const bootstrapForm = useForm<BootstrapAdminValues>({
    resolver: zodResolver(bootstrapAdminSchema),
  });

  const onCreateTenant = (values: CreateTenantValues) => {
    createTenant.mutate(values, {
      onSuccess: () => {
        setCreateOpen(false);
        createForm.reset();
      },
    });
  };

  const onBootstrapAdmin = (values: BootstrapAdminValues) => {
    if (!bootstrapTenant) return;
    bootstrapAdmin.mutate(
      { tenantId: bootstrapTenant.id, ...values },
      {
        onSuccess: () => {
          setBootstrapTenant(null);
          bootstrapForm.reset();
        },
      },
    );
  };

  const tableColumns: ColumnDef<TenantResponse>[] = [
    ...columns,
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBootstrapTenant(row.original)}
        >
          Bootstrap admin
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tenants</h1>
          <p className="text-muted-foreground">Platform-admin only.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create tenant</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : isError ? (
        <QueryError error={error} />
      ) : (
        <DataTable columns={tableColumns} data={tenants ?? []} emptyMessage="No tenants yet." />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create tenant</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={createForm.handleSubmit(onCreateTenant)}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="tenant-name">Name</Label>
              <Input id="tenant-name" {...createForm.register('name')} />
              {createForm.formState.errors.name && (
                <p className="text-destructive text-sm">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tenant-slug">Slug</Label>
              <Input id="tenant-slug" placeholder="acme" {...createForm.register('slug')} />
              {createForm.formState.errors.slug && (
                <p className="text-destructive text-sm">
                  {createForm.formState.errors.slug.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createTenant.isPending}>
                {createTenant.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!bootstrapTenant}
        onOpenChange={(open) => !open && setBootstrapTenant(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bootstrap admin for {bootstrapTenant?.name}</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={bootstrapForm.handleSubmit(onBootstrapAdmin)}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" type="email" {...bootstrapForm.register('email')} />
              {bootstrapForm.formState.errors.email && (
                <p className="text-destructive text-sm">
                  {bootstrapForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                {...bootstrapForm.register('password')}
              />
              {bootstrapForm.formState.errors.password && (
                <p className="text-destructive text-sm">
                  {bootstrapForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-display-name">Display name</Label>
              <Input id="admin-display-name" {...bootstrapForm.register('displayName')} />
              {bootstrapForm.formState.errors.displayName && (
                <p className="text-destructive text-sm">
                  {bootstrapForm.formState.errors.displayName.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={bootstrapAdmin.isPending}>
                {bootstrapAdmin.isPending ? 'Creating...' : 'Create admin'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
