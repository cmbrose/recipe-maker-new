'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getTagFilterUrl } from '@/lib/utils/tag-url';

interface ClickableTagProps {
    tag: string;
    variant?: 'default' | 'secondary' | 'outline';
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export function ClickableTag({
    tag,
    variant = 'secondary',
    className = '',
    onClick
}: ClickableTagProps) {
    return (
        <Badge
            variant={variant}
            className={`text-xs hover:bg-secondary/80 cursor-pointer ${className}`}
            asChild
        >
            <Link
                href={getTagFilterUrl(tag)}
                onClick={onClick}
            >
                {tag}
            </Link>
        </Badge>
    );
}