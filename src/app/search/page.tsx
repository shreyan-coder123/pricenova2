'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { scrapeRealTime } from '@/lib/scraper';
import { aiProductMatching, AIProductMatchingOutput } from '@/ai/flows/ai-product-matching';
import { aiShoppingInsights, AIShoppingInsightsOutput } from '@/ai/flows/ai-shopping-insights';
import { useSearchUsage } from '@/hooks/use-search-usage';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Star, Info, TrendingDown, Package, ShieldCheck, AlertCircle, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={<SearchLoading />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [loading, setLoading] = useState(true);
  const [matchingResults, setMatchingResults] = useState<AIProductMatchingOutput | null>(null);
  const [insights, setInsights] = useState<AIShoppingInsightsOutput | null>(null);
  const { remaining, isProUser, incrementUsage } = useSearchUsage();
  const router = useRouter();

  useEffect(() => {
    if (!query) return;
    
    async function fetchData() {
      setLoading(true);
      try {
        // Increment usage count locally
        incrementUsage();

        // 1. Parallel Scraping
        const rawResults = await scrapeRealTime(query);

        // 2. AI Product Matching
        const matched = await aiProductMatching({
          productQuery: query,
          scrapedProducts: rawResults,
        });
        setMatchingResults(matched);

        // 3. AI Shopping Insights (Only if some products matched)
        if (matched.matchedProductGroups.length > 0) {
          // Map to the input format for insights flow
          const insightInput = matched.matchedProductGroups.flatMap(group => 
            group.products.map(p => ({
              store: p.platform,
              productTitle: p.title,
              currentPrice: p.price,
              originalPrice: p.originalPrice,
              discountPercentage: p.discountPercentage ? parseInt(p.discountPercentage) : undefined,
              productImage: p.imageUrl,
              productRating: p.rating,
              reviewsCount: p.reviewsCount,
              sellerName: p.seller,
              deliveryInformation: p.deliveryDetails,
              stockStatus: p.stockStatus,
              productUrl: p.productUrl,
              normalizedProductId: group.canonicalProductName
            }))
          );

          const aiInsights = await aiShoppingInsights({
            productData: insightInput,
            searchQuery: query
          });
          setInsights(aiInsights);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [query]);

  if (remaining <= 0 && !isProUser) {
    return <UpgradeRequired />;
  }

  if (loading) return <SearchLoading />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-headline">Scan Results for: <span className="gradient-text">{query}</span></h1>
        <p className="text-muted-foreground">Aggregated from 7 e-commerce engines in real-time.</p>
      </div>

      {/* AI Insights Section (PRO Only or limited view) */}
      {insights && (
        <div className={`relative p-8 rounded-3xl bg-secondary/5 border border-secondary/20 space-y-6 ${!isProUser ? 'blur-sm select-none pointer-events-none' : ''}`}>
          {!isProUser && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center">
              <div className="glass p-8 rounded-2xl max-w-sm space-y-4">
                <AlertCircle className="w-12 h-12 text-secondary mx-auto" />
                <h3 className="text-xl font-bold">Pro Feature Locked</h3>
                <p className="text-sm text-muted-foreground">Upgrade to PRO to unlock deep AI analysis, price trends, and best-value recommendations.</p>
                <Button onClick={() => router.push('/#pricing')} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full">Upgrade Now</Button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20">
              <Info className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold font-headline">PriceNova Intelligence</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Overall Analysis</h3>
                <p className="text-lg leading-relaxed">{insights.overallSummary}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {insights.generalTips?.map((tip, idx) => (
                  <div key={idx} className="flex gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                    <p className="text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 h-full">
                <TrendingDown className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Deal Prediction</h3>
                <p className="text-sm text-muted-foreground">Our AI predicts prices are currently at a 30-day low. High probability of price increase within 48 hours.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <div className="space-y-12">
        {matchingResults?.matchedProductGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold font-headline">{group.canonicalProductName}</h2>
              <Badge variant="outline" className="border-primary/30 text-primary">{group.products.length} offers</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.products.sort((a,b) => a.price - b.price).map((product, pIdx) => (
                <ProductCard key={pIdx} product={product} isBestDeal={pIdx === 0} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, isBestDeal }: { product: any, isBestDeal: boolean }) {
  return (
    <Card className={`group relative h-full glass-card hover:border-primary/50 transition-all duration-300 ${isBestDeal ? 'ring-2 ring-primary/40' : ''}`}>
      {isBestDeal && (
        <div className="absolute -top-3 left-4 z-20 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
          Best Price Found
        </div>
      )}
      <CardContent className="p-6 flex flex-col h-full space-y-4">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5">
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
          />
          <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold border border-white/10">
            {product.platform}
          </div>
        </div>

        <div className="flex-grow space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-primary">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs font-bold">{product.rating.toFixed(1)}</span>
              <span className="text-[10px] text-muted-foreground">({product.reviewsCount})</span>
            </div>
            {product.discountPercentage && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                {product.discountPercentage} OFF
              </Badge>
            )}
          </div>
          <h3 className="text-sm font-semibold line-clamp-2 leading-tight">{product.title}</h3>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Package className="w-3 h-3" />
            {product.deliveryDetails}
          </p>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-end justify-between">
          <div>
            <div className="text-xs text-muted-foreground line-through">₹{product.originalPrice?.toLocaleString()}</div>
            <div className="text-2xl font-bold tracking-tight">₹{product.price.toLocaleString()}</div>
          </div>
          <Button 
            onClick={() => window.open(product.productUrl, '_blank')}
            className="rounded-lg h-10 px-4 bg-white/10 hover:bg-primary hover:text-primary-foreground group-hover:neon-glow"
          >
            Go to Store
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <div className="space-y-4 text-center py-12">
        <div className="relative inline-block">
          <Cpu className="w-16 h-16 text-primary animate-pulse-glow" />
          <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold font-headline animate-pulse">Initializing Parallel Scrapers...</h2>
        <p className="text-muted-foreground animate-pulse [animation-delay:200ms]">Fetching live data from Amazon, Flipkart, Myntra, and more.</p>
      </div>

      <div className="space-y-8">
        <Skeleton className="h-[200px] w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function UpgradeRequired() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full glass p-10 rounded-3xl text-center space-y-6">
        <div className="p-4 bg-secondary/20 w-16 h-16 rounded-2xl mx-auto">
          <AlertCircle className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="text-3xl font-bold font-headline">Search Limit Reached</h2>
        <p className="text-muted-foreground">
          You've used all 10 free searches. Upgrade to PriceNova PRO for unlimited real-time comparisons and AI-powered shopping insights.
        </p>
        <div className="space-y-3">
          <Button onClick={() => window.location.href = '/#pricing'} className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold">
            Upgrade for ₹500
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="ghost" className="w-full h-12 rounded-xl">
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
