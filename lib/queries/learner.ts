import "server-only";
import { Prisma, TestStatus, type Occupation, type Subject, AnswerOption } from "@prisma/client";

import { prisma, isDatabaseOnline } from "@/lib/prisma";
import { renderOptions, weakTopicsFromAnswers } from "@/lib/test-engine";
import { round } from "@/lib/utils";
import type { ActiveTest, PdfListItem, TestResultView } from "@/types";
import { getMockPdfs, getMockQuestions, getMockUsers, getMockActivities } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function getMockDashboard(userId: string, occupation: Occupation) {
  const users = getMockUsers();
  const user = users.find((u) => u.id === userId) || users[1];
  const pdfs = getMockPdfs().filter((p) => p.occupation === occupation);
  const act = getMockActivities();

  return {
    user: {
      name: user.name,
      email: user.email,
      image: null,
      occupation: user.occupation,
      createdAt: user.createdAt,
    },
    stats: {
      totalTests: 4,
      completedTests: 4,
      passedTests: 4,
      failedTests: 0,
      averageScore: 82.5,
      highestScore: 92.0,
      completionPercentage: 80,
      pdfsAvailable: pdfs.length,
      pdfsViewed: 3,
      bookmarks: 2,
    },
    recentTests: [
      {
        id: "demo-test-1",
        score: 42,
        totalQuestions: 50,
        percentage: 84.0,
        status: TestStatus.PASSED,
        timeTaken: 1140,
        submittedAt: new Date(Date.now() - 3600000),
      },
      {
        id: "demo-test-2",
        score: 38,
        totalQuestions: 50,
        percentage: 76.0,
        status: TestStatus.PASSED,
        timeTaken: 1260,
        submittedAt: new Date(Date.now() - 86400000),
      },
    ],
    latestPdfs: pdfs.slice(0, 4).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      fileSize: p.fileSize,
      createdAt: p.createdAt,
      topic: p.topic,
    })),
    activity: act.slice(0, 8).map((a) => ({
      id: a.id,
      action: a.action,
      detail: a.detail,
      createdAt: a.createdAt,
    })),
  };
}

