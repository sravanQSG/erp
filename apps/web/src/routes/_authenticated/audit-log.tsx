import type { AuditLogResponse } from '@demo-erp/shared-types';
import { createFileRoute } from '@tanstack/react-router';

import { DataTable, type ColumnDef } from '@/components/data-table';
import { QueryError } from '@/components/query-error';
import { useAuditLog } from '@/queries/audit-log.queries';

export const Route = createFileRoute('/_authenticated/audit-log')({
  component: AuditLogPage,
});

const columns: ColumnDef<AuditLogResponse>[] = [
  {
    accessorKey: 'createdAt',
    header: 'When',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'entityType', header: 'Entity type' },
  { accessorKey: 'entityId', header: 'Entity id' },
  {
    accessorKey: 'metadata',
    header: 'Metadata',
    cell: ({ row }) =>
      row.original.metadata ? (
        <code className="text-xs">{JSON.stringify(row.original.metadata)}</code>
      ) : (
        '—'
      ),
  },
];

function AuditLogPage() {
  const { data: logs, isLoading, isError, error } = useAuditLog();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-muted-foreground">Recent actions within your tenant.</p>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : isError ? (
        <QueryError error={error} />
      ) : (
        <DataTable columns={columns} data={logs ?? []} emptyMessage="No audit log entries yet." />
      )}
    </div>
  );
}
