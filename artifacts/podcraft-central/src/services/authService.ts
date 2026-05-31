import { db } from '../db';

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  userId?: number;
  name?: string;
  email?: string;
}

export async function createAccount(
  name: string,
  email: string,
  password: string,
  timezone: string
): Promise<AuthResult> {
  const existing = await db.users.where('email').equals(email).first();
  if (existing) return { ok: false, error: 'An account with this email already exists.' };

  const now = new Date().toISOString();
  const userId = await db.users.add({
    email,
    passwordHash: hashPassword(password),
    name,
    timezone,
    createdAt: now,
    updatedAt: now,
  });

  await db.profiles.add({
    userId: userId as number,
    displayName: name,
    bio: '',
    timezone,
    avatarUrl: '',
    updatedAt: now,
  });

  return { ok: true, userId: userId as number, name, email };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const user = await db.users.where('email').equals(email).first();
  if (!user) return { ok: false, error: 'No account found with this email address.' };
  if (user.passwordHash !== hashPassword(password)) return { ok: false, error: 'Incorrect password.' };
  return { ok: true, userId: user.id as number, name: user.name, email: user.email };
}

export async function getUserById(userId: number) {
  return db.users.get(userId);
}

export async function getUserByEmail(email: string) {
  return db.users.where('email').equals(email).first();
}

export async function updateUserName(userId: number, name: string) {
  await db.users.update(userId, { name, updatedAt: new Date().toISOString() });
}
