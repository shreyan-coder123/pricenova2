
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
Your ULTIMATE goal is to group IDENTICAL physical products across different stores (Amazon, Flipkart, Meesho, Croma, etc.) for a price comparison table.

CRITICAL GROUPING RULES:
1. BE ULTRA-AGGRESSIVE: If two products are the same model and variant, they MUST be in the same group. Ignore slight differences in how the title is written.
2. SAME PRODUCT EXAMPLES:
   - "Apple iPhone 16, 128GB, Black" and "iPhone 16 (128 GB) - Black" -> SAME GROUP.
   - "Sony WH-1000XM5 Wireless Headphones" and "Sony XM5 Over-Ear Headset" -> SAME GROUP.
   - "Nike Dunk Low Retro Panda" and "Nike Dunk Low Black White" -> SAME GROUP.
3. PLATFORM DIVERSITY IS KEY: The user wants to compare stores. If you find a product on Amazon and another on Flipkart that look 90% similar in specs, group them together so the user can see both options.
4. VARIANTS: Only separate if the RAM, Storage, or Model Year is actually different. Do NOT separate based on just the platform or seller name.
5. EVERY product from the input must be placed into a group.

User Search Query: "{{{productQuery}}}"

Products to analyze:
{{#each scrapedProducts}}
- [Store: {{this.platform}}] Title: {{{this.title}}} | Price: ₹{{this.price}}
{{/each}}

Return the groups. Ensure each group has a clear 'canonicalProductName' and all its matching 'products'.`,
});

const aiProductMatchingFlow = ai.defineFlow(
  {
    name: 'aiProductMatchingFlow',
    inputSchema: AIProductMatchingInputSchema,
    outputSchema: AIProductMatchingOutputSchema,
  },
  async (input) => {
    // We send up to 60 products for maximum matching potential
    const limitedInput = {
      ...input,
      scrapedProducts: input.scrapedProducts.slice(0, 60)
    };
    const { output } = await productMatchingPrompt(limitedInput);
    return output!;
  }
);
