'use server';
/**
 * @fileOverview An AI product matching engine that identifies and groups identical physical products
 * across multiple e-commerce platforms based on scraped product data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScrapedProductSchema = z.object({
  platform: z.string().describe('The platform (e.g., "Amazon", "Flipkart", "Meesho").'),
  title: z.string().describe('The title of the product.'),
  price: z.number().describe('The current price.'),
  originalPrice: z.number().optional().describe('The original price.'),
  discountPercentage: z.string().optional().describe('The discount string.'),
  imageUrl: z.string().url().describe('The image URL.'),
  productUrl: z.string().url().describe('The direct URL to buy.'),
  rating: z.number().optional().describe('Average rating.'),
  reviewsCount: z.number().optional().describe('Number of reviews.'),
  seller: z.string().optional().describe('Seller name.'),
  deliveryDetails: z.string().optional().describe('Delivery info.'),
  stockStatus: z.string().optional().describe('Stock status.'),
});

export type ScrapedProduct = z.infer<typeof ScrapedProductSchema>;

const AIProductMatchingInputSchema = z.object({
  productQuery: z.string().describe('The user search query.'),
  scrapedProducts: z.array(ScrapedProductSchema).describe('Array of scraped data.'),
});
export type AIProductMatchingInput = z.infer<typeof AIProductMatchingInputSchema>;

const MatchedProductGroupSchema = z.object({
  canonicalProductName: z.string().describe('Normalized name for the product.'),
  products: z.array(ScrapedProductSchema).describe('Products in this group.'),
  reasoning: z.string().optional().describe('Grouping logic.'),
});

const AIProductMatchingOutputSchema = z.object({
  matchedProductGroups: z.array(MatchedProductGroupSchema).describe('Consolidated product groups.'),
});
export type AIProductMatchingOutput = z.infer<typeof AIProductMatchingOutputSchema>;

export async function aiProductMatching(input: AIProductMatchingInput): Promise<AIProductMatchingOutput> {
  return aiProductMatchingFlow(input);
}

const productMatchingPrompt = ai.definePrompt({
  name: 'productMatchingPrompt',
  input: { schema: AIProductMatchingInputSchema },
  output: { schema: AIProductMatchingOutputSchema },
  prompt: `You are the Lead Grouping Engine for Price Cart. 
Your SOLE PURPOSE is to group identical physical products across Amazon, Flipkart, Meesho, and others into ONE group.

STRICT GROUPING RULES:
1. **ULTRA-AGGRESSIVE FUZZY MATCHING**: Titles vary wildly. Ignore platform fluff like "Great Indian Festival", "Lowest Price", or seller codes. If they are the same physical model (e.g., iPhone 16), THEY MUST BE GROUPED.
2. **PLATFORM DIVERSITY**: I want to see Amazon, Flipkart, and Meesho side-by-side. If you find a product on Amazon and a similar one on Flipkart, they are the SAME product. Group them.
3. **MODEL OVER BRAND**: Prioritize storage (128GB, 256GB), color, and model numbers. 
4. **NO SPLITTING**: It is better to have a slightly mismatched group than to show the same product in three separate cards. 
5. **MINIMUM PLATFORMS**: Try to ensure every group contains listings from at least 3 different platforms if the data exists.

User Search Query: "{{{productQuery}}}"

Products to analyze:
{{#each scrapedProducts}}
- [Store: {{this.platform}}] Title: {{{this.title}}} | Price: ₹{{this.price}}
{{/each}}

Group them aggressively. Show the user a true market comparison across at least 3 platforms per product.`
});

const aiProductMatchingFlow = ai.defineFlow(
  {
    name: 'aiProductMatchingFlow',
    inputSchema: AIProductMatchingInputSchema,
    outputSchema: AIProductMatchingOutputSchema,
  },
  async (input) => {
    const { output } = await productMatchingPrompt(input);
    return output!;
  }
);
