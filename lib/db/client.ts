// MongoDB client singleton for Next.js
// Prevents multiple instances in development (hot reload)

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import type { Recipe as RecipeType } from '@/types/recipe';
import type { Menu as MenuType } from '@/types/menu';
import type { AllowedUser } from '@/types/user';

if (!process.env.COSMOS_DB_CONNECTION_STRING) {
  throw new Error('COSMOS_DB_CONNECTION_STRING environment variable is not set');
}

const uri = process.env.COSMOS_DB_CONNECTION_STRING;
const options = {};

// MongoDB document types with _id as ObjectId
export interface RecipeDocument extends Omit<RecipeType, 'id'> {
  _id: ObjectId;
}

export interface MenuDocument extends Omit<MenuType, 'id'> {
  _id: ObjectId;
}

export interface AllowedUserDocument extends Omit<AllowedUser, 'id'> {
  _id: ObjectId;
}

// Global client cache for development
const globalForMongo = globalThis as unknown as {
  client: MongoClient | undefined;
  clientPromise: Promise<MongoClient> | undefined;
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development, reuse the client across hot reloads
  if (!globalForMongo.client) {
    client = new MongoClient(uri, options);
    globalForMongo.client = client;
    globalForMongo.clientPromise = client.connect();
  }
  client = globalForMongo.client;
  clientPromise = globalForMongo.clientPromise!;
} else {
  // In production, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export the promise and helper functions
export { clientPromise, ObjectId };

// Helper to get database
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db('recipe-maker');
}

// Helper to get collections with types
export async function getRecipesCollection(): Promise<Collection<RecipeDocument>> {
  const db = await getDatabase();
  return db.collection<RecipeDocument>('Recipe');
}

export async function getMenusCollection(): Promise<Collection<MenuDocument>> {
  const db = await getDatabase();
  return db.collection<MenuDocument>('Menu');
}

export async function getAllowedUsersCollection(): Promise<Collection<AllowedUserDocument>> {
  const db = await getDatabase();
  return db.collection<AllowedUserDocument>('AllowedUser');
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    const client = await clientPromise;
    await client.close();
  });
}
