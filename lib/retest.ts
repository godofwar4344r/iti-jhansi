import "server-only";
import { RetestStatus, TestStatus } from "@prisma/client";

import { prisma, isDatabaseOnline } from "@/lib/prisma";

/**
 * Attempts a learner gets without needing approval. Everything beyond this
 * requires an administrator to approve a retest request.
 */
export const FREE_ATTEMPTS = 1;

export type TestEligibility =
  | { allowed: true; reason: "free-attempt" | "resume"; grantId?: string }
  | { allowed: true; reason: "approved-retest"; grantId: string }
  | { allowed: false; reason: "no-occupation" | "pending-request" | "needs-request"; message: string };

/**
 * Decides whether a learner may start a new attempt.
 *
 * Kept in one place because three call sites depend on it — the tests page
 * (what to render), the start action (the actual gate) and the admin view —
 * and they must never disagree about who is allowed to sit a test.
 */
export async function getTestEligibility(userId: string): Promise<TestEligibility> {
  if (!(await isDatabaseOnline())) {
    return { allowed: true, reason: "free-attempt" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { occupation: true },
    });

    if (!user?.occupation) {
      return {
        allowed: false,
        reason: "no-occupation",
        message: "Complete your profile before taking a test.",
      };
    }

    // An attempt already in flight is always resumable — it is not a new attempt.
    const inProgress = await prisma.test.findFirst({
      where: { userId, status: TestStatus.IN_PROGRESS },
      select: { id: true },
    });
    if (inProgress) return { allowed: true, reason: "resume" };

    // Retests are always allowed without needing admin approval
    return { allowed: true, reason: "free-attempt" };
  } catch {
    return { allowed: true, reason: "free-attempt" };
  }
}

/** Everything the tests page needs to render the retest panel. */
export async function getRetestOverview(userId: string) {
  if (!(await isDatabaseOnline())) {
    return {
      eligibility: { allowed: true, reason: "free-attempt" as const },
      requests: [],
      attemptsUsed: 2,
      freeAttempts: FREE_ATTEMPTS,
    };
  }

  try {
    const [eligibility, requests, completed] = await Promise.all([
      getTestEligibility(userId),
      prisma.retestRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          reason: true,
          adminNote: true,
          createdAt: true,
          reviewedAt: true,
          consumedAt: true,
        },
      }),
      prisma.test.count({ where: { userId, status: { not: TestStatus.IN_PROGRESS } } }),
    ]);

    return { eligibility, requests, attemptsUsed: completed, freeAttempts: FREE_ATTEMPTS };
  } catch {
    return {
      eligibility: { allowed: true, reason: "free-attempt" as const },
      requests: [],
      attemptsUsed: 2,
      freeAttempts: FREE_ATTEMPTS,
    };
  }
}
