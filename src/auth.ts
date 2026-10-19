import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import type { UserRole } from "@prisma/client";

const googleConfigured =
  Boolean(process.env.AUTH_GOOGLE_ID?.length) && Boolean(process.env.AUTH_GOOGLE_SECRET?.length);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret: getAuthSecret() || undefined,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/dang-nhap",
  },
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: "Email và mật khẩu",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        const raw = credentials?.email;
        const password = credentials?.password;
        if (typeof raw !== "string" || typeof password !== "string") return null;
        const email = raw.trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
            role: true,
          },
        });
        if (!user?.passwordHash || !user.email) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        const userId = user.id;
        token.sub = userId;
        token.id = userId;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        let role = (user as { role?: UserRole }).role;
        if (!role) {
          const row = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
          });
          role = row?.role ?? "USER";
        }
        token.role = role;
      }
      if (trigger === "update" && session?.user) {
        if ("role" in session.user && session.user.role !== undefined) {
          token.role = session.user.role as typeof token.role;
        }
        if ("name" in session.user && session.user.name !== undefined) {
          token.name = session.user.name;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub ?? token.id) as string;
        session.user.role = token.role ?? "USER";
        if (token.name !== undefined) session.user.name = token.name;
        if (token.email !== undefined) session.user.email = token.email ?? "";
        if (token.picture !== undefined) session.user.image = token.picture;
      }
      return session;
    },
  },
});
