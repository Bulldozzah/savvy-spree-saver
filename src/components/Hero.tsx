import { Button } from "@/components/ui/neon-button";
import { ShoppingCart, TrendingDown, Users } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20 pb-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            <Users className="h-4 w-4" />
            Join 10,000+ Smart Shoppers
          </div>
          
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-7xl">
            Shop Smarter,{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Save More
            </span>
          </h1>
          
          <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
            Compare prices from real shoppers, build optimized shopping lists, and save up to 20% on every purchase.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button variant="solid" size="lg" className="w-full sm:w-auto shadow-lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Start Saving Now
            </Button>
            <Button size="lg" className="w-full sm:w-auto">
              See How It Works
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)] transition-transform hover:scale-105">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <TrendingDown className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">20%</h3>
              <p className="text-sm text-muted-foreground">Average Savings</p>
            </div>
            
            <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)] transition-transform hover:scale-105">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">50K+</h3>
              <p className="text-sm text-muted-foreground">Active Contributors</p>
            </div>
            
            <div className="rounded-2xl bg-card p-6 shadow-[var(--shadow-card)] transition-transform hover:scale-105">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <ShoppingCart className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">1M+</h3>
              <p className="text-sm text-muted-foreground">Price Updates Daily</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