export async function getDashboardData(userId: string, occupation: Occupation) {
  if (!(await isDatabaseOnline())) {
    return getMockDashboard(userId, occupation);
  }

  try {
    const [user, tests, totalPdfs, viewedPdfs, latestPdfs, activity, bookmarkCount] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, image: true, occupation: true, createdAt: true },
        }),
        prisma.test.findMany({
          where: { userId, status: { not: TestStatus.IN_PROGRESS } },
          orderBy: { submittedAt: "desc" },
          select: {
            id: true,
            score: true,
            totalQuestions: true,
            percentage: true,
            status: true,
            timeTaken: true,
            submittedAt: true,
          },
        }),
        prisma.pdf.count({ where: { occupation } }),
        prisma.pdfView.count({ where: { userId, pdf: { occupation } } }),
        prisma.pdf.findMany({
          where: { occupation },
          orderBy: { createdAt: "desc" },
          take: 4,
          select: {
            id: true,
            title: true,
            description: true,
            fileSize: true,
            createdAt: true,
            topic: true,
          },
        }),
        prisma.activityLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, action: true, detail: true, createdAt: true },
        }),
        prisma.bookmark.count({ where: { userId } }),
      ]);

    const completed = tests.length;
    const passed = tests.filter((t) => t.status === TestStatus.PASSED).length;
    const percentages = tests.map((t) => t.percentage);
    const averageScore = completed ? round(percentages.reduce((a, b) => a + b, 0) / completed, 1) : 0;
    const highestScore = completed ? round(Math.max(...percentages), 1) : 0;

    const materialProgress = totalPdfs > 0 ? viewedPdfs / totalPdfs : 0;
    const completionPercentage = round((materialProgress * 0.5 + (highestScore / 100) * 0.5) * 100, 0);

    return {
      user,
      stats: {
        totalTests: completed,
        completedTests: completed,
        passedTests: passed,
        failedTests: completed - passed,
        averageScore,
        highestScore,
        completionPercentage,
        pdfsAvailable: totalPdfs,
        pdfsViewed: viewedPdfs,
        bookmarks: bookmarkCount,
      },
      recentTests: tests.slice(0, 5),
      latestPdfs,
      activity,
    };
  } catch (error) {
    console.warn("[learner] Database unavailable, serving offline mock dashboard:", error);
    const users = getMockUsers();
    const user = users.find((u) => u.id === userId) || users[1];
    const pdfs = getMockPdfs().filter((p) => p.occupation === occupation);
    const act = getMockActivities();

    return {
      user: {
        name: user.name,
        email: user.email,
        image: null,
        occupation: user.occupation,
        createdAt: user.createdAt,
      },
      stats: {
        totalTests: 4,
        completedTests: 4,
        passedTests: 4,
        failedTests: 0,
        averageScore: 82.5,
        highestScore: 92.0,
        completionPercentage: 80,
        pdfsAvailable: pdfs.length,
        pdfsViewed: 3,
        bookmarks: 2,
      },
      recentTests: [
        {
          id: "demo-test-1",
          score: 42,
          totalQuestions: 50,
          percentage: 84.0,
          status: TestStatus.PASSED,
          timeTaken: 1140,
          submittedAt: new Date(Date.now() - 3600000),
        },
        {
          id: "demo-test-2",
          score: 38,
          totalQuestions: 50,
          percentage: 76.0,
          status: TestStatus.PASSED,
          timeTaken: 1260,
          submittedAt: new Date(Date.now() - 86400000),
        },
      ],
      latestPdfs: pdfs.slice(0, 4).map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        fileSize: p.fileSize,
        createdAt: p.createdAt,
        topic: p.topic,
      })),
      activity: act.slice(0, 8).map((a) => ({
        id: a.id,
        action: a.action,
        detail: a.detail,
        createdAt: a.createdAt,
      })),
    };
  }
}

// ---------------------------------------------------------------------------
// Learning material
// ---------------------------------------------------------------------------

export async function getPdfsForUser(
  userId: string,
  occupation: Occupation,
  options: { q?: string; onlyBookmarked?: boolean } = {},
): Promise<PdfListItem[]> {
  try {
    const where: Prisma.PdfWhereInput = { occupation };

    if (options.q?.trim()) {
      const q = options.q.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { topic: { contains: q, mode: "insensitive" } },
      ];
    }
    if (options.onlyBookmarked) {
      where.bookmarks = { some: { userId } };
    }

    const pdfs = await prisma.pdf.findMany({
      where,
      orderBy: [{ builtIn: "desc" }, { year: "asc" }, { createdAt: "desc" }],
      include: {
        bookmarks: { where: { userId }, select: { id: true } },
        views: { where: { userId }, select: { id: true } },
        _count: { select: { questions: true } },
      },
    });

    return pdfs.map((pdf) => ({
      id: pdf.id,
      title: pdf.title,
      titleHi: pdf.titleHi,
      description: pdf.description,
      topic: pdf.topic,
      occupation: pdf.occupation,
      subject: pdf.subject,
      year: pdf.year,
      builtIn: pdf.builtIn,
      fileUrl: pdf.fileUrl,
      fileSize: pdf.fileSize,
      createdAt: pdf.createdAt,
      bookmarked: pdf.bookmarks.length > 0,
      viewed: pdf.views.length > 0,
      questionCount: pdf._count.questions,
    }));
  } catch (error) {
    console.warn("[learner] Database unavailable, serving offline mock pdfs:", error);
    let items = getMockPdfs().filter((p) => p.occupation === occupation);
    if (options.q?.trim()) {
      const q = options.q.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.titleHi && p.titleHi.includes(q)) ||
          p.topic.toLowerCase().includes(q),
      );
    }
    return items.map((pdf) => ({
      id: pdf.id,
      title: pdf.title,
      titleHi: pdf.titleHi,
      description: pdf.description,
      topic: pdf.topic,
      occupation: pdf.occupation,
      subject: pdf.subject,
      year: pdf.year,
      builtIn: pdf.builtIn,
      fileUrl: pdf.fileUrl,
      fileSize: pdf.fileSize,
      createdAt: pdf.createdAt,
      bookmarked: false,
      viewed: true,
      questionCount: pdf._count.questions,
    }));
  }
}

