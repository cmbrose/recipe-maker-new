'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const showTooltip = useMemo(() => !isMobile && isTooltipVisible, [isMobile, isTooltipVisible]);

  return (
    <div className={cn('relative inline-flex flex-col items-end sm:flex-row sm:items-center', containerClassName)}>
      <Button
        {...buttonProps}
        type="button"
        aria-disabled={true}
        onClick={handleClick}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        onFocus={() => setIsTooltipVisible(true)}
        onBlur={() => setIsTooltipVisible(false)}
        className={cn('opacity-70', className)}
      >
        {children}
      </Button>
      {showTooltip ? (
        <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 transform whitespace-nowrap rounded-xl border border-border bg-popover/95 px-4 py-2 text-sm text-foreground shadow-lg shadow-black/10 ring-1 ring-black/5 backdrop-blur-md">
          {message}
        </div>
      ) : null}
    </div>
  );
}
