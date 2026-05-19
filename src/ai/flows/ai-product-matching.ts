'use server';
/**
 * @fileOverview An AI product matching engine that identifies and groups identical physical products
 * across multiple e-commerce platforms based on scraped product data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScrapedProductSchema = z.object({
  platform: z.string().describe('The e-commerce platform where the product was scraped from (e.g., "Amazon India", "Flipkart").'),
  title: z.string().describe('The title of the product as listed on the e-commerce platform.'),
  price: z.number().describe('The current selling price of the product.'),
  originalPrice: z.number().optional().describe('The original price of the product before any discount, if available.'),
  discountPercentage: z.string().optional().describe('The discount percentage, if any (e.g., "15%").'),
  imageUrl: z.string().url().describe('The URL of the product image.'),
  productUrl: z.string().url().describe('The direct URL to the product page on the e-commerce platform.'),
  rating: z.number().optional().describe('The average customer rating for the product, if available.'),
  reviewsCount: z.number().optional().describe('The number of customer reviews for the product, if available.'),
  seller: z.string().optional().describe('The name of the seller or store.'),
  deliveryDetails: z.string().optional().describe('Information regarding delivery, e.g., estimated delivery time.'),
  stockStatus: z.string().optional().describe('The current stock status of the product (e.g., "In Stock", "Out of Stock").'),
});

export type ScrapedProduct = z.infer<typeof ScrapedProductSchema>;

const AIProductMatchingInputSchema = z.object({
  productQuery: z.string().describe('The original search query entered by the user (e.g., "iPhone 16").'),
  scrapedProducts: z.array(ScrapedProductSchema).describe('An array of product data scraped from various e-commerce websites.'),
});
export type AIProductMatchingInput = z.infer<typeof AIProductMatchingInputSchema>;

const MatchedProductGroupSchema = z.object({
  canonicalProductName: z.string().describe('A normalized and standardized name for the identified product group.'),
  products: z.array(ScrapedProductSchema).describe('An array of individual scraped product objects that belong to this identified product group.'),
  reasoning: z.string().optional().describe('A brief explanation of why these products were grouped together, if helpful.'),
});

const AIProductMatchingOutputSchema = z.object({
  matchedProductGroups: z.array(MatchedProductGroupSchema).describe('An array of groups, where each group contains identical physical products identified across different e-commerce platforms.'),
});
export type AIProductMatchingOutput = z.infer<typeof AIProductMatchingOutputSchema>;

export async function aiProductMatching(input: AIProductMatchingInput): Promise<AIProductMatchingOutput> {
  return aiProductMatchingFlow(input);
}

const productMatchingPrompt = ai.definePrompt({
  name: 'productMatchingPrompt',
  input: { schema: AIProductMatchingInputSchema },
  output: { schema: AIProductMatchingOutputSchema },
  prompt: `You are the Lead Data Scientist for PriceNova. 
Your ABSOLUTE MISSION is to consolidate IDENTICAL physical products across DIFFERENT platforms (Amazon, Flipkart, Meesho, Myntra, Ajio, Croma, Nykaa, etc.) into a SINGLE group.

CRITICAL RULES:
1. **CROSS-PLATFORM MANDATE**: If a product exists on Amazon and a similar one on Flipkart/Meesho, they MUST be in the same group. The user wants to compare these stores side-by-side.
2. **IGNORE VARIANT NOISE**: Ignore text like "Pack of 1", "Pack of 2", "Free Delivery", "New Arrival", or seller-specific codes. If the core hardware or item is the same, group them.
3. **FUZZY BRAND MATCHING**: Brands might be spelled differently or include store names (e.g., "Samsung Store" vs "Samsung Mobile"). Treat them as the same brand.
4. **MODEL MATCHING**: Prioritize grouping by model name (e.g., "iPhone 16", "RTX 4060", "Sony WH-1000XM5"). 
5. **FORCE DIVERSITY**: Do not create separate groups for Amazon and Flipkart if the item is the same. Consolidate them so the user sees Amazon, Flipkart, and Meesho listings together for every single product group.

User Search Query: "{{{productQuery}}}"

Products to analyze:
{{#each scrapedProducts}}
- [Store: {{this.platform}}] Title: {{{this.title}}} | Price: ₹{{this.price}}
{{/each}}

Return the groups. GROUP EXTREMELY AGGRESSIVELY to ensure the user sees price comparisons across at least 3 unique platforms (Amazon, Flipkart, Meesho, etc.) for every product.`
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