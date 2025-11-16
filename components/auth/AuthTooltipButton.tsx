'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface AuthTooltipButtonProps extends ButtonProps {
  message: string;
  children: ReactNode;
  containerClassName?: string;
}

export function AuthTooltipButton({
  message,
  children,
  className,
  containerClassName,
  ...buttonProps
}: AuthTooltipButtonProps) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener('change', updateIsMobile);
    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  const handleClick = useCallback(() => {
    if (!isMobile) return;

    toast(message, {
      action: {
        label: 'Sign in',
        onClick: () => signIn('google'),
      },
    });
  }, [isMobile, message]);

  return (
    <div className={cn('flex flex-col items-end sm:flex-row sm:items-center', containerClassName)}>
      <Button
        {...buttonProps}
        type="button"
        aria-disabled={true}
        title={!isMobile ? message : undefined}
        onClick={handleClick}
        className={cn('cursor-not-allowed opacity-70', className)}
      >
        {children}
      </Button>
    </div>
  );
}
