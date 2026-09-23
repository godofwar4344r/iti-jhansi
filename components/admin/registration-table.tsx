"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ApprovalStatus, Occupation } from "@prisma/client";
import { Check, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import {
  approveRegistrationAction,
  rejectRegistrationAction,
} from "@/actions/admin/registrations";
import { runAction } from "@/lib/run-action";
import { occupationLabel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminRegistrationRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  occupation: Occupation | null;
  approvalStatus: ApprovalStatus;
  approvalNote: string | null;
  approvedAt: Date | null;
  emailVerified: Date | null;
  createdAt: Date;
  approvedBy: { name: string | null; email: string } | null;
};

const STATUS_VARIANT: Record<ApprovalStatus, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  PENDING: "Awaiting approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function RegistrationTable({ rows }: { rows: AdminRegistrationRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState<Record<string, string>>({});

  async function decide(id: string, approve: boolean) {
    setBusyId(id);
    const note = notes[id]?.trim() || "";

    const result = await runAction(() =>
      approve
        ? approveRegistrationAction({ userId: id, note })
        : rejectRegistrationAction({ userId: id, note }),
    );
    setBusyId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Updated.");
    setNotes((state) => ({ ...state, [id]: "" }));
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">No registrations waiting</p>
        <p className="mt-1 text-sm text-muted-foreground">
          New sign-ups will appear here for approval before they can use the portal.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Applicant</TableHead>
            <TableHead>Trade</TableHead>
            <TableHead>Signed up</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const pending = row.approvalStatus === "PENDING";
            return (
              <TableRow key={row.id}>
                <TableCell className="max-w-[260px]">
                  <p className="truncate font-medium">{row.name ?? "(no name yet)"}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                  {row.phone ? (
                    <p className="text-xs text-muted-foreground">{row.phone}</p>
                  ) : null}
                </TableCell>

                <TableCell className="whitespace-nowrap text-sm">
                  {occupationLabel(row.occupation)}
                </TableCell>

                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDate(row.createdAt, true)}
                  <br />
                  {row.emailVerified ? "e-mail verified" : "e-mail unverified"}
                </TableCell>

                <TableCell>
                  <Badge variant={STATUS_VARIANT[row.approvalStatus]}>
                    {STATUS_LABEL[row.approvalStatus]}
                  </Badge>
                  {row.approvalNote ? (
                    <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
                      {row.approvalNote}
                    </p>
                  ) : null}
                  {row.approvedBy && !pending ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      by {row.approvedBy.name ?? row.approvedBy.email}
                      {row.approvedAt ? ` · ${formatDate(row.approvedAt)}` : ""}
                    </p>
                  ) : null}
                </TableCell>

                <TableCell>
                  {pending ? (
                    <div className="flex min-w-[260px] flex-col gap-2">
                      <Input
                        value={notes[row.id] ?? ""}
                        onChange={(event) =>
                          setNotes((state) => ({ ...state, [row.id]: event.target.value }))
                        }
                        placeholder="Note (optional, shown if rejected)"
                        aria-label={`Note for ${row.email}`}
                        className="h-8 text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === row.id}
                          onClick={() => decide(row.id, true)}
                        >
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === row.id}
                          onClick={() => decide(row.id, false)}
                        >
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  ) : row.approvalStatus === "REJECTED" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === row.id}
                      onClick={() => decide(row.id, true)}
                    >
                      <Check className="h-4 w-4" /> Approve anyway
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
