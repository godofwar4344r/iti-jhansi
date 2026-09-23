import "server-only";
import { Prisma, Role, TestStatus, RetestStatus, Occupation } from "@prisma/client";

import { prisma, isDatabaseOnline } from "@/lib/prisma";
import { round } from "@/lib/utils";
import { OCCUPATIONS } from "@/lib/constants";
import type { AdminUserRow, AnalyticsRow, ListFilterLike, Paginated } from "@/types/admin";
import {
  getMockUsers,
  getMockActivities,
  getMockPdfs,
  getMockQuestions,
  getMockRetests,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function paginate(filter: ListFilterLike) {
  const page = Math.max(1, filter.page ?? 1);
  const perPage = Math.min(100, Math.max(1, filter.perPage ?? 10));
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

function wrap<T>(items: T[], total: number, page: number, perPage: number): Paginated<T> {
  return { items, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

function dateRange(from?: string, to?: string) {
  const range: Prisma.DateTimeFilter = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) range.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
  }
  return Object.keys(range).length ? range : undefined;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function getMockOverview() {
  const users = getMockUsers();
  const pdfs = getMockPdfs();
  const questions = getMockQuestions();
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => !u.disabled).length;
  const disabledUsers = users.filter((u) => u.disabled).length;

  const occupationCounts = OCCUPATIONS.map((occupation) => ({
    occupation,
    users: users.filter((u) => u.occupation === occupation).length,
  }));

  return {
    totals: {
      totalUsers,
      activeUsers,
      disabledUsers,
      totalPdfs: pdfs.length,
      totalQuestions: questions.length,
      completedTests: 28,
      inProgressTests: 1,
      averageScore: 78.4,
      averageTime: 1120,
      passRate: 85.7,
      unassignedUsers: 0,
    },
    occupationCounts,
    occupationScores: OCCUPATIONS.map((occupation) => ({
      occupation,
      average: 78.5,
      attempts: 7,
    })),
    recentLogins: users.slice(0, 8).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      occupation: u.occupation,
      lastLoginAt: u.lastLoginAt,
      image: null,
    })),
    recentAttempts: [
      {
        id: "demo-att-1",
        percentage: 84.0,
        score: 42,
        totalQuestions: 50,
        status: TestStatus.PASSED,
        submittedAt: new Date(Date.now() - 1800000),
        occupation: Occupation.FITTER,
        user: { name: "Rahul Sharma (शिक्षार्थी)", email: "student@maapitambra.edu" },
      },
      {
        id: "demo-att-2",
        percentage: 76.0,
        score: 38,
        totalQuestions: 50,
        status: TestStatus.PASSED,
        submittedAt: new Date(Date.now() - 7200000),
        occupation: Occupation.ELECTRICIAN,
        user: { name: "Amit Verma", email: "amit.verma@example.com" },
      },
      {
        id: "demo-att-3",
        percentage: 92.0,
        score: 46,
        totalQuestions: 50,
        status: TestStatus.PASSED,
        submittedAt: new Date(Date.now() - 86400000),
        occupation: Occupation.BASIC_COSMETOLOGY,
        user: { name: "Pooja Singh", email: "pooja.singh@example.com" },
      },
    ],
  };
}

