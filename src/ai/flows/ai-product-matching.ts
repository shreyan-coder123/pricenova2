
'use server';
/**
 * @fileOverview An AI product matching engine that identifies and groups identical physical products
 * across multiple e-commerce platforms based on scraped product data.
 *
 * - aiProductMatching - A function that handles the AI product matching process.
 * - AIProductMatchingInput - The input type for the aiProductMatching function.
 * - AIProductMatchingOutput - The return type for the aiProductMatching function.
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
  prompt: `You are an intelligent AI product matching engine for PriceNova.
Your CRITICAL task is to group IDENTICAL physical products across different platforms (Amazon, Flipkart, Meesho, Meesho India, Croma, etc.).

Strict Matching Guidelines:
1. If two products have the same model name, specifications (e.g., "8GB RAM, 128GB Storage"), and color, they MUST be in the same group.
2. Be aggressive in grouping. Small differences in titles (e.g., "Apple iPhone 16" vs "iPhone 16 (Black)") should still result in a group if it's clearly the same device.
3. Your goal is to provide a comprehensive comparison. If you find multiple listings for the same item, group them so the user can see all store options in one place.
4. If a query is "Sony A7R V", group all listings of that camera from all platforms together.

User's search: "{{{productQuery}}}"

Product Data to Analyze:
{{#each scrapedProducts}}
Store: {{this.platform}} | Title: {{{this.title}}} | Price: ₹{{this.price}}
{{/each}}

Identify the groups and return a JSON object with 'matchedProductGroups'. Each group must have a standardized 'canonicalProductName'.`,
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
