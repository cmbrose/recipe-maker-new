'use client';

import { ReactNode } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
    children: ReactNode;
    /** Description of the protected action (e.g. "edit this recipe") */
    action?: string;
}

export function AuthGuard({ children, action = 'access this page' }: AuthGuardProps) {
    const { status } = useSession();

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Checking your session...
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-lg font-medium">
                    <Lock className="h-5 w-5" />
                    <span>Sign in required</span>
                </div>
                <p className="text-muted-foreground">
                    You need to sign in to {action}. Please sign in with Google to continue.
                </p>
                <div className="flex items-center justify-center">
                    <Button onClick={() => signIn('google')}>Sign in with Google</Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
