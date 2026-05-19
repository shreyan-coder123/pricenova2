
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchHero() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const trending = ['iPhone 16', 'Nvidia RTX 5090', 'Sony A7R V', 'Nike Dunk Low'];

  return (
    <div className="relative pt-20 pb-16 px-6 text-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto space-y-8">
        <div className="space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Next-Gen Comparison Engine v2.5
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-headline">
            The Future of <br />
            <span className="gradient-text">Shopping Intelligence</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            PriceNova scrapes the entire web in real-time to find you the best deals across 7 major platforms. No accounts, no data storage, just pure AI insights.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200" />
          <div className="relative flex items-center bg-card border border-white/10 rounded-2xl p-2 pl-6">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search for any product (e.g. iPhone 16)..." 
              className="border-none bg-transparent focus-visible:ring-0 text-lg py-6 placeholder:text-muted-foreground/50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button size="lg" className="rounded-xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Scan
            </Button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm text-muted-foreground animate-fade-in [animation-delay:200ms]">
          <span className="flex items-center gap-1 font-medium">
            <TrendingUp className="w-4 h-4" />
            Trending:
          </span>
          {trending.map((item) => (
            <button
              key={item}
              onClick={() => router.push(`/search?q=${encodeURIComponent(item)}`)}
              className="px-3 py-1 rounded-full border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