export async function getSuggestedPdfs(occupation: Occupation, topics: string[], limit = 4) {
  try {
    if (topics.length === 0) return [];

    const suggestions = await prisma.pdf.findMany({
      where: {
        occupation,
        OR: topics.flatMap((topic) => [
          { topic: { equals: topic, mode: "insensitive" as const } },
          { title: { contains: topic, mode: "insensitive" as const } },
          { description: { contains: topic, mode: "insensitive" as const } },
        ]),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, topic: true, description: true, fileUrl: true },
    });

    if (suggestions.length > 0) return suggestions;

    return await prisma.pdf.findMany({
      where: { occupation },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, topic: true, description: true, fileUrl: true },
    });
  } catch {
    return getMockPdfs()
      .filter((p) => p.occupation === occupation)
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        title: p.title,
        topic: p.topic,
        description: p.description,
        fileUrl: p.fileUrl,
      }));
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

export async function getActiveTest(testId: string, userId: string): Promise<ActiveTest | null> {
  try {
    const test = await prisma.test.findFirst({
      where: { id: testId, userId },
      include: {
        answers: {
          orderBy: { orderIndex: "asc" },
          include: {
            question: {
              select: {
                id: true,
                type: true,
                subject: true,
                topic: true,
                question: true,
                questionHi: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                optionAHi: true,
                optionBHi: true,
                optionCHi: true,
                optionDHi: true,
              },
            },
          },
        },
      },
    });

    if (!test || test.status !== TestStatus.IN_PROGRESS) return null;

    return {
      id: test.id,
      occupation: test.occupation,
      startedAt: test.startedAt.toISOString(),
      expiresAt: test.expiresAt.toISOString(),
      durationSec: test.durationSec,
      questions: test.answers.map((answer, index) => ({
        answerId: answer.id,
        questionId: answer.questionId,
        index,
        type: answer.question.type,
        subject: answer.question.subject,
        topic: answer.question.topic,
        question: answer.question.question,
        questionHi: answer.question.questionHi,
        options: renderOptions(answer.question, answer.optionOrder),
        selected: answer.selectedAnswer,
      })),
    };
  } catch {
    return null;
  }
}

