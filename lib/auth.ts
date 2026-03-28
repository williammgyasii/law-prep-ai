import { auth } from "@/auth";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function getOptionalSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}
