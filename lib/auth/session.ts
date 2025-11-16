import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from './options';
import { UnauthorizedError } from '@/lib/utils/api-response';

export async function requireUserSession(): Promise<Session> {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new UnauthorizedError();
  }

  return session;
}