export async function getAdminOverview() {
  if (!(await isDatabaseOnline())) {
    return getMockOverview();
  }

  try {
    const [
      totalUsers,
      activeUsers,
      disabledUsers,
      totalPdfs,
      totalQuestions,
      completedTests,
      inProgressTests,
      aggregate,
      byOccupation,
      recentLogins,
      recentAttempts,
      passCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { disabled: false } }),
      prisma.user.count({ where: { disabled: true } }),
      prisma.pdf.count(),
      prisma.question.count(),
      prisma.test.count({ where: { status: { not: TestStatus.IN_PROGRESS } } }),
      prisma.test.count({ where: { status: TestStatus.IN_PROGRESS } }),
      prisma.test.aggregate({
        where: { status: { not: TestStatus.IN_PROGRESS } },
        _avg: { percentage: true, timeTaken: true },
      }),
      prisma.user.groupBy({ by: ["occupation"], _count: { _all: true } }),
      prisma.user.findMany({
        where: { lastLoginAt: { not: null } },
        orderBy: { lastLoginAt: "desc" },
        take: 8,
        select: { id: true, name: true, email: true, occupation: true, lastLoginAt: true, image: true },
      }),
      prisma.test.findMany({
        where: { status: { not: TestStatus.IN_PROGRESS } },
        orderBy: { submittedAt: "desc" },
        take: 8,
        select: {
          id: true,
          percentage: true,
          score: true,
          totalQuestions: true,
          status: true,
          submittedAt: true,
          occupation: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.test.count({ where: { status: TestStatus.PASSED } }),
    ]);

    const occupationCounts = OCCUPATIONS.map((occupation) => ({
      occupation,
      users: byOccupation.find((row) => row.occupation === occupation)?._count._all ?? 0,
    }));

    const perOccupationScores = await prisma.test.groupBy({
      by: ["occupation"],
      where: { status: { not: TestStatus.IN_PROGRESS } },
      _avg: { percentage: true },
      _count: { _all: true },
    });

    return {
      totals: {
        totalUsers,
        activeUsers,
        disabledUsers,
        totalPdfs,
        totalQuestions,
        completedTests,
        inProgressTests,
        averageScore: round(aggregate._avg.percentage ?? 0, 1),
        averageTime: Math.round(aggregate._avg.timeTaken ?? 0),
        passRate: completedTests ? round((passCount / completedTests) * 100, 1) : 0,
        unassignedUsers:
          totalUsers - occupationCounts.reduce((sum, row) => sum + row.users, 0),
      },
      occupationCounts,
      occupationScores: OCCUPATIONS.map((occupation) => ({
        occupation,
        average: round(
          perOccupationScores.find((row) => row.occupation === occupation)?._avg.percentage ?? 0,
          1,
        ),
        attempts: perOccupationScores.find((row) => row.occupation === occupation)?._count._all ?? 0,
      })),
      recentLogins,
      recentAttempts,
    };
  } catch (error) {
    return getMockOverview();
  }
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

function getMockUsersPaginated(
  filter: ListFilterLike,
  skip: number,
  take: number,
  page: number,
  perPage: number,
) {
  let users = getMockUsers();
  if (filter.q?.trim()) {
    const q = filter.q.trim().toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)),
    );
  }
  if (filter.occupation) users = users.filter((u) => u.occupation === filter.occupation);
  if (filter.status === "disabled") users = users.filter((u) => u.disabled);
  if (filter.status === "active") users = users.filter((u) => !u.disabled);
  if (filter.status === "admins") users = users.filter((u) => u.role === Role.ADMIN);

  const total = users.length;
  const paginated = users.slice(skip, skip + take);

  return wrap(
    paginated.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      occupation: u.occupation,
      role: u.role,
      disabled: u.disabled,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      testsTaken: u.testsTaken,
    })),
    total,
    page,
    perPage,
  );
}

export async function listUsers(filter: ListFilterLike): Promise<Paginated<AdminUserRow>> {
  const { page, perPage, skip, take } = paginate(filter);

  if (!(await isDatabaseOnline())) {
    return getMockUsersPaginated(filter, skip, take, page, perPage);
  }

  try {
    const where: Prisma.UserWhereInput = {};
    if (filter.q?.trim()) {
      const q = filter.q.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }
    if (filter.occupation) where.occupation = filter.occupation;
    if (filter.status === "disabled") where.disabled = true;
    if (filter.status === "active") where.disabled = false;
    if (filter.status === "admins") where.role = Role.ADMIN;
    if (filter.status === "unverified") where.emailVerified = null;

    const created = dateRange(filter.from, filter.to);
    if (created) where.createdAt = created;

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          occupation: true,
          role: true,
          disabled: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { tests: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return wrap(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        occupation: row.occupation,
        role: row.role,
        disabled: row.disabled,
        emailVerified: row.emailVerified,
        createdAt: row.createdAt,
        lastLoginAt: row.lastLoginAt,
        testsTaken: row._count.tests,
      })),
      total,
      page,
      perPage,
    );
  } catch (error) {
    return getMockUsersPaginated(filter, skip, take, page, perPage);
  }
}

