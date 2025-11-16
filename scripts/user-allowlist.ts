#!/usr/bin/env tsx

import path from 'path';
import { config as loadEnv } from 'dotenv';

async function main() {
  // Ensure environment variables are loaded before touching the database
  const envPath = path.resolve(process.cwd(), '.env');
  loadEnv({ path: envPath });

  const { addEmailToAllowlist } = await import('../lib/auth/allowlist');
  const [command, email] = process.argv.slice(2);

  if (command !== 'add' || !email) {
    console.error('Usage: pnpm user:add <email>');
    process.exit(1);
  }

  try {
    await addEmailToAllowlist(email);
    console.log(`✓ Added ${email} to the allow list`);
  } catch (error) {
    console.error('Failed to update allow list:', error);
    process.exit(1);
  }
}

void main();
