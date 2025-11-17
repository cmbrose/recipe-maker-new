/**
 * CLI script to manage the email allowlist
 *
 * Usage:
 *   pnpm user:add user@example.com
 *   pnpm user:remove user@example.com
 *   pnpm user:list
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file BEFORE importing modules that need them
config({ path: resolve(__dirname, '../.env') });

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const email = args[1];

  // Now we can import modules that depend on env vars
  const { addAllowedEmail, removeAllowedEmail, getAllowedEmails } = await import('../lib/services/user-service');

  switch (command) {
    case 'list':
      const emails = await getAllowedEmails();
      console.log('\nAllowed emails:');
      if (emails.length === 0) {
        console.log('  (none)');
      } else {
        emails.forEach(e => console.log(`  - ${e}`));
      }
      console.log(`\nTotal: ${emails.length}\n`);
      break;

    case 'add':
      if (!email) {
        console.error('Error: Email address required');
        console.log('Usage: pnpm user:add user@example.com');
        process.exit(1);
      }
      await addAllowedEmail(email);
      console.log(`✓ Added ${email} to allowlist`);
      break;

    case 'remove':
      if (!email) {
        console.error('Error: Email address required');
        console.log('Usage: pnpm user:remove user@example.com');
        process.exit(1);
      }
      await removeAllowedEmail(email);
      console.log(`✓ Removed ${email} from allowlist`);
      break;

    default:
      console.log('Email Allowlist Management');
      console.log('');
      console.log('Usage:');
      console.log('  pnpm user:list');
      console.log('  pnpm user:add user@example.com');
      console.log('  pnpm user:remove user@example.com');
      console.log('');
      process.exit(1);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
