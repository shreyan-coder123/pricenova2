# **App Name**: PriceNova

## Core Features:

- Real-Time Product Scraping: Utilize Next.js API routes and Playwright to concurrently fetch live product titles, prices, discounts, images, ratings, seller info, and delivery details from Amazon India, Flipkart, Myntra, Ajio, Nykaa, Meesho, and Croma.
- AI Product Matching Engine: An AI tool designed to detect duplicate products, normalize disparate product names, match similar items across e-commerce platforms, and compare specifications to identify the best deals.
- AI Shopping Insights & Recommendations: A generative AI tool that analyzes product data to provide intelligent shopping insights, such as price trend predictions, best value-for-money options, and smart purchase recommendations, leveraging the OpenAI API.
- Dynamic Comparison Interface: A responsive and futuristic user interface featuring floating cards and glassmorphism effects, presenting live, normalized, and AI-compared product data in an intuitive and visually engaging format.
- Free & Pro Tier Management: A browser-based system that uses localStorage and cookies to track user searches, enforce limits for the free tier (10 searches), and display upgrade prompts with blurred content after the limit is reached, without requiring authentication.
- Secure Client-Side Pro Access: Integration with Razorpay for handling payments and managing temporary Pro user status via browser localStorage and encrypted tokens, ensuring an account-less premium experience.
- Performance Optimization & In-Memory Caching: Implementation of in-memory caching for API responses, request deduplication, headless browser pooling, image blocking during scraping, and lazy loading for enhanced performance without a persistent database.

## Style Guidelines:

- The design evokes a premium and futuristic feel through a predominantly dark aesthetic. The primary accent is a vibrant electric blue (HEX: #78B0FF), chosen to represent advanced technology and a cutting-edge interface. The background is a very dark, subtly cool-toned grey (HEX: #16181C), providing depth and making brighter elements pop. A complementary accent hue, a vivid violet (HEX: #B78EFF), will be used to highlight interactive elements and generate 'neon gradient' effects.
- For all text elements, the proportional sans-serif font 'Space Grotesk' is recommended. Its computerized and techy aesthetic perfectly aligns with the futuristic, AI-powered nature of the application, serving both headlines and shorter body text effectively.
- Utilize sleek, minimalist, and outline-based icons to maintain a clean, modern, and high-tech visual identity. Icons should feature subtle neon glows or gradient effects when interactive, complementing the overall futuristic design language.
- The layout will emphasize a 'futuristic dark UI' with distinct 'floating cards' and 'glassmorphism' effects to create visual separation and depth. Content sections will be well-defined, leveraging spacing and subtle background gradients to achieve a premium SaaS look. Loading skeletons will ensure a smooth user experience during data fetching.
- Implement 'smooth animations' using Framer Motion for page transitions, interactive elements, and loading states. Animations should be fluid and subtle, enhancing the 'futuristic' feel without distracting the user, focusing on glows, fades, and scale transformations to highlight elements.