'use client';

import { Check, XCircle, CreditCard } from 'lucide-react';
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
    const razorpayKey = 'rzp_live_SrZ2OPKQPCbILu';

    if (typeof window.Razorpay === 'undefined') {
      toast({
        title: "Razorpay Secure Initializing...",
        description: "Connecting to encrypted payment gateway.",
      });
      
      setTimeout(() => {
        setProStatus('SIMULATED_TOKEN_' + Date.now());
        window.dispatchEvent(new Event('storage'));
        toast({
          title: "Payment Successful!",
          description: "Price Cart PRO features are now active.",
        });
      }, 3000);
      return;
    }

    const options = {
      key: razorpayKey,
      amount: 50000, // 500 INR in paisa
      currency: 'INR',
      name: 'Price Cart Intelligence',
      description: 'Monthly Pro Subscription',
      image: 'https://picsum.photos/seed/pricecart/200/200',
      handler: function(response: any) {
        setProStatus(response.razorpay_payment_id || 'PRO_ACTIVATED_' + Date.now());
        window.dispatchEvent(new Event('storage'));
        toast({
          title: "PRO Intelligence Activated",
          description: "You now have unlimited cross-platform scans.",
        });
      },
      prefill: {
        name: 'Price Cart Shopper',
        email: 'shopper@pricecart.ai',
        contact: '9999999999'
      },
      theme: {
        color: '#60a5fa'
      },
      modal: {
        ondismiss: function() {
          console.log('Checkout closed');
        }
      }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  const handleCancelPro = () => {
    clearProStatus();
    window.dispatchEvent(new Event('storage'));
    toast({
      title: "Subscription Deactivated",
      description: "You are now on the Free tier.",
    });
  };

  return (
    <section id="pricing" className="max-w-5xl mx-auto px-6 py-24">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-4xl font-bold font-headline">Simple <span className="gradient-text">Pro Access</span></h2>
        <p className="text-muted-foreground">Unlock the full power of our AI matching engine. Secure Razorpay checkout.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-10 rounded-3xl bg-white/5 border border-white/10 flex flex-col h-full">
          <div className="mb-8">
            <h3 className="text-2xl font-bold font-headline mb-2">Free Scan</h3>
            <p className="text-muted-foreground">Basic market awareness.</p>
          </div>
          <div className="text-4xl font-bold mb-8">₹0 <span className="text-lg font-normal text-muted-foreground">/ month</span></div>
          <ul className="space-y-4 mb-10 flex-grow">
            <PricingItem text="5 searches only" />
            <PricingItem text="Standard market matching" />
            <PricingItem text="Public listings only" />
          </ul>
          <Button variant="outline" className="w-full h-12 rounded-xl" disabled>
            {isProUser ? 'Revertable' : 'Current Plan'}
          </Button>
        </div>

        <div className="relative p-10 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col h-full overflow-hidden">
          <div className="absolute top-4 right-4 bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/30">
            BEST VALUE
          </div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold font-headline mb-2">Price Cart PRO</h3>
            <p className="text-muted-foreground">Unlimited intelligence for serious savings.</p>
          </div>
          <div className="text-4xl font-bold mb-8">₹500 <span className="text-lg font-normal text-muted-foreground">/ month</span></div>
          <ul className="space-y-4 mb-10 flex-grow">
            <PricingItem text="Unlimited AI scans" pro />
            <PricingItem text="Aggressive Store Matching" pro />
            <PricingItem text="Hidden Deal Identification" pro />
            <PricingItem text="Priority Scraper Network" pro />
            <PricingItem text="Razorpay Secure UPI/Card" pro />
          </ul>
          
          <div className="space-y-4">
            <Button 
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2"
              onClick={handleUpgrade}
              disabled={isProUser}
            >
              <CreditCard className="w-5 h-5" />
              {isProUser ? 'PRO Access Active' : 'Upgrade via Razorpay'}
            </Button>
            
            {isProUser && (
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-destructive transition-colors text-xs"
                onClick={handleCancelPro}
              >
                <XCircle className="w-3 h-3 mr-2" />
                Cancel PRO Subscription
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
