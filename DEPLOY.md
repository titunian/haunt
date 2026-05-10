# Deploy

Six commands. Run them from `/Users/abhishek/Documents/GitHub/haunt`.

```bash
# 1. Install deps
pnpm install

# 2. Provision Postgres + Blob (interactive: pick "haunt-db" and "haunt-blob")
vercel storage create postgres haunt-db && vercel storage create blob haunt-blob

# 3. Pull every connected env var into .env.local
vercel env pull .env.local

# 4. Add the auth secrets (paste output of `openssl rand -base64 32` for AUTH_SECRET,
#    and your GitHub OAuth app id/secret for AUTH_GITHUB_ID / AUTH_GITHUB_SECRET)
vercel env add AUTH_SECRET production && vercel env add AUTH_GITHUB_ID production && vercel env add AUTH_GITHUB_SECRET production && vercel env pull .env.local

# 5. Push the Drizzle schema to Postgres
pnpm db:push

# 6. Ship it
vercel deploy --prod
```

GitHub OAuth callback URLs to register at <https://github.com/settings/developers>:

- `https://haunt-pied.vercel.app/api/auth/callback/github`
- `http://localhost:3000/api/auth/callback/github`
