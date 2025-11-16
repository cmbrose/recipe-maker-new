/**
 * CLI script to manage the email allowlist
 *
 * Usage:
 *   pnpm tsx scripts/manage-allowlist.ts list
 *   pnpm tsx scripts/manage-allowlist.ts add user@example.com
 *   pnpm tsx scripts/manage-allowlist.ts remove user@example.com
 */

import { addAllowedEmail, removeAllowedEmail, getAllowedEmails } from '../lib/services/user-service';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const email = args[1];

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
        console.log('Usage: pnpm tsx scripts/manage-allowlist.ts add user@example.com');
        process.exit(1);
      }
      await addAllowedEmail(email);
      console.log(`✓ Added ${email} to allowlist`);
      break;

    case 'remove':
      if (!email) {
        console.error('Error: Email address required');
        console.log('Usage: pnpm tsx scripts/manage-allowlist.ts remove user@example.com');
        process.exit(1);
      }
      await removeAllowedEmail(email);
      console.log(`✓ Removed ${email} from allowlist`);
      break;

    default:
      console.log('Email Allowlist Management');
      console.log('');
      console.log('Usage:');
      console.log('  pnpm tsx scripts/manage-allowlist.ts list');
      console.log('  pnpm tsx scripts/manage-allowlist.ts add user@example.com');
      console.log('  pnpm tsx scripts/manage-allowlist.ts remove user@example.com');
      console.log('');
      process.exit(1);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
