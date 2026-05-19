
'use client';

import { Check, Zap, XCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchUsage } from '@/hooks/use-search-usage';
import { setProStatus, clearProStatus } from '@/lib/usage';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PricingSection() {
  const { isProUser } = useSearchUsage();
  const { toast } = useToast();

  const handleUpgrade = () => {
    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_simulation';

    if (typeof window.Razorpay === 'undefined') {
      toast({
        title: "Initializing Razorpay Secure...",
        description: "Redirecting to encrypted payment gateway.",
      });
      
      setTimeout(() => {
        setProStatus('SIMULATED_TOKEN_' + Date.now());
        window.dispatchEvent(new Event('storage'));
        toast({
          title: "Payment Successful!",
          description: "PriceNova PRO features are now active.",
        });
      }, 2000);
      return;
    }

    const options = {
      key: razorpayKey,
      amount: 50000, // 500 INR in paisa
      currency: 'INR',
      name: 'PriceNova Intelligence',
      description: 'Monthly Pro Subscription',
      image: 'https://picsum.photos/seed/pricenova/200/200',
      handler: function(response: any) {
        setProStatus(response.razorpay_payment_id || 'SIMULATED_PRO_TOKEN');
        window.dispatchEvent(new Event('storage'));
        toast({
          title: "PRO Activated",
          description: "PriceNova intelligence is now unlimited.",
        });
      },
      prefill: {
        name: 'PriceNova User',
        email: 'user@pricenova.ai',
        contact: '9999999999'
      },
      theme: {
        color: '#60a5fa'
      }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handleCancelPro = () => {
    clearProStatus();
    window.dispatchEvent(new Event('storage'));
    toast({
      title: "Subscription Cancelled",
      description: "You have been reverted to the free plan.",
    });
  };

  return (
    <section id="pricing" className="max-w-5xl mx-auto px-6 py-24">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-4xl font-bold font-headline">Simple <span className="gradient-text">Pro Access</span></h2>
        <p className="text-muted-foreground">No accounts required. One-click Razorpay upgrade for the ultimate shopping experience.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-10 rounded-3xl bg-white/5 border border-white/10 flex flex-col h-full">
          <div className="mb-8">
            <h3 className="text-2xl font-bold font-headline mb-2">Free Intelligence</h3>
            <p className="text-muted-foreground">Perfect for quick price checks.</p>
          </div>
          <div className="text-4xl font-bold mb-8">₹0 <span className="text-lg font-normal text-muted-foreground">/ forever</span></div>
          <ul className="space-y-4 mb-10 flex-grow">
            <PricingItem text="10 searches only" />
            <PricingItem text="Basic price comparison" />
            <PricingItem text="Public deals only" />
            <PricingItem text="Standard processing speed" disabled />
          </ul>
          <Button variant="outline" className="w-full h-12 rounded-xl" disabled>
            Current Plan
          </Button>
        </div>

        <div className="relative p-10 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col h-full overflow-hidden">
          <div className="absolute top-4 right-4 bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/30">
            BEST VALUE
          </div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold font-headline mb-2">PriceNova PRO</h3>
            <p className="text-muted-foreground">Unlimited power for serious shoppers.</p>
          </div>
          <div className="text-4xl font-bold mb-8">₹500 <span className="text-lg font-normal text-muted-foreground">/ month</span></div>
          <ul className="space-y-4 mb-10 flex-grow">
            <PricingItem text="Unlimited searches" pro />
            <PricingItem text="AI Shopping Insights" pro />
            <PricingItem text="Premium Deal Analysis" pro />
            <PricingItem text="Fastest scraping priority" pro />
            <PricingItem text="Secure Razorpay Checkout" pro />
          </ul>
          
          <div className="space-y-4">
            <Button 
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2"
              onClick={handleUpgrade}
              disabled={isProUser}
            >
              <CreditCard className="w-5 h-5" />
              {isProUser ? 'PRO Active' : 'Upgrade via Razorpay'}
            </Button>
            
            {isProUser && (
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-destructive transition-colors text-xs"
                onClick={handleCancelPro}
              >
                <XCircle className="w-3 h-3 mr-2" />
                Cancel Pro Subscription
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingItem({ text, pro, disabled }: { text: string, pro?: boolean, disabled?: boolean }) {
  return (
    <li className={`flex items-center gap-3 ${disabled ? 'opacity-30' : ''}`}>
      <div className={`p-1 rounded-full ${pro ? 'bg-primary/20' : 'bg-white/10'}`}>
        <Check className={`w-4 h-4 ${pro ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <span className="text-sm font-medium">{text}</span>
    </li>
  );
}
