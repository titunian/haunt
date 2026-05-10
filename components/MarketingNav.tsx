import Link from "next/link";
import GhostMark from "./GhostMark";

export default function MarketingNav({
  activeDocs = false,
}: {
  activeDocs?: boolean;
}) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="brand" href="/">
          <span className="brand-tile">
            <GhostMark size={16} className="brand-mark" />
          </span>
          <span className="brand-name">haunt</span>
          {activeDocs && <span className="brand-tag">docs</span>}
        </Link>
        <div className="nav-links">
          <Link href="/docs" className={activeDocs ? "active" : ""}>
            Docs
          </Link>
          <Link href="/app">Dashboard</Link>
          <Link href="/docs#install" className="btn btn-outline btn-sm">
            Install
          </Link>
        </div>
      </div>
    </nav>
  );
}
