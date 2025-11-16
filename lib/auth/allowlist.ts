import { getDb } from '@/lib/db/mongo';

const COLLECTION_NAME = 'UserAllowlist';

export async function isEmailAllowed(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;

  const db = await getDb();
  const match = await db.collection(COLLECTION_NAME).findOne({ email: normalizedEmail });
  return Boolean(match);
}

export async function addEmailToAllowlist(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Email is required');

  const db = await getDb();
  await db.collection(COLLECTION_NAME).updateOne(
    { email: normalizedEmail },
    { $setOnInsert: { email: normalizedEmail, createdAt: new Date() } },
    { upsert: true },
  );
}
