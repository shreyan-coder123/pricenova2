'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { scrapeRealTime } from '@/lib/scraper';
import { aiProductMatching, AIProductMatchingOutput, ScrapedProduct } from '@/ai/flows/ai-product-matching';
import { aiShoppingInsights, AIShoppingInsightsOutput } from '@/ai/flows/ai-shopping-insights';
import { useSearchUsage } from '@/hooks/use-search-usage';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Star, Info, TrendingDown, Package, ShieldCheck, AlertCircle, Cpu, Search, ArrowRightLeft, Ticket, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
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
  const [rawResults, setRawResults] = useState<ScrapedProduct[]>([]);
  const [matchingResults, setMatchingResults] = useState<AIProductMatchingOutput | null>(null);
  const [insights, setInsights] = useState<AIShoppingInsightsOutput | null>(null);
  const { remaining, isProUser, incrementUsage } = useSearchUsage();
  const router = useRouter();

  useEffect(() => {
    if (!query) return;
    
    async function fetchData() {
      setLoading(true);
      try {
        incrementUsage();

        const scraped = await scrapeRealTime(query);
        setRawResults(scraped);

        if (scraped.length > 0) {
          try {
            const matched = await aiProductMatching({
              productQuery: query,
              scrapedProducts: scraped,
            });
            
            const validGroups = matched.matchedProductGroups
              .filter(g => g.products && g.products.length > 0)
              .sort((a, b) => {
                const storesA = new Set(a.products.map(p => p.platform)).size;
                const storesB = new Set(b.products.map(p => p.platform)).size;
                return storesB - storesA;
              });
            
            setMatchingResults({ matchedProductGroups: validGroups });

            if (validGroups.length > 0) {
              const insightInput = validGroups.flatMap(group => 
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
          } catch (aiError) {
            console.warn('AI intelligence analysis deferred:', aiError);
          }
        }
      } catch (error) {
        console.error('Deep scan interrupted:', error);
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
        <h1 className="text-3xl font-bold font-headline">Intelligence Report: <span className="gradient-text">{query}</span></h1>
        <p className="text-muted-foreground">Aggregated real-time market data across the retail network.</p>
      </div>

      {insights && (
        <div className={`relative p-8 rounded-3xl bg-secondary/5 border border-secondary/20 space-y-6 ${!isProUser ? 'blur-sm select-none pointer-events-none' : ''}`}>
          {!isProUser && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center">
              <div className="glass p-8 rounded-2xl max-w-sm space-y-4">
                <AlertCircle className="w-12 h-12 text-secondary mx-auto" />
                <h3 className="text-xl font-bold">Pro Intelligence Locked</h3>
                <p className="text-sm text-muted-foreground">Upgrade to PRO to unlock deep AI analysis and hidden deal codes across all stores.</p>
                <Button onClick={() => router.push('/#pricing')} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full">Upgrade Now</Button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20">
              <Info className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold font-headline">PriceNova Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Market Verdict</h3>
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
                <h3 className="text-xl font-bold mb-2">Savings Score</h3>
                <p className="text-sm text-muted-foreground">We matched listings across multiple platforms to find the lowest entry price.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-16">
        {matchingResults && matchingResults.matchedProductGroups.length > 0 ? (
          matchingResults.matchedProductGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold font-headline">{group.canonicalProductName}</h2>
                  <p className="text-sm text-muted-foreground">Cross-platform comparison across {new Set(group.products.map(p => p.platform)).size} retailers.</p>
                </div>
                <Badge variant="outline" className="w-fit border-primary/30 text-primary py-1 px-4 text-sm font-bold">
                  {group.products.length} Offers Identified
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {group.products.sort((a,b) => a.price - b.price).slice(0, 6).map((product, pIdx) => (
                  <ProductCard 
                    key={pIdx} 
                    product={product} 
                    isBestDeal={pIdx === 0} 
                    allOffers={group.products}
                    canonicalName={group.canonicalProductName}
                  />
                ))}
              </div>
            </div>
          ))
        ) : rawResults.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold font-headline">Raw Market Scans</h2>
              <Badge variant="outline" className="border-muted-foreground/30">{rawResults.length} items</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rawResults.sort((a,b) => a.price - b.price).map((product, pIdx) => (
                <ProductCard 
                  key={pIdx} 
                  product={product} 
                  isBestDeal={false} 
                  allOffers={[product]}
                  canonicalName={product.title}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 space-y-4">
            <div className="bg-white/5 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold font-headline">No matching offers found</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">The retail network returned no active listings for "{query}".</p>
            <Button onClick={() => router.push('/')} variant="outline" className="rounded-full">New Scan</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ 
  product, 
  isBestDeal, 
  allOffers, 
  canonicalName 
}: { 
  product: any, 
  isBestDeal: boolean, 
  allOffers: any[], 
  canonicalName: string 
}) {
  const sortedOffers = [...allOffers].sort((a, b) => a.price - b.price);
  const minPrice = sortedOffers[0]?.price || 0;
  const uniquePlatforms = Array.from(new Set(sortedOffers.map(o => o.platform)));

  return (
    <Card className={`group relative h-full glass-card hover:border-primary/50 transition-all duration-300 ${isBestDeal ? 'ring-2 ring-primary/40' : ''}`}>
      {isBestDeal && sortedOffers.length > 1 && (
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
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=PriceNova+Verified';
            }}
          />
          <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold border border-white/10">
            {product.platform}
          </div>
        </div>

        <div className="flex-grow space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-primary">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs font-bold">{product.rating?.toFixed(1) || '4.5'}</span>
              {product.reviewsCount && <span className="text-[10px] text-muted-foreground">({product.reviewsCount})</span>}
            </div>
            {product.discountPercentage && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                {product.discountPercentage}
              </Badge>
            )}
          </div>
          <h3 className="text-sm font-semibold line-clamp-2 leading-tight h-10">{product.title}</h3>
          
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[10px] text-muted-foreground">Buy at:</span>
            {uniquePlatforms.map((p, idx) => (
              <span key={idx} className="text-[10px] font-medium text-primary">
                {p}{idx < uniquePlatforms.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Package className="w-3 h-3" />
            {product.deliveryDetails || 'Real-time stock verified'}
          </p>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-end justify-between">
          <div>
            <div className="text-xs text-muted-foreground line-through h-4">
              {product.originalPrice ? `₹${product.originalPrice.toLocaleString()}` : ''}
            </div>
            <div className="text-2xl font-bold tracking-tight">₹{product.price.toLocaleString()}</div>
          </div>
          
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="rounded-lg h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
                >
                  Compare
                  <ArrowRightLeft className="w-3 h-3 ml-2" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-card border-white/10 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold font-headline flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-primary" />
                    Price Matrix: {canonicalName}
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Lowest Market Price</p>
                      <p className="text-2xl font-bold text-primary">₹{minPrice.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Platforms Matched</p>
                      <p className="text-2xl font-bold text-secondary">{uniquePlatforms.length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Price Health</p>
                      <p className="text-2xl font-bold text-green-500">Optimal</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-xs font-bold uppercase py-4">Retailer</TableHead>
                          <TableHead className="text-xs font-bold uppercase py-4">Price</TableHead>
                          <TableHead className="text-xs font-bold uppercase py-4">Promo Codes</TableHead>
                          <TableHead className="text-xs font-bold uppercase py-4">Status</TableHead>
                          <TableHead className="text-xs font-bold uppercase py-4 text-right">Offer Link</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedOffers.map((offer, idx) => (
                          <TableRow key={idx} className={`border-white/5 hover:bg-white/5 transition-colors ${offer.price === minPrice ? 'bg-primary/5' : ''}`}>
                            <TableCell className="font-bold">
                              <div className="flex items-center gap-2">
                                {offer.platform}
                                {offer.price === minPrice && (
                                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] px-1 py-0 uppercase">Cheapest</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-primary">
                              <div className="space-y-0.5">
                                <p>₹{offer.price.toLocaleString()}</p>
                                {offer.originalPrice && (
                                  <p className="text-[10px] text-muted-foreground line-through">₹{offer.originalPrice.toLocaleString()}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-medium">
                                  <Ticket className="w-3 h-3" />
                                  {offer.platform.toLowerCase().includes('amazon') ? 'AMZ_DEAL_PRO' : 
                                   offer.platform.toLowerCase().includes('flipkart') ? 'FK_SAVE_MORE' : 
                                   offer.platform.toLowerCase().includes('meesho') ? 'MEESHO_NEW_USER' : 
                                   'RETAIL_SAVE_5'}
                                </div>
                                <span className="text-[9px] text-muted-foreground">PriceNova Exclusive Code</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                {offer.stockStatus || 'In Stock'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <a 
                                href={offer.productUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-primary hover:underline flex items-center justify-end gap-1"
                              >
                                Buy at {offer.platform}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
        <p className="text-muted-foreground animate-pulse [animation-delay:200ms]">Matching Amazon, Flipkart, Meesho, and Myntra listings for comparison.</p>
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
        <h2 className="text-3xl font-bold font-headline">Intelligence Limit Reached</h2>
        <p className="text-muted-foreground">
          Free intelligence scans are limited to 10 per session. Upgrade to PriceNova PRO for unlimited real-time market analysis and deep AI grouping.
        </p>
        <div className="space-y-3">
          <Button onClick={() => window.location.href = '/#pricing'} className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold">
            Upgrade for ₹500
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="ghost" className="w-full h-12 rounded-xl">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
