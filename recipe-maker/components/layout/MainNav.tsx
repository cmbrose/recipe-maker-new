'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/menus', label: 'Menus' },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            Recipe Maker
          </Link>
          <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/recipes/new">New Recipe</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/recipes/new/from-url">Import from URL</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
