import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, authSessions, verificationTokens } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: authSessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHub({
      // Auth.js v5 auto-picks AUTH_GITHUB_ID / AUTH_GITHUB_SECRET. Fall back to
      // the legacy GITHUB_ID / GITHUB_SECRET names too, so both conventions work.
      clientId: process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_SECRET,
      profile(profile) {
        return {
          id: String(profile.id),
          githubId: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          avatarUrl: profile.avatar_url,
        } as never;
      },
    }),
  ],
  session: { strategy: "database" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Surface the internal user id so server components can scope queries.
        (session.user as { id?: string }).id = user.id;
      }
      return session;
    },
  },
});
