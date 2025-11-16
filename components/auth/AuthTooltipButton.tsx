'use client';

import { type ReactNode } from 'react';
import { signIn } from 'next-auth/react';
import { Lock } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface AuthTooltipButtonProps extends ButtonProps {
  message: string;
  children: ReactNode;
  containerClassName?: string;
  showSignInLink?: boolean;
}

export function AuthTooltipButton({
  message,
  children,
  className,
  containerClassName,
  showSignInLink = true,
  ...buttonProps
}: AuthTooltipButtonProps) {
  return (
    <div className={cn('flex flex-col items-end gap-2 sm:flex-row sm:items-center', containerClassName)}>
      <Button
        {...buttonProps}
        disabled
        aria-disabled={true}
        title={message}
        className={cn('pointer-events-none', className)}
      >
        {children}
      </Button>
      <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden">
        <Lock className="h-3 w-3" aria-hidden="true" />
        <span>{message}</span>
      </div>
      {showSignInLink ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-sm"
          onClick={() => signIn('google')}
        >
          Sign in
        </Button>
      ) : null}
    </div>
  );
}
