'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating AI-powered shopping insights and recommendations.
 *
 * - aiShoppingInsights - A function that handles the generation of shopping insights based on product comparison data.
 * - AIShoppingInsightsInput - The input type for the aiShoppingInsights function, representing normalized product data.
 * - AIShoppingInsightsOutput - The return type for the aiShoppingInsights function, containing AI-generated insights.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema: an array of normalized product data, potentially containing matched products
const ProductDataItemSchema = z.object({
  store: z.string().describe('The name of the e-commerce store (e.g., Amazon, Flipkart).'),
  productTitle: z.string().describe('The title of the product.'),
  currentPrice: z.number().positive().describe('The current selling price of the product.'),
  originalPrice: z.number().positive().optional().describe('The original price of the product before discount.'),
  discountPercentage: z.number().optional().describe('The discount percentage, if any.'),
  productImage: z.string().url().optional().describe('URL of the product image.'),
  productRating: z.number().min(0).max(5).optional().describe('The average rating of the product.'),
  reviewsCount: z.number().int().min(0).optional().describe('The number of reviews for the product.'),
  sellerName: z.string().optional().describe('The name of the seller or store.'),
  deliveryInformation: z.string().optional().describe('Details about delivery times and costs.'),
  stockStatus: z.string().optional().describe('Current stock availability (e.g., "In Stock", "Out of Stock").'),
  productUrl: z.string().url().describe('The direct URL to the product page.'),
  // This is crucial for matching identical products across stores
  normalizedProductId: z.string().optional().describe('A unique identifier for the product after normalization and matching across stores. If not present, AI should infer uniqueness.'),
});

const AIShoppingInsightsInputSchema = z.object({
  productData: z.array(ProductDataItemSchema).describe('An array of product data objects from various e-commerce platforms after normalization and potential matching.'),
  searchQuery: z.string().optional().describe('The original search query entered by the user.'),
});
export type AIShoppingInsightsInput = z.infer<typeof AIShoppingInsightsInputSchema>;

// Output Schema: AI-generated shopping insights
const ProductInsightSchema = z.object({
  normalizedProductId: z.string().describe('The unique identifier for the product this insight refers to.'),
  productTitle: z.string().describe('The title of the product this insight refers to.'),
  summary: z.string().describe('A concise summary of insights for this specific product, comparing options across stores.'),
  bestDeal: z.object({
    store: z.string().describe('The store offering the best deal for this product.'),
    price: z.number().describe('The best price found for this product.'),
    discountPercentage: z.number().optional().describe('The discount percentage for the best deal.'),
    url: z.string().url().describe('URL to the product at the store with the best deal.'),
  }).optional().describe('Details about the best deal for this product, if identified.'),
  recommendation: z.string().optional().describe('A specific recommendation (e.g., "Buy now", "Wait for price drop", "Best value").'),
});

const AIShoppingInsightsOutputSchema = z.object({
  overallSummary: z.string().describe('A general summary of the search results and key findings across all products.'),
  insights: z.array(ProductInsightSchema).describe('An array of detailed insights for each unique product identified.'),
  generalTips: z.array(z.string()).optional().describe('General shopping tips or advice based on the search context.'),
});
export type AIShoppingInsightsOutput = z.infer<typeof AIShoppingInsightsOutputSchema>;

export async function aiShoppingInsights(input: AIShoppingInsightsInput): Promise<AIShoppingInsightsOutput> {
  return aiShoppingInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiShoppingInsightsPrompt',
  input: {schema: AIShoppingInsightsInputSchema},
  output: {schema: AIShoppingInsightsOutputSchema},
  prompt: `You are PriceNova, a futuristic AI shopping assistant. Your goal is to provide concise, AI-generated shopping insights and recommendations based on the provided product data. The user searched for "{{{searchQuery}}}" and here are the comparison results:

Product Data:
{{#each productData}}
- Store: {{{store}}}
  Product Title: {{{productTitle}}}
  Current Price: ₹{{{currentPrice}}}
  {{#if originalPrice}}Original Price: ₹{{{originalPrice}}}{{/if}}
  {{#if discountPercentage}}Discount: {{discountPercentage}}%{{/if}}
  {{#if productRating}}Rating: {{productRating}} ({{reviewsCount}} reviews){{/if}}
  Seller: {{{sellerName}}}
  Delivery: {{{deliveryInformation}}}
  Stock: {{{stockStatus}}}
  URL: {{{productUrl}}}
  {{#if normalizedProductId}}Normalized Product ID: {{{normalizedProductId}}}{{/if}}
{{/each}}

Analyze the provided product data.
1.  **Identify unique products**: Group similar products (using 'normalizedProductId' if available, otherwise inferring from title similarity).
2.  **Compare prices and discounts**: For each unique product, identify the best deal across all stores.
3.  **Generate a concise overall summary**: Provide a brief overview of the findings, highlighting general trends or notable deals.
4.  **Provide detailed insights for each unique product**:
    *   Summarize the comparison for that specific product.
    *   Clearly state the best deal (store, price, discount, URL).
    *   Offer a recommendation (e.g., "Buy now", "Best value", "Wait for sales").
5.  **Include general shopping tips**: Provide one or two general pieces of advice relevant to the search.

Focus on clear, actionable recommendations. Do not make up product IDs if 'normalizedProductId' is not provided. If 'normalizedProductId' is not provided, use the most common product title as the unique identifier for the insight. If multiple distinct products are returned, provide insights for each. If only one product is found across all stores, still provide insights.`
});

const aiShoppingInsightsFlow = ai.defineFlow(
  {
    name: 'aiShoppingInsightsFlow',
    inputSchema: AIShoppingInsightsInputSchema,
    outputSchema: AIShoppingInsightsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);