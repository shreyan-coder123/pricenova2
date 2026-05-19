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
Your ULTIMATE goal is to group IDENTICAL physical products across different stores (Amazon, Flipkart, Meesho, Croma, Ajio, Myntra, etc.) for a price comparison table.

CRITICAL GROUPING RULES:
1. BE ULTRA-AGGRESSIVE: If two products are the same model and variant (e.g., iPhone 16 128GB), they MUST be in the same group. 
2. IGNORE TITLE NOISE: Stores often use different titles. If the brand and model match, they are the same.
3. MANDATORY MULTI-STORE GOAL: The user wants to see at least 3 stores for comparison. Group as many variants together as logically possible to provide a broad market view.
4. SAME PRODUCT EXAMPLES:
   - "Apple iPhone 16, 128GB, Black" (Amazon)
   - "iPhone 16 (128 GB) - Black" (Flipkart)
   - "Apple iPhone 16 128GB Black - Sealed" (Meesho)
   -> THESE MUST BE ONE GROUP.
5. NO SMALL GROUPS: Avoid creating groups with only 1 product if there is ANY other product in the list that is even 80% similar in specs.

User Search Query: "{{{productQuery}}}"

Products to analyze:
{{#each scrapedProducts}}
- [Store: {{this.platform}}] Title: {{{this.title}}} | Price: ₹{{this.price}}
{{/each}}

Return the groups. Ensure each group contains all matching products from every available platform.`,
});

const aiProductMatchingFlow = ai.defineFlow(
  {
    name: 'aiProductMatchingFlow',
    inputSchema: AIProductMatchingInputSchema,
    outputSchema: AIProductMatchingOutputSchema,
  },
  async (input) => {
    // Processing up to 80 products for deeper matching potential
    const limitedInput = {
      ...input,
      scrapedProducts: input.scrapedProducts.slice(0, 80)
    };
    const { output } = await productMatchingPrompt(limitedInput);
    return output!;
  }
);