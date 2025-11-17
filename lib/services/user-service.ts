import { getAllowedUsersCollection, type AllowedUserDocument } from '@/lib/db/client';

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
  try {
    const collection = await getAllowedUsersCollection();

    // Check if already exists
    const existing = await collection.findOne({
      email: email.toLowerCase()
    });

    if (existing) {
      return; // Already exists, nothing to do
    }

    // Add new allowed user (MongoDB will auto-generate _id)
    const newUser: Omit<AllowedUserDocument, '_id'> = {
      email: email.toLowerCase(),
      createdAt: new Date(),
    };

    await collection.insertOne(newUser as AllowedUserDocument);
  } catch (error) {
    console.error('Error adding allowed email:', error);
    throw new Error(`Failed to add email to allowlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Remove an email from the allowed users list
 */
export async function removeAllowedEmail(email: string): Promise<void> {
  try {
    const collection = await getAllowedUsersCollection();
    await collection.deleteOne({
      email: email.toLowerCase()
    });
  } catch (error) {
    console.error('Error removing allowed email:', error);
    throw new Error(`Failed to remove email from allowlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all allowed emails
 */
export async function getAllowedEmails(): Promise<string[]> {
  try {
    const collection = await getAllowedUsersCollection();
    const users = await collection.find({}).toArray();
    return users.map(u => u.email);
  } catch (error) {
    console.error('Error getting allowed emails:', error);
    throw new Error(`Failed to retrieve allowed emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
