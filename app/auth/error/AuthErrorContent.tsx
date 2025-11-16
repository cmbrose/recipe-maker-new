'use client';

import { useSearchParams } from 'next/navigation';

export function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (error === 'AccessDenied') {
    return (
      <>
        <p className="text-sm">
          Your email address is not authorized to access this application.
        </p>
        <p className="text-sm text-muted-foreground">
          Please contact the administrator if you believe this is an error.
        </p>
      </>
    );
  }

  return (
    <p className="text-sm">
      An unexpected error occurred during sign-in. Please try again.
    </p>
  );
}
