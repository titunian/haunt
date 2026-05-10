import { eq, and, isNull, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiTokens, sessions } from "@/lib/db/schema";
import SettingsActions from "./SettingsActions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const user = session!.user!;
  const userId = (user as { id: string }).id;

  const [tokenStats] = await db
    .select({ active: count() })
    .from(apiTokens)
    .where(and(eq(apiTokens.userId, userId), isNull(apiTokens.revokedAt)));
  const [sessionStats] = await db
    .select({ total: count() })
    .from(sessions)
    .where(eq(sessions.userId, userId));

  return (
    <>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Settings</h1>

      <section className="card">
        <div className="card-head">
          <h2>Account</h2>
        </div>
        <p>
          Signed in as <strong style={{ color: "var(--text)" }}>{user.email ?? user.name}</strong>
          {" · "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.86rem" }}>
            {sessionStats?.total ?? 0} sessions · {tokenStats?.active ?? 0} active tokens
          </span>
        </p>
      </section>

      <SettingsActions hasActiveToken={(tokenStats?.active ?? 0) > 0} />
    </>
  );
}
