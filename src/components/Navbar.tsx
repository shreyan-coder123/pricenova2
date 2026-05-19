
'use client';

import Link from 'next/link';
import { Cpu, Zap, ShoppingCart } from 'lucide-react';
import { useSearchUsage } from '@/hooks/use-search-usage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { isProUser, remaining } = useSearchUsage();

  return (
    <nav className="sticky top-0 z-50 w-full px-6 py-4">
      <div className="mx-auto max-w-7xl glass rounded-full px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
            <Cpu className="w-6 h-6 text-primary neon-glow" />
          </div>
          <span className="text-xl font-bold tracking-tighter gradient-text font-headline">
            PRICENOVA
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Intelligence</Link>
          <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pro Access</Link>
          <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">The Network</Link>
        </div>

        <div className="flex items-center gap-4">
          {!isProUser ? (
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <Zap className="w-4 h-4 text-secondary" />
              <span className="text-xs font-medium text-muted-foreground">
                {remaining} searches left
              </span>
            </div>
          ) : (
            <Badge variant="secondary" className="bg-secondary/20 text-secondary border-secondary/30">
              PRO USER
            </Badge>
          )}
          <Button variant="outline" className="rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary hidden sm:flex">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Comparison Cart
          </Button>
        </div>
      </div>
    </nav>
  );
}
