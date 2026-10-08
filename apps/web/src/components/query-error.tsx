import { ApiError } from '@/lib/api-client';

/** Consistent error display for failed queries (e.g. a 403 from a guard
 *  that the nav correctly hides, but which is still reachable by direct
 *  URL — the backend is the real security boundary, this is just UX). */
export function QueryError({ error }: { error: unknown }) {
  const message =
    error instanceof ApiError
      ? error.messages.join(', ')
      : 'Something went wrong loading this page.';

  return (
    <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
      {message}
    </div>
  );
}
