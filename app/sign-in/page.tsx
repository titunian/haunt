import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import MarketingNav from "@/components/MarketingNav";
import GhostMark from "@/components/GhostMark";

export const metadata = { title: "Sign in — Haunt" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/app");

  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/app";

  return (
    <>
      <MarketingNav />
      <div className="signin-shell">
        <div className="signin-card">
          <GhostMark size={48} className="ghost-mark" />
          <h1>Welcome back.</h1>
          <p>Sign in to view your archived sessions and grab an API token.</p>

          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: callbackUrl });
            }}
          >
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              <GitHubGlyph />
              Continue with GitHub
            </button>
          </form>

          <p style={{ marginTop: "1.25rem", fontSize: "0.78rem" }}>
            We only read your public profile and email. No code access.
          </p>
        </div>
      </div>
    </>
  );
}

function GitHubGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.22.48-2.69-1.07-2.69-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.28.82 2.15 0 3.07-1.87 3.74-3.65 3.94.29.25.54.74.54 1.49v2.21c0 .21.15.46.55.38A8 8 0 0 0 8 0z"
      />
    </svg>
  );
}
