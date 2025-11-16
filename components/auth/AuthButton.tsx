'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { ComponentProps, ReactNode } from 'react';

interface AuthButtonProps extends ComponentProps<typeof Button> {
  children: ReactNode;
  requireAuth?: boolean;
  onAuthRequired?: () => void;
  href?: string;
}

/**
 * Button that is disabled when user is not authenticated.
 * Shows a tooltip on hover and toast on click when disabled.
 * Can be used as a link button when href is provided.
 */
export function AuthButton({
  children,
  requireAuth = true,
  onAuthRequired,
  onClick,
  href,
  ...props
}: AuthButtonProps) {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session;
  const shouldDisable = requireAuth && !isAuthenticated && !isLoading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (shouldDisable) {
      e.preventDefault();
      e.stopPropagation();

      // Show toast for mobile users (tooltip doesn't work well on touch)
      toast.info('Please sign in to continue', {
        action: {
          label: 'Sign In',
          onClick: () => signIn('google'),
        },
      });

      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }

    if (onClick) {
      onClick(e as any);
    }
  };

  // If href is provided and not disabled, use Link
  if (href && !shouldDisable) {
    return (
      <Button asChild {...props} onClick={handleClick}>
        <Link href={href}>{children}</Link>
      </Button>
    );
  }

  const button = (
    <Button
      {...props}
      disabled={props.disabled || shouldDisable}
      onClick={handleClick}
      className={props.className}
    >
      {children}
    </Button>
  );

  // Only show tooltip when disabled due to auth
  // Wrap in span because disabled buttons don't trigger pointer events
  if (shouldDisable) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              {button}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sign in to create and edit recipes</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
