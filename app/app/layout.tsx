import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import GhostMark from "@/components/GhostMark";
import Footer from "@/components/Footer";

// All /app/* routes require sign-in. Done here so each page can stay terse.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/app");
  }

  const user = session.user;

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/app">
            <span className="brand-tile">
              <GhostMark size={16} className="brand-mark" />
            </span>
            <span className="brand-name">haunt</span>
          </Link>
          <div className="nav-links">
            <Link href="/app">Sessions</Link>
            <Link href="/app/settings">Settings</Link>
            <Link href="/docs">Docs</Link>
            <span className="user-menu">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" />
              ) : null}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="copy-btn">
                  Sign out
                </button>
              </form>
            </span>
          </div>
        </div>
      </nav>

      <main className="container dash-shell">{children}</main>

      <Footer />
    </>
  );
}
