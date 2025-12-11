import { Button } from "@/components/ui/neon-button";
import { Smartphone, Download } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary/95 to-primary/90">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm">
            <Smartphone className="h-4 w-4" />
            Available Soon on iOS & Android
          </div>
          
          <h2 className="mb-6 text-4xl font-extrabold text-primary-foreground md:text-6xl">
            Ready to Start Saving?
          </h2>
          
          <p className="mb-8 text-xl text-primary-foreground/90">
            Join thousands of smart shoppers who are already saving money on every purchase.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button 
              variant="solid"
              size="lg" 
              className="w-full sm:w-auto shadow-xl gap-2"
            >
              <Download className="h-5 w-5" />
              Get Early Access
            </Button>
            <Button 
              size="lg" 
              variant="ghost"
              className="w-full sm:w-auto text-primary-foreground"
            >
              Learn More
            </Button>
          </div>
          
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-primary-foreground/80">
            <div className="text-center">
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-sm">Price Updates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">$500K+</div>
              <div className="text-sm">Total Saved</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
