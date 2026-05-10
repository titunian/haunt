import { handlers } from "@/lib/auth";

// NextAuth v5 exports GET + POST handlers from a single object.
export const { GET, POST } = handlers;
export const runtime = "nodejs";