// ---------------------------------------------------------------------------
// PDFs
// ---------------------------------------------------------------------------

function getMockPdfsPaginated(
  filter: ListFilterLike,
  skip: number,
  take: number,
  page: number,
  perPage: number,
) {
  let items = getMockPdfs();
  if (filter.q?.trim()) {
    const q = filter.q.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.topic.toLowerCase().includes(q),
    );
  }
  if (filter.occupation) items = items.filter((p) => p.occupation === filter.occupation);
  const total = items.length;
  return wrap(items.slice(skip, skip + take), total, page, perPage);
}

export async function listPdfs(filter: ListFilterLike) {
  const { page, perPage, skip, take } = paginate(filter);

  if (!(await isDatabaseOnline())) {
    return getMockPdfsPaginated(filter, skip, take, page, perPage);
  }

  try {
    const where: Prisma.PdfWhereInput = {};
    if (filter.q?.trim()) {
      const q = filter.q.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { topic: { contains: q, mode: "insensitive" } },
      ];
    }
    if (filter.occupation) where.occupation = filter.occupation;

    const [items, total] = await Promise.all([
      prisma.pdf.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          uploadedBy: { select: { name: true, email: true } },
          _count: { select: { views: true, bookmarks: true, questions: true } },
        },
      }),
      prisma.pdf.count({ where }),
    ]);

    return wrap(items, total, page, perPage);
  } catch (error) {
    return getMockPdfsPaginated(filter, skip, take, page, perPage);
  }
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

function getMockQuestionsPaginated(
  filter: ListFilterLike,
  skip: number,
  take: number,
  page: number,
  perPage: number,
) {
  let items = getMockQuestions();
  if (filter.q?.trim()) {
    const q = filter.q.trim().toLowerCase();
    items = items.filter(
      (it) =>
        it.question.toLowerCase().includes(q) ||
        it.topic.toLowerCase().includes(q) ||
        (it.explanation && it.explanation.toLowerCase().includes(q)),
    );
  }
  if (filter.occupation) items = items.filter((it) => it.occupation === filter.occupation);
  if (filter.difficulty) items = items.filter((it) => it.difficulty === filter.difficulty);
  const total = items.length;
  const topics = Array.from(new Set(items.map((it) => it.topic))).sort();
  return { ...wrap(items.slice(skip, skip + take), total, page, perPage), topics };
}

export async function listQuestions(filter: ListFilterLike) {
  const { page, perPage, skip, take } = paginate(filter);

  if (!(await isDatabaseOnline())) {
    return getMockQuestionsPaginated(filter, skip, take, page, perPage);
  }

  try {
    const where: Prisma.QuestionWhereInput = {};
    if (filter.q?.trim()) {
      const q = filter.q.trim();
      where.OR = [
        { question: { contains: q, mode: "insensitive" } },
        { topic: { contains: q, mode: "insensitive" } },
        { explanation: { contains: q, mode: "insensitive" } },
      ];
    }
    if (filter.occupation) where.occupation = filter.occupation;
    if (filter.difficulty) where.difficulty = filter.difficulty;
    if (filter.status === "active") where.active = true;
    if (filter.status === "inactive") where.active = false;

    const [items, total, topics] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { sourcePdf: { select: { title: true } } },
      }),
      prisma.question.count({ where }),
      prisma.question.findMany({
        where: filter.occupation ? { occupation: filter.occupation } : {},
        select: { topic: true },
        distinct: ["topic"],
        orderBy: { topic: "asc" },
      }),
    ]);

    return { ...wrap(items, total, page, perPage), topics: topics.map((t) => t.topic) };
  } catch (error) {
    return getMockQuestionsPaginated(filter, skip, take, page, perPage);
  }
}

// ---------------------------------------------------------------------------
// Test analytics
// ---------------------------------------------------------------------------

