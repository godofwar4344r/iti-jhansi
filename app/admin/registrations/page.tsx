import type { Metadata } from "next";
import { Suspense } from "react";

import { requireAdmin } from "@/lib/auth";
import { listRegistrations } from "@/lib/queries/admin";
import { parseListFilter } from "@/lib/search-params";
import { OCCUPATIONS, OCCUPATION_LABELS } from "@/lib/constants";
import { FilterBar } from "@/components/admin/filter-bar";
import { PaginationNav } from "@/components/admin/pagination-nav";
import { RegistrationTable } from "@/components/admin/registration-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Registrations" };

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filter = parseListFilter(params);
  const status = typeof params.status === "string" ? params.status : undefined;

  const result = await listRegistrations({ ...filter, status });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Registrations</h1>
        <p className="mt-1 text-muted-foreground">
          New sign-ups cannot use the portal until you approve them here.
          {result.pendingCount > 0
            ? ` ${result.pendingCount} ${result.pendingCount === 1 ? "person is" : "people are"} waiting.`
            : " Nothing is waiting right now."}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Approval queue</CardTitle>
          <CardDescription>
            {result.total} account(s) match the current filters. Approving lets someone sign in;
            rejecting keeps the record so the same address cannot sign up again to get around it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Suspense fallback={<TableSkeleton rows={1} cols={3} />}>
            <FilterBar
              searchPlaceholder="Search by name, e-mail or phone…"
              selects={[
                {
                  key: "status",
                  label: "Status",
                  placeholder: "All statuses",
                  options: [
                    { value: "pending", label: "Awaiting approval" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                  ],
                },
                {
                  key: "occupation",
                  label: "Occupation",
                  placeholder: "All occupations",
                  options: OCCUPATIONS.map((occupation) => ({
                    value: occupation,
                    label: OCCUPATION_LABELS[occupation],
                  })),
                },
              ]}
            />
          </Suspense>

          <RegistrationTable rows={result.items} />

          <Suspense fallback={null}>
            <PaginationNav
              page={result.page}
              perPage={result.perPage}
              total={result.total}
              totalPages={result.totalPages}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
