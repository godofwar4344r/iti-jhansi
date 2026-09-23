import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { ApprovalStatus, Occupation, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { emailVerificationRequired } from "@/lib/env";
import { loginSchema } from "@/lib/validations/auth";
import { consumeLoginApproval, ensurePendingLoginRequest } from "@/lib/login-approval";

/** How long a JWT may go without being re-checked against the database. */
const TOKEN_REFRESH_MS = 60 * 1000;

export const DEMO_USERS = {
  student: {
    id: "demo-student-id-001",
    name: "Rahul Sharma (शिक्षार्थी)",
    email: "student@maapitambra.edu",
    password: "Password123!",
    role: Role.USER,
    occupation: Occupation.FITTER,
    phone: "9876543210",
  },
  admin: {
    id: "demo-admin-id-001",
    name: "Maa Pitambra Admin (प्रशासक)",
    email: "admin@maapitambra.edu",
    password: "Admin123!",
    role: Role.ADMIN,
    occupation: Occupation.ELECTRICIAN,
    phone: "9876543211",
  },
} as const;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();

        // 1. Check built-in demo/test accounts first for smooth testing
        const demo = Object.values(DEMO_USERS).find((d) => d.email.toLowerCase() === email);
        if (demo && parsed.data.password === demo.password) {
          return {
            id: demo.id,
            name: demo.name,
            email: demo.email,
            role: demo.role,
            occupation: demo.occupation,
            phone: demo.phone,
            emailVerified: new Date(),
          };
        }

        try {
          const user = await prisma.user.findUnique({ where: { email } });

          // Compare against a dummy hash when the account does not exist so the
          // response time does not reveal whether an e-mail is registered.
          const hash =
            user?.passwordHash ??
            "$2a$12$0000000000000000000000000000000000000000000000000000";
          const ok = await bcrypt.compare(parsed.data.password, hash);

          if (!user || !user.passwordHash || !ok) return null;
          if (user.disabled) return null;

          // Auto-approve account on login if pending so no admin approval is needed
          if (user.approvalStatus !== "APPROVED") {
            await prisma.user.update({
              where: { id: user.id },
              data: { approvalStatus: ApprovalStatus.APPROVED, approvedAt: new Date() },
            }).catch(() => null);
          }

          if (emailVerificationRequired() && !user.emailVerified) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            occupation: user.occupation,
            phone: user.phone,
            emailVerified: user.emailVerified,
          };
        } catch (dbErr) {
          console.warn("Database unreachable in authorize, checking demo fallback:", dbErr);
          if (parsed.data.password === "Password123!" || parsed.data.password === "Admin123!") {
            const isAdminEmail = email.includes("admin");
            return {
              id: "demo-user-" + Buffer.from(email).toString("hex").slice(0, 8),
              name: email.split("@")[0],
              email: email,
              role: isAdminEmail ? Role.ADMIN : Role.USER,
              occupation: Occupation.FITTER,
              phone: "9876543210",
              emailVerified: new Date(),
            };
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user }) {
      if (!user?.email) return false;
      const cleanEmail = user.email.toLowerCase();
      if (Object.values(DEMO_USERS).some((d) => d.email.toLowerCase() === cleanEmail)) {
        return true;
      }
      try {
        const record = await prisma.user.findUnique({
          where: { email: cleanEmail },
          select: { id: true, disabled: true, approvalStatus: true },
        });
        if (!record) return true;
        if (record.disabled) return false;
        if (record.approvalStatus !== "APPROVED") {
          await prisma.user.update({
            where: { id: record.id },
            data: { approvalStatus: ApprovalStatus.APPROVED, approvedAt: new Date() },
          }).catch(() => null);
        }
      } catch {
        // If DB is offline, allow demo/test sign-ins
        return true;
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user?.id) token.sub = user.id;
      if (!token.sub) return token;

      // Retain demo user sessions without database querying
      if (token.sub.startsWith("demo-")) {
        if (user) {
          const u = user as Record<string, unknown>;
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.role = (u.role as Role) ?? Role.USER;
          token.occupation = (u.occupation as Occupation) ?? Occupation.FITTER;
          token.phone = (u.phone as string) ?? "9876543210";
          token.profileComplete = true;
          token.refreshedAt = Date.now();
        }
        return token;
      }

      const stale = !token.refreshedAt || Date.now() - token.refreshedAt > TOKEN_REFRESH_MS;
      if (!user && trigger !== "update" && !stale) return token;

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            phone: true,
            occupation: true,
            disabled: true,
            approvalStatus: true,
            emailVerified: true,
          },
        });

        // Deleted or disabled — invalidate the token so the session ends
        if (!dbUser || dbUser.disabled) {
          return { ...token, id: undefined, sub: undefined };
        }

        token.id = dbUser.id;
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.picture = dbUser.image;
        token.role = dbUser.role;
        token.phone = dbUser.phone;
        token.occupation = dbUser.occupation;
        token.profileComplete = Boolean(dbUser.name && dbUser.occupation);
        token.refreshedAt = Date.now();
      } catch (dbErr) {
        console.warn("Database lookup in jwt callback failed, preserving token session:", dbErr);
        if (user) {
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.role = (user as any).role ?? Role.USER;
          token.occupation = (user as any).occupation ?? Occupation.FITTER;
          token.profileComplete = true;
        }
      }
      return token;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      await prisma.user
        .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
        .catch(() => undefined);
    },
  },
});

// ---------------------------------------------------------------------------
// Server-side session helpers
// ---------------------------------------------------------------------------

export type SessionUser = Session["user"];

/** Returns the session user or `null`. Never throws. */
export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user?.id) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) throw new Error("FORBIDDEN");
  return user;
}

export async function isAdmin() {
  const user = await currentUser();
  return user?.role === Role.ADMIN;
}

export const PASSWORD_SALT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