export async function getTestResult(
  testId: string,
  userId: string,
): Promise<TestResultView | null> {
  try {
    const test = await prisma.test.findFirst({
      where: { id: testId, userId },
      include: {
        answers: {
          orderBy: { orderIndex: "asc" },
          include: {
            question: {
              include: {
                sourcePdf: { select: { id: true, title: true, titleHi: true, fileUrl: true } },
              },
            },
          },
        },
      },
    });

    if (!test || test.status === TestStatus.IN_PROGRESS) return null;

    const correctCount = test.answers.filter((a) => a.correct).length;
    const answeredCount = test.answers.filter((a) => a.selectedAnswer !== null).length;

    const subjectTotals = new Map<Subject, { correct: number; total: number }>();
    for (const answer of test.answers) {
      const bucket = subjectTotals.get(answer.question.subject) ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (answer.correct) bucket.correct += 1;
      subjectTotals.set(answer.question.subject, bucket);
    }

    const plans = new Map<
      string,
      {
        pdfId: string | null;
        title: string;
        titleHi: string | null;
        fileUrl: string | null;
        missed: number;
        topics: Set<string>;
        pages: Set<number>;
      }
    >();

    for (const answer of test.answers) {
      if (answer.correct) continue;
      const pdf = answer.question.sourcePdf;
      const key = pdf?.id ?? `topic:${answer.question.topic}`;

      const entry = plans.get(key) ?? {
        pdfId: pdf?.id ?? null,
        title: pdf?.title ?? "Ask your instructor",
        titleHi: pdf?.titleHi ?? null,
        fileUrl: pdf?.fileUrl ?? null,
        missed: 0,
        topics: new Set<string>(),
        pages: new Set<number>(),
      };
      entry.missed += 1;
      entry.topics.add(answer.question.topic);
      if (answer.question.sourcePage) entry.pages.add(answer.question.sourcePage);
      plans.set(key, entry);
    }

    return {
      id: test.id,
      occupation: test.occupation,
      score: test.score,
      totalQuestions: test.totalQuestions,
      percentage: test.percentage,
      status: test.status,
      timeTaken: test.timeTaken,
      submittedAt: test.submittedAt,
      correctCount,
      wrongCount: answeredCount - correctCount,
      unansweredCount: test.answers.length - answeredCount,
      weakTopics: weakTopicsFromAnswers(test.answers),
      subjectBreakdown: [...subjectTotals.entries()]
        .map(([subject, value]) => ({ subject, ...value }))
        .sort((a, b) => b.total - a.total),
      studyPlan: [...plans.values()]
        .sort((a, b) => b.missed - a.missed)
        .map((entry) => ({
          pdfId: entry.pdfId,
          title: entry.title,
          titleHi: entry.titleHi,
          fileUrl: entry.fileUrl,
          missed: entry.missed,
          topics: [...entry.topics],
          pages: [...entry.pages].sort((a, b) => a - b),
        })),
      breakdown: test.answers.map((answer) => ({
        questionId: answer.questionId,
        question: answer.question.question,
        questionHi: answer.question.questionHi,
        topic: answer.question.topic,
        subject: answer.question.subject,
        difficulty: answer.question.difficulty,
        selected: answer.selectedAnswer,
        correctAnswer: answer.question.correctAnswer,
        correct: answer.correct,
        explanation: answer.question.explanation,
        explanationHi: answer.question.explanationHi,
        options: renderOptions(answer.question, answer.optionOrder),
        source: {
          pdfId: answer.question.sourcePdf?.id ?? null,
          title: answer.question.sourcePdf?.title ?? null,
          titleHi: answer.question.sourcePdf?.titleHi ?? null,
          fileUrl: answer.question.sourcePdf?.fileUrl ?? null,
          page: answer.question.sourcePage,
          label: answer.question.sourceLabel,
          syllabusWeek: answer.question.syllabusWeek,
        },
      })),
    };
  } catch {
    return null;
  }
}

export async function getTestHistory(userId: string, take = 50) {
  try {
    return await prisma.test.findMany({
      where: { userId, status: { not: TestStatus.IN_PROGRESS } },
      orderBy: { submittedAt: "desc" },
      take,
      select: {
        id: true,
        score: true,
        totalQuestions: true,
        percentage: true,
        status: true,
        timeTaken: true,
        submittedAt: true,
        occupation: true,
      },
    });
  } catch {
    return [
      {
        id: "demo-test-1",
        score: 42,
        totalQuestions: 50,
        percentage: 84.0,
        status: TestStatus.PASSED,
        timeTaken: 1140,
        submittedAt: new Date(Date.now() - 3600000),
        occupation: "FITTER" as Occupation,
      },
      {
        id: "demo-test-2",
        score: 38,
        totalQuestions: 50,
        percentage: 76.0,
        status: TestStatus.PASSED,
        timeTaken: 1260,
        submittedAt: new Date(Date.now() - 86400000),
        occupation: "FITTER" as Occupation,
      },
    ].slice(0, take);
  }
}

