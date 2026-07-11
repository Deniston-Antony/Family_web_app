import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";
import type { User } from "@/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const rateLimit = checkRateLimit(email.toLowerCase());
        if (!rateLimit.allowed) {
          throw new Error(`Too many login attempts. Try again in ${rateLimit.retryAfter} seconds.`);
        }

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          recordFailedAttempt(email.toLowerCase());
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          recordFailedAttempt(email.toLowerCase());
          return null;
        }

        resetRateLimit(email.toLowerCase());

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.profilePicture,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            profilePicture: true,
            bio: true,
            statusMessage: true,
            isOnline: true,
            lastSeen: true,
          },
        });
        if (dbUser) {
          token.username = dbUser.username;
          token.profilePicture = dbUser.profilePicture;
          token.bio = dbUser.bio;
          token.statusMessage = dbUser.statusMessage;
          token.isOnline = dbUser.isOnline;
          token.lastSeen = dbUser.lastSeen?.toISOString() ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          username: token.username as string,
          profilePicture: token.profilePicture as string | null,
          bio: token.bio as string | null,
          statusMessage: token.statusMessage as string | null,
          isOnline: token.isOnline as boolean,
          lastSeen: token.lastSeen as string | null,
        } as User;
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});
