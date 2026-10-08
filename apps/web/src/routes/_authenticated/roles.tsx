import { ALL_PERMISSION_KEYS, type RoleResponse } from '@demo-erp/shared-types';
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
import { useCreateRole, useRoles } from '@/queries/roles.queries';

export const Route = createFileRoute('/_authenticated/roles')({
  component: RolesPage,
});

const createRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});
type CreateRoleValues = z.infer<typeof createRoleSchema>;

const columns: ColumnDef<RoleResponse>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Description' },
  {
    accessorKey: 'isSystem',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant={row.original.isSystem ? 'secondary' : 'outline'}>
        {row.original.isSystem ? 'System' : 'Custom'}
      </Badge>
    ),
  },
];

function RolesPage() {
  const { data: roles, isLoading, isError, error } = useRoles();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const createRole = useCreateRole();
  const form = useForm<CreateRoleValues>({ resolver: zodResolver(createRoleSchema) });

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const onCreateRole = (values: CreateRoleValues) => {
    createRole.mutate(
      { ...values, permissions: selectedPermissions as never[] },
      {
        onSuccess: () => {
          setCreateOpen(false);
          form.reset();
          setSelectedPermissions([]);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Roles</h1>
          <p className="text-muted-foreground">Roles within your tenant.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create role</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : isError ? (
        <QueryError error={error} />
      ) : (
        <DataTable columns={columns} data={roles ?? []} emptyMessage="No roles yet." />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create role</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(onCreateRole)}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="role-name">Name</Label>
              <Input id="role-name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role-description">Description</Label>
              <Input id="role-description" {...form.register('description')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Permissions</Label>
              <div className="flex flex-col gap-1.5">
                {ALL_PERMISSION_KEYS.map((permission) => (
                  <label key={permission} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createRole.isPending}>
                {createRole.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
