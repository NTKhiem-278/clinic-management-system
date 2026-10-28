import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@/components/DataStates";
import { useRoles } from "@/hooks/useBackend";
import { vi } from "@/lib/i18n";

export function RolesPage() {
  const { data, isLoading, isError, refetch } = useRoles();

  return (
    <>
      <PageHeader title={vi.roles.title} subtitle={vi.roles.subtitle} />
      <section className="rounded-lg border border-border bg-card shadow-subtle">
        {isError ? (
          <ErrorState
            title={vi.common.errorTitle}
            body={vi.common.errorBody}
            retryLabel={vi.common.retry}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <LoadingState label={vi.common.loading} />
        ) : (data ?? []).length === 0 ? (
          <EmptyState title={vi.common.emptyTitle} body={vi.roles.empty} />
        ) : (
          <ul data-ocid="roles.list" className="divide-y divide-border">
            {(data ?? []).map((r, index) => (
              <li
                key={r.id.toString()}
                data-ocid={`roles.item.${index + 1}`}
                className="chart-stripe px-4 py-3 md:px-6"
              >
                <p className="font-medium text-foreground">
                  {vi.roles.names[r.name]}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.permissions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {vi.common.notAvailable}
                    </span>
                  ) : (
                    r.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs text-secondary-foreground"
                      >
                        {permission}
                      </span>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
