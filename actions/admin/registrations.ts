"use server";

import { revalidatePath } from "next/cache";
import { ApprovalStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ACTIVITY, logActivity } from "@/lib/activity";
import { limitByIp, RATE_LIMITS } from "@/lib/rate-limit";
import { actionError, actionOk, type ActionResult } from "@/types";

const decisionSchema = z.object({
  userId: z.string().min(1, "Missing account id"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

async function guard() {
  try {
    const admin = await requireAdmin();
    const limit = await limitByIp(
      "mutation",
      RATE_LIMITS.mutation.limit,
      RATE_LIMITS.mutation.windowMs,
    );
    if (!limit.success) {
      return { ok: false as const, error: "Too many requests. Please slow down." };
    }
    return { ok: true as const, admin };
  } catch {
    return { ok: false as const, error: "Administrator access is required." };
  }
}

function revalidate() {
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

/** Let a pending registration into the portal. */
export async function approveRegistrationAction(input: unknown): Promise<ActionResult> {
  const gate = await guard();
  if (!gate.ok) return actionError(gate.error);

  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, email: true, approvalStatus: true },
    });
    if (user) {
      if (user.approvalStatus === ApprovalStatus.APPROVED) {
        return actionError("That account is already approved.");
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          approvalStatus: ApprovalStatus.APPROVED,
          approvalNote: parsed.data.note || null,
          approvedAt: new Date(),
          approvedById: gate.admin.id,
          // An approval also lifts a suspension applied at rejection time.
          disabled: false,
        },
      });
    }
  } catch {
    const { updateMockUser } = await import("@/lib/mock-data");
    updateMockUser(parsed.data.userId, {
      approvalStatus: ApprovalStatus.APPROVED,
      approvalNote: parsed.data.note || null,
      approvedAt: new Date(),
      disabled: false,
    });
  }

  await logActivity({
    userId: gate.admin.id,
    action: ACTIVITY.ADMIN_USER_APPROVED,
    detail: parsed.data.userId,
  });

  revalidate();
  return actionOk(undefined, "Registration approved. They can sign in now.");
}

/**
 * Refuse a registration. The row is kept rather than deleted so the same
 * address cannot simply sign up again to bypass the decision, and so the
 * learner can be told why.
 */
export async function rejectRegistrationAction(input: unknown): Promise<ActionResult> {
  const gate = await guard();
  if (!gate.ok) return actionError(gate.error);

  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, email: true, role: true },
    });
    if (user) {
      if (user.id === gate.admin.id) return actionError("You cannot reject your own account.");
      if (user.role === "ADMIN") return actionError("Administrator accounts cannot be rejected.");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          approvalStatus: ApprovalStatus.REJECTED,
          approvalNote: parsed.data.note || null,
          approvedAt: new Date(),
          approvedById: gate.admin.id,
        },
      });

      // Any session already established is cut off immediately.
      await prisma.session.deleteMany({ where: { userId: user.id } });
    }
  } catch {
    const { updateMockUser } = await import("@/lib/mock-data");
    updateMockUser(parsed.data.userId, {
      approvalStatus: ApprovalStatus.REJECTED,
      approvalNote: parsed.data.note || null,
      approvedAt: new Date(),
      disabled: true,
    });
  }

  await logActivity({
    userId: gate.admin.id,
    action: ACTIVITY.ADMIN_USER_REJECTED,
    detail: parsed.data.userId,
  });

  revalidate();
  return actionOk(undefined, "Registration rejected.");
}
