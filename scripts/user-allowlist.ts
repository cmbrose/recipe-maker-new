#!/usr/bin/env tsx

import { addEmailToAllowlist } from '../lib/auth/allowlist';

async function main() {
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
