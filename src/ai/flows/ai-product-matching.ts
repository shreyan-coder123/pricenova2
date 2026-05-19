
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
  prompt: `You are an expert product data analyst for PriceNova.
Your CRITICAL task is to identify and group IDENTICAL physical products from a list of scraped data to enable price comparison across different platforms (Amazon, Flipkart, Meesho, etc.).

CRITICAL INSTRUCTIONS:
1. IDENTICAL PRODUCT DEFINITION: Products are identical if they are the exact same make, model, variant (RAM, Storage, Size, etc.), and condition (New).
2. IGNORE PRICE: Do not use price differences to decide if products are different. The SAME product will have different prices at different stores.
3. BE AGGRESSIVE: If you see "iPhone 16 128GB" and "Apple iPhone 16 (128 GB, Black)", these are the SAME product. They MUST be in the same group.
4. TARGET: The user wants to compare stores. Your goal is to maximize the number of stores in each group.
5. VARIANTS: Only create separate groups for actual spec differences (e.g., 128GB vs 256GB). If specs are identical but names vary slightly, group them.
6. EXAMPLES:
   - "Sony WH-1000XM5" and "Sony XM5 Headphones" -> SAME group.
   - "Nike Pegasus 40" and "Nike Air Zoom Pegasus 40" -> SAME group.
   - "OnePlus 12 (12GB RAM)" and "OnePlus 12 (16GB RAM)" -> DIFFERENT groups.

User's search: "{{{productQuery}}}"

Product Data to Analyze:
{{#each scrapedProducts}}
- Store: {{this.platform}} | Title: {{{this.title}}} | Price: ₹{{this.price}}
{{/each}}

Analyze ALL products. Group them and return a JSON object with 'matchedProductGroups'. Every input product must belong to a group.`,
});

const aiProductMatchingFlow = ai.defineFlow(
  {
    name: 'aiProductMatchingFlow',
    inputSchema: AIProductMatchingInputSchema,
    outputSchema: AIProductMatchingOutputSchema,
  },
  async (input) => {
    // If we have many products, we want to ensure the AI doesn't cut off.
    // We send up to 50 for robust grouping quality.
    const limitedInput = {
      ...input,
      scrapedProducts: input.scrapedProducts.slice(0, 50)
    };
    const { output } = await productMatchingPrompt(limitedInput);
    return output!;
  }
);
