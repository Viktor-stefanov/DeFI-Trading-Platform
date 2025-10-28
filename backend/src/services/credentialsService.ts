import { db } from "../db";
import { users } from "../db/schema/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export type User = {
  id: string;
  email: string | null;
  name: string | null;
};

/**
 * Find a user and credential by email.
 */
export async function findUserByEmail(email: string) {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Create user and store hashed password.
 */
export async function createUserWithPassword(
  email: string,
  fullName: string,
  password: string
) {
  const hash = await bcrypt.hash(password, 10);

  const created = await db
    .insert(users)
    .values({ email: email.toLowerCase(), name: fullName, passwordHash: hash })
    .returning();

  if (!created || created.length === 0)
    throw new Error("failed to create user");

  const row = created[0] as any;
  return {
    id: row.id as string,
    email: row.email as string | null,
    name: row.name as string | null,
  };
}

/**
 * Verify credentials by email/password. Returns user on success, null otherwise.
 */
export async function verifyCredentials(email: string, password: string) {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  const row = rows[0];
  if (!row || !row.passwordHash) return null;

  const ok = await bcrypt.compare(password, row.passwordHash as string);
  if (!ok) return null;

  return {
    id: row.id as string,
    email: row.email as string | null,
    name: row.name as string | null,
  };
}