function analyticsWhere(filter: ListFilterLike): Prisma.TestWhereInput {
  const where: Prisma.TestWhereInput = { status: { not: TestStatus.IN_PROGRESS } };

  if (filter.q?.trim()) {
    const q = filter.q.trim();
    where.user = {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    };
  }
  if (filter.occupation) where.occupation = filter.occupation;
  if (filter.status === "passed") where.status = TestStatus.PASSED;
  if (filter.status === "failed") where.status = TestStatus.FAILED;

  const submitted = dateRange(filter.from, filter.to);
  if (submitted) where.submittedAt = submitted;

  if (filter.minScore !== undefined || filter.maxScore !== undefined) {
    where.percentage = {
      ...(filter.minScore !== undefined ? { gte: filter.minScore } : {}),
      ...(filter.maxScore !== undefined ? { lte: filter.maxScore } : {}),
    };
  }

  return where;
}

const analyticsSelect = {
  id: true,
  score: true,
  totalQuestions: true,
  percentage: true,
  status: true,
  timeTaken: true,
  createdAt: true,
  submittedAt: true,
  occupation: true,
  user: { select: { name: true, email: true, phone: true } },
  _count: { select: { answers: true } },
  answers: { select: { correct: true, selectedAnswer: true } },
} satisfies Prisma.TestSelect;

type AnalyticsRecord = Prisma.TestGetPayload<{ select: typeof analyticsSelect }>;

function toAnalyticsRow(test: AnalyticsRecord): AnalyticsRow {
  const correct = test.answers.filter((a) => a.correct).length;
  const answered = test.answers.filter((a) => a.selectedAnswer !== null).length;
  return {
    testId: test.id,
    name: test.user.name,
    email: test.user.email,
    phone: test.user.phone,
    occupation: test.occupation,
    score: test.score,
    totalQuestions: test.totalQuestions,
    percentage: test.percentage,
    correct,
    wrong: answered - correct,
    timeTaken: test.timeTaken,
    status: test.status,
    createdAt: test.submittedAt ?? test.createdAt,
  };
}

function getMockAnalyticsRows(page: number, perPage: number): Paginated<AnalyticsRow> {
  const rows: AnalyticsRow[] = [
    {
      testId: "demo-test-1",
      name: "Rahul Sharma (शिक्षार्थी)",
      email: "student@maapitambra.edu",
      phone: "9876543211",
      occupation: "FITTER",
      score: 42,
      totalQuestions: 50,
      percentage: 84.0,
      correct: 42,
      wrong: 8,
      timeTaken: 1140,
      status: "PASSED",
      createdAt: new Date(Date.now() - 1800000),
    },
    {
      testId: "demo-test-2",
      name: "Amit Verma",
      email: "amit.verma@example.com",
      phone: "9876543212",
      occupation: "ELECTRICIAN",
      score: 38,
      totalQuestions: 50,
      percentage: 76.0,
      correct: 38,
      wrong: 12,
      timeTaken: 1260,
      status: "PASSED",
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      testId: "demo-test-3",
      name: "Pooja Singh",
      email: "pooja.singh@example.com",
      phone: "9876543213",
      occupation: "BASIC_COSMETOLOGY",
      score: 46,
      totalQuestions: 50,
      percentage: 92.0,
      correct: 46,
      wrong: 4,
      timeTaken: 960,
      status: "PASSED",
      createdAt: new Date(Date.now() - 86400000),
    },
  ];
  return wrap(rows, rows.length, page, perPage);
}

export async function listTestAnalytics(filter: ListFilterLike): Promise<Paginated<AnalyticsRow>> {
  const { page, perPage, skip, take } = paginate(filter);

  if (!(await isDatabaseOnline())) {
    return getMockAnalyticsRows(page, perPage);
  }

  try {
    const where = analyticsWhere(filter);

    const [rows, total] = await Promise.all([
      prisma.test.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip,
        take,
        select: analyticsSelect,
      }),
      prisma.test.count({ where }),
    ]);

    return wrap(rows.map(toAnalyticsRow), total, page, perPage);
  } catch (error) {
    return getMockAnalyticsRows(page, perPage);
  }
}

/** Unpaginated variant used by the CSV / Excel / PDF exporters. */
export async function getAnalyticsForExport(filter: ListFilterLike, cap = 5000) {
  if (!(await isDatabaseOnline())) {
    return getMockAnalyticsRows(1, cap).items;
  }

  try {
    const rows = await prisma.test.findMany({
      where: analyticsWhere(filter),
      orderBy: { submittedAt: "desc" },
      take: cap,
      select: analyticsSelect,
    });
    return rows.map(toAnalyticsRow);
  } catch (error) {
    const result = await listTestAnalytics(filter);
    return result.items;
  }
}