export async function getInProgressTest(userId: string) {
  try {
    return await prisma.test.findFirst({
      where: { userId, status: TestStatus.IN_PROGRESS },
      orderBy: { startedAt: "desc" },
      select: { id: true, expiresAt: true, startedAt: true },
    });
  } catch {
    return null;
  }
}

export async function getQuestionBankSize(occupation: Occupation) {
  try {
    return await prisma.question.count({ where: { occupation, active: true } });
  } catch {
    return 120;
  }
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export async function getProgressData(userId: string, occupation: Occupation) {
  try {
    const [tests, totalPdfs, viewedPdfs] = await Promise.all([
      prisma.test.findMany({
        where: { userId, status: { not: TestStatus.IN_PROGRESS } },
        orderBy: { submittedAt: "asc" },
        include: { answers: { select: { correct: true, question: { select: { topic: true } } } } },
      }),
      prisma.pdf.count({ where: { occupation } }),
      prisma.pdfView.count({ where: { userId, pdf: { occupation } } }),
    ]);

    const total = tests.length;
    const passed = tests.filter((t) => t.status === TestStatus.PASSED).length;
    const percentages = tests.map((t) => t.percentage);
    const averageScore = total ? round(percentages.reduce((a, b) => a + b, 0) / total, 1) : 0;
    const highestScore = total ? round(Math.max(...percentages), 1) : 0;
    const materialProgress = totalPdfs > 0 ? viewedPdfs / totalPdfs : 0;

    const topicTotals = new Map<string, { correct: number; total: number }>();
    for (const test of tests) {
      for (const answer of test.answers) {
        const bucket = topicTotals.get(answer.question.topic) ?? { correct: 0, total: 0 };
        bucket.total += 1;
        if (answer.correct) bucket.correct += 1;
        topicTotals.set(answer.question.topic, bucket);
      }
    }

    const topicAccuracy = [...topicTotals.entries()]
      .map(([topic, value]) => ({
        topic,
        accuracy: value.total ? round((value.correct / value.total) * 100, 0) : 0,
        attempts: value.total,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    return {
      totals: {
        totalTests: total,
        passed,
        failed: total - passed,
        averageScore,
        highestScore,
        completionPercentage: round((materialProgress * 0.5 + (highestScore / 100) * 0.5) * 100, 0),
        materialViewed: viewedPdfs,
        materialTotal: totalPdfs,
      },
      timeline: tests.map((test, index) => ({
        attempt: index + 1,
        label: test.submittedAt
          ? test.submittedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
          : `#${index + 1}`,
        percentage: test.percentage,
        score: test.score,
        status: test.status,
        id: test.id,
      })),
      topicAccuracy,
    };
  } catch (error) {
    console.warn("[learner] Database unavailable, serving offline mock progress:", error);
    return {
      totals: {
        totalTests: 4,
        passed: 4,
        failed: 0,
        averageScore: 82.5,
        highestScore: 92.0,
        completionPercentage: 80,
        materialViewed: 3,
        materialTotal: 4,
      },
      timeline: [
        { attempt: 1, label: "01 Sep", percentage: 76.0, score: 38, status: TestStatus.PASSED, id: "t1" },
        { attempt: 2, label: "08 Sep", percentage: 80.0, score: 40, status: TestStatus.PASSED, id: "t2" },
        { attempt: 3, label: "15 Sep", percentage: 84.0, score: 42, status: TestStatus.PASSED, id: "t3" },
        { attempt: 4, label: "22 Sep", percentage: 90.0, score: 45, status: TestStatus.PASSED, id: "t4" },
      ],
      topicAccuracy: [
        { topic: "Hand Tools", accuracy: 95, attempts: 20 },
        { topic: "Marking & Measuring", accuracy: 88, attempts: 18 },
        { topic: "Fasteners & Screws", accuracy: 82, attempts: 15 },
        { topic: "Safety & First Aid", accuracy: 90, attempts: 12 },
      ],
    };
  }
}
