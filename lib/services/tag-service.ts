// Tag service - manages the dedicated tags collection for performant autocomplete
import { getTagsCollection } from '@/lib/db/mongo';

/**
 * Sync tags to the dedicated tags collection.
 * Upserts each tag so new tags are tracked without duplicates.
 * This is called automatically when recipes are created or updated.
 */
export async function syncTags(tags: string[]): Promise<void> {
  if (tags.length === 0) return;
  const collection = await getTagsCollection();
  const ops = tags.map((name) => ({
    updateOne: {
      filter: { name },
      update: { $setOnInsert: { name, createdAt: new Date() } },
      upsert: true,
    },
  }));
  await collection.bulkWrite(ops);
}

/**
 * Get all unique tag names from the dedicated tags collection.
 * Much more performant than scanning all recipe documents.
 */
export async function getAllTagNames(): Promise<string[]> {
  const collection = await getTagsCollection();
  const docs = await collection.find({}, { projection: { name: 1 } }).sort({ name: 1 }).toArray();
  return docs.map((d) => d.name as string);
}
