import { getAllowedUsersCollection } from '@/lib/db/client';

/**
 * Check if an email is in the allowed users list
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  try {
    const collection = await getAllowedUsersCollection();
    const user = await collection.findOne({
      email: email.toLowerCase() // Case-insensitive comparison
    });
    return user !== null;
  } catch (error) {
    console.error('Error checking if email is allowed:', error);
    // Fail closed - if we can't check, don't allow
    return false;
  }
}

/**
 * Add an email to the allowed users list
 */
export async function addAllowedEmail(email: string): Promise<void> {
  const collection = await getAllowedUsersCollection();

  // Check if already exists
  const existing = await collection.findOne({
    email: email.toLowerCase()
  });

  if (existing) {
    return; // Already exists, nothing to do
  }

  // Add new allowed user
  await collection.insertOne({
    email: email.toLowerCase(),
    createdAt: new Date(),
  } as any);
}

/**
 * Remove an email from the allowed users list
 */
export async function removeAllowedEmail(email: string): Promise<void> {
  const collection = await getAllowedUsersCollection();
  await collection.deleteOne({
    email: email.toLowerCase()
  });
}

/**
 * Get all allowed emails
 */
export async function getAllowedEmails(): Promise<string[]> {
  const collection = await getAllowedUsersCollection();
  const users = await collection.find({}).toArray();
  return users.map(u => u.email);
}
