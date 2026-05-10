import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import Footer from "@/components/Footer";
import HeroGhost from "@/components/HeroGhost";

export default function Home() {
  return (
    <>
      <MarketingNav />

      <header className="hero hero-only container">
        <div className="hero-mark-wrap" id="ghostStage">
          <HeroGhost />
          <span className="hero-pulse" aria-hidden="true" />
        </div>

        <h1>
          Every coding session,
          <br />
          haunted.
        </h1>

        <p className="lede">
          A little daemon that catches every session the moment it ends, and stows it as
          clean, searchable markdown. <strong>Install once.</strong>
        </p>

        <ul className="supported" aria-label="Works with">
          <li>
            <svg className="supported-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" fill="currentColor"/>
            </svg>
            <span>Claude Code</span>
          </li>
          <li>
            <svg className="supported-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3.2 L19.6 7.6 V16.4 L12 20.8 L4.4 16.4 V7.6 Z"/>
                <path d="M12 8 L16 10.3 V14.7 L12 17 L8 14.7 V10.3 Z"/>
              </g>
            </svg>
            <span>Codex</span>
          </li>
          <li>
            <svg className="supported-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" fill="currentColor"/>
            </svg>
            <span>Cursor</span>
          </li>
        </ul>

        <div className="hero-actions">
          <Link className="btn btn-primary" href="/sign-in">
            <GitHubIcon />
            Sign in with GitHub
          </Link>
        </div>

        <p className="hero-question">
          What would you do if you had access to <em>all</em> your coding sessions?
        </p>
      </header>

      <Footer />
    </>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}
