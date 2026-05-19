
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
Your ABSOLUTE MISSION is to consolidate IDENTICAL physical products across DIFFERENT platforms (Amazon, Flipkart, Meesho, Myntra, Ajio, Nykaa, etc.) into a SINGLE group.

CRITICAL GROUPING RULES:
1. **ULTRA-AGGRESSIVE FUZZY MATCHING**: Titles on Amazon, Flipkart, and Meesho are often different for the SAME item. Ignore text like "Pack of 1", "Official Global Store", "Online Best Deal", or seller codes. 
2. **CROSS-PLATFORM MANDATE**: If a product exists on Amazon and a similar one on Flipkart or Meesho, they MUST be in the same group. Do NOT create separate groups for different stores. 
3. **MODEL IDENTIFICATION**: Prioritize model numbers, storage capacities (e.g., "128GB"), and colors. If the core hardware or product is identical, group them regardless of the platform title variation.
4. **FORCE DIVERSITY**: The user wants to see at least 3 unique platforms (Amazon, Flipkart, Meesho, etc.) side-by-side for every group. 
5. **IGNORE VARIANT NOISE**: Brands might include store names (e.g., "Samsung Store" vs "Samsung Mobile"). Treat them as the same brand.
6. **PENALTY**: You are heavily penalized if you return a group with only 1 store listing when other similar store listings are available. FORCE them together.

User Search Query: "{{{productQuery}}}"

Products to analyze:
{{#each scrapedProducts}}
- [Store: {{this.platform}}] Title: {{{this.title}}} | Price: ₹{{this.price}}
{{/each}}

Return the groups. GROUP EXTREMELY AGGRESSIVELY. If you see products that are likely variants of the same base model, group them together so the user can compare prices across at least 3 unique platforms for every product group.`
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