export async function getUsersForExport(filter: ListFilterLike, cap = 5000) {
  const result = await listUsers({ ...filter, page: 1, perPage: Math.min(cap, 100) });
  if (result.total <= result.items.length) return result.items;

  const all = [...result.items];
  for (let page = 2; page <= result.totalPages && all.length < cap; page++) {
    const next = await listUsers({ ...filter, page, perPage: 100 });
    all.push(...next.items);
  }
  return all.slice(0, cap);
}

export async function getActivityFeed(take = 50) {
  if (!(await isDatabaseOnline())) {
    return getMockActivities().slice(0, take);
  }

  try {
    return await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        action: true,
        detail: true,
        ip: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });
  } catch (error) {
    return getMockActivities().slice(0, take);
  }
}

// ---------------------------------------------------------------------------
// Registrations queue
// ---------------------------------------------------------------------------

function getMockRegistrationsPaginated(page: number, perPage: number) {
  const users = getMockUsers().filter((u) => u.role === "USER");
  return {
    ...wrap(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        occupation: u.occupation,
        approvalStatus: u.approvalStatus as any,
        approvalNote: u.approvalNote,
        approvedAt: u.approvedAt,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        approvedBy: { name: "System", email: "admin@maapitambra.edu" },
      })),
      users.length,
      page,
      perPage,
    ),
    pendingCount: 0,
  };
}

export async function listRegistrations(filter: ListFilterLike & { status?: string }) {
  const { page, perPage, skip, take } = paginate(filter);

  if (!(await isDatabaseOnline())) {
    return getMockRegistrationsPaginated(page, perPage);
  }

  try {
    const where: Prisma.UserWhereInput = { role: "USER" };
    if (filter.q?.trim()) {
      const q = filter.q.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }
    if (filter.occupation) where.occupation = filter.occupation;
    if (filter.status === "pending") where.approvalStatus = "PENDING";
    else if (filter.status === "approved") where.approvalStatus = "APPROVED";
    else if (filter.status === "rejected") where.approvalStatus = "REJECTED";

    const [items, total, pendingCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          occupation: true,
          approvalStatus: true,
          approvalNote: true,
          approvedAt: true,
          emailVerified: true,
          createdAt: true,
          approvedBy: { select: { name: true, email: true } },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { role: "USER", approvalStatus: "PENDING" } }),
    ]);

    return { ...wrap(items, total, page, perPage), pendingCount };
  } catch (error) {
    return getMockRegistrationsPaginated(page, perPage);
  }
}

// ---------------------------------------------------------------------------
// Retest requests queue
// ---------------------------------------------------------------------------

export async function listRetests(filter: ListFilterLike) {
  const page = filter.page ?? 1;
  const perPage = filter.perPage ?? 10;

  if (!(await isDatabaseOnline())) {
    const rows = getMockRetests();
    return { rows, total: rows.length, pendingCount: 0 };
  }

  try {
    const where: Prisma.RetestRequestWhereInput = {
      ...(filter.occupation ? { occupation: filter.occupation } : {}),
      ...(filter.status && filter.status in RetestStatus
        ? { status: filter.status as RetestStatus }
        : {}),
      ...(filter.q?.trim()
        ? {
            user: {
              OR: [
                { name: { contains: filter.q.trim(), mode: "insensitive" as const } },
                { email: { contains: filter.q.trim(), mode: "insensitive" as const } },
                { phone: { contains: filter.q.trim() } },
              ],
            },
          }
        : {}),
    };

    const [rows, total, pendingCount] = await Promise.all([
      prisma.retestRequest.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          userId: true,
          status: true,
          reason: true,
          adminNote: true,
          occupation: true,
          createdAt: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      }),
      prisma.retestRequest.count({ where }),
      prisma.retestRequest.count({ where: { status: "PENDING" } }),
    ]);

    return { rows, total, pendingCount };
  } catch (error) {
    const rows = getMockRetests();
    return { rows, total: rows.length, pendingCount: 0 };
  }
}
