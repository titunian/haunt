import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  date,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// ── Users ─────────────────────────────────────────────────────────────────
// Populated on first GitHub sign-in via the NextAuth Drizzle adapter.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Stable GitHub user id (string form of the numeric id).
  githubId: text("github_id").unique(),
  email: text("email").unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"), // Auth.js convention; mirrors avatar_url
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Auth.js adapter tables ────────────────────────────────────────────────
// Required by @auth/drizzle-adapter so NextAuth can persist OAuth accounts
// + sessions + verification tokens.
// NOTE: column-key names below match Auth.js's DefaultPostgresAccountsTable
// (snake_case keys, not camelCase) so DrizzleAdapter accepts them directly.
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
  ],
);

export const authSessions = pgTable("auth_sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ── API tokens ────────────────────────────────────────────────────────────
// Plaintext shown to user once at generation. Only the SHA-256 hash is stored.
export const apiTokens = pgTable(
  "api_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // SHA-256 hex digest of the plaintext token.
    hash: text("hash").notNull().unique(),
    // Short suffix kept for display ("…ab12") — nothing sensitive.
    suffix: text("suffix").notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    index("api_tokens_user_idx").on(t.userId),
    index("api_tokens_hash_idx").on(t.hash),
  ],
);

// ── Archived sessions ─────────────────────────────────────────────────────
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // 'claude' | 'codex' | 'cursor' | 'unknown' — derived from path prefix.
    source: text("source").notNull().default("claude"),
    // URL-safe identifier from the path (e.g. "migration-review__a93f1c")
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    project: text("project"),
    sessionDate: date("session_date").notNull(),
    blobUrl: text("blob_url").notNull(),
    byteSize: integer("byte_size").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sessions_user_created_idx").on(t.userId, t.createdAt.desc()),
    index("sessions_user_date_idx").on(t.userId, t.sessionDate.desc()),
    index("sessions_user_source_idx").on(t.userId, t.source),
  ],
);

export type User = typeof users.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
export type Session = typeof sessions.$inferSelect;
