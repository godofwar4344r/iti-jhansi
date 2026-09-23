import { NextResponse } from "next/server";

import { adminGuard, jsonError } from "@/middleware/api-guard";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cross-section lookup powering the admin global search palette. */
export const GET = adminGuard(
  async (req) => {
    const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 120) ?? "";
    if (q.length < 2) return jsonError("Enter at least two characters.", 400);

    const contains = { contains: q, mode: "insensitive" as const };

    try {
      const [users, pdfs, questions] = await Promise.all([
        prisma.user.findMany({
          where: { OR: [{ name: contains }, { email: contains }, { phone: { contains: q } }] },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, email: true, occupation: true },
        }),
        prisma.pdf.findMany({
          where: { OR: [{ title: contains }, { description: contains }, { topic: contains }] },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, occupation: true, topic: true },
        }),
        prisma.question.findMany({
          where: { OR: [{ question: contains }, { topic: contains }] },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, question: true, occupation: true, topic: true },
        }),
      ]);

      return NextResponse.json({ users, pdfs, questions });
    } catch {
      const { getMockUsers, getMockPdfs, getMockQuestions } = await import("@/lib/mock-data");
      const qLower = q.toLowerCase();
      const users = getMockUsers()
        .filter((u) => u.name.toLowerCase().includes(qLower) || u.email.toLowerCase().includes(qLower))
        .slice(0, 5)
        .map((u) => ({ id: u.id, name: u.name, email: u.email, occupation: u.occupation }));
      const pdfs = getMockPdfs()
        .filter((p) => p.title.toLowerCase().includes(qLower) || p.topic.toLowerCase().includes(qLower))
        .slice(0, 5)
        .map((p) => ({ id: p.id, title: p.title, occupation: p.occupation, topic: p.topic }));
      const questions = getMockQuestions()
        .filter((qu) => qu.question.toLowerCase().includes(qLower) || qu.topic.toLowerCase().includes(qLower))
        .slice(0, 5)
        .map((qu) => ({ id: qu.id, question: qu.question, occupation: qu.occupation, topic: qu.topic }));

      return NextResponse.json({ users, pdfs, questions });
    }
  },
  { csrf: false, rateLimit: { action: "mutation", ...RATE_LIMITS.mutation } },
);
