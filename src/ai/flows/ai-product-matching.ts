'use server';
/**
 * @fileOverview An AI product matching engine that identifies and groups identical physical products
 * across multiple e-commerce platforms.
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
Your SOLE PURPOSE is to group identical physical products across Amazon, Flipkart, Meesho, and others into groups for comparison.

STRICT GROUPING RULES:
1. **ULTRA-AGGRESSIVE FUZZY MATCHING**: Titles vary wildly across stores. Ignore platform fluff like "Great Indian Festival", "Lowest Price", "Deal of the Day", or seller codes. If they are the same physical model (e.g., iPhone 16), THEY MUST BE GROUPED.
2. **PRIORITIZE CROSS-PLATFORM**: Your primary goal is to find listings for the same product on Amazon, Flipkart, and Meesho and group them together. 
3. **MODEL IDENTIFICATION**: Use model numbers, storage capacities (128GB, 256GB), RAM, and specific colors to identify matches.
4. **NO PRODUCT LEFT BEHIND**: Every single input product MUST be included in the output. If a product doesn't have a match, put it in its own group.
5. **CANONICAL NAMING**: Create a clean, concise name for the group (e.g., "Apple iPhone 16 (Black, 128GB)").

User Search Query: "{{{productQuery}}}"

Products to analyze:
{{#each scrapedProducts}}
- [Store: {{this.platform}}] Title: {{{this.title}}} | Price: ₹{{this.price}}
{{/each}}

Group all products into groups. Ensure that products that are likely the same physical item across different stores are consolidated.`
});

const aiProductMatchingFlow = ai.defineFlow(
  {
    name: 'aiProductMatchingFlow',
    inputSchema: AIProductMatchingInputSchema,
    outputSchema: AIProductMatchingOutputSchema,
  },
  async (input) => {
    if (!input.scrapedProducts || input.scrapedProducts.length === 0) {
      return { matchedProductGroups: [] };
    }
    const { output } = await productMatchingPrompt(input);
    return output!;
  }
);
