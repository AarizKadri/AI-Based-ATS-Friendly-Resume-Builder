import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Returns the current session's user, or null if unauthenticated. */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  return user;
}
