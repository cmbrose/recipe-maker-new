// MongoDB client singleton for Cosmos DB
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

const uri = process.env.COSMOS_DB_CONNECTION_STRING!;
if (!uri) throw new Error('COSMOS_DB_CONNECTION_STRING is not set');

let client: MongoClient;
let db: Db;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri, { 
      // useUnifiedTopology: true // not needed in v4+
    });
    await client.connect();
  }
  return client;
}

export async function getDb(): Promise<Db> {
  if (!db) {
    const c = await getMongoClient();
    db = c.db(); // uses db from connection string
  }
  return db;
}

export async function getRecipesCollection(): Promise<Collection> {
  const database = await getDb();
  return database.collection('Recipe');
}

export { ObjectId };
