import { randomUUID } from "crypto";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days (supports "remember me")
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("MISSING_CREDENTIALS");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) throw new Error("INVALID_CREDENTIALS");

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) throw new Error("INVALID_CREDENTIALS");

        if (!user.isActive) throw new Error("ACCOUNT_INACTIVE");

        // Instructors must be approved by an admin before they can sign in
        if (user.role === "INSTRUCTOR" && user.instructorStatus !== "APPROVED") {
          throw new Error(
            user.instructorStatus === "REJECTED"
              ? "INSTRUCTOR_REJECTED"
              : "INSTRUCTOR_PENDING",
          );
        }

        // Enforce one active session per STUDENT: rotate the session id on every
        // login. Any other device still holding the previous id is signed out.
        let sessionId: string | null = null;
        if (user.role === "STUDENT") {
          sessionId = randomUUID();
          await prisma.user.update({
            where: { id: user.id },
            data: { sessionId },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image ?? null,
          sessionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionId = user.sessionId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.sessionId = token.sessionId ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
