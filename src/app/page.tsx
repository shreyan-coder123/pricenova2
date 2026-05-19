
import { Navbar } from '@/components/Navbar';
import { SearchHero } from '@/components/SearchHero';
import { PricingSection } from '@/components/PricingSection';
import { Cpu, Shield, Zap, LayoutGrid } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        <SearchHero />
        
        <section id="features" className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Cpu className="w-8 h-8 text-primary" />}
              title="AI Matching Engine"
              description="Automatically detects duplicate products across stores using neural semantic analysis."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-secondary" />}
              title="Real-Time Scraping"
              description="Parallel Playwright scrapers fetch LIVE prices, ratings, and stock status in seconds."
            />
            <FeatureCard 
              icon={<LayoutGrid className="w-8 h-8 text-primary" />}
              title="7 Major Platforms"
              description="Amazon, Flipkart, Myntra, Ajio, Nykaa, Meesho, and Croma—all in one place."
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-secondary" />}
              title="No DB, No Tracking"
              description="Privacy-first architecture. Your data never leaves your browser."
            />
          </div>
        </section>

        <PricingSection />
      </main>

      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            <span className="font-bold tracking-tighter gradient-text">PRICENOVA</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 PriceNova. AI-Powered Shopping Excellence. Built for the Future.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-white/10 transition-all duration-300">
      <div className="mb-4 transform group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold mb-2 font-headline">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
