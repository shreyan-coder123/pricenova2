
'use server';

import { ScrapedProduct } from '@/ai/flows/ai-product-matching';

/**
 * Real-time scraper using SerpApi Google Shopping engine.
 * Fetches actual product data including real images, prices, and sellers.
 */
export async function scrapeRealTime(query: string): Promise<ScrapedProduct[]> {
  const apiKey = process.env.SERPAPI_KEY || '4497efce288f226e7abd17121b9844a1b77453303c43ef8ae7643a690f469662';
  
  // We use the Google Shopping engine for accurate e-commerce results.
  // Using gl=in for India context (INR prices) as per original app theme.
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${apiKey}&hl=en&gl=in`;

  try {
    const response = await fetch(url, { 
      next: { revalidate: 3600 },
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`SerpApi responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.shopping_results || !Array.isArray(data.shopping_results)) {
      console.warn('No shopping results found for query:', query);
      return [];
    }

    return data.shopping_results.map((item: any) => ({
      platform: item.source || 'Online Store',
      title: item.title || 'Product Name Unavailable',
      price: item.extracted_price || 0,
      originalPrice: item.old_price ? parseFloat(item.old_price.replace(/[^0-9.]/g, '')) : undefined,
      discountPercentage: undefined, // AI flows will infer this or it can be calculated
      imageUrl: item.thumbnail || 'https://picsum.photos/seed/placeholder/400/400',
      productUrl: item.link || '#',
      rating: item.rating,
      reviewsCount: item.reviews,
      seller: item.source || 'Verified Seller',
      deliveryDetails: item.delivery || 'Shipping details at store',
      stockStatus: 'In Stock'
    }));
  } catch (error) {
    console.error('SerpApi scraping failed:', error);
    return [];
  }
}
