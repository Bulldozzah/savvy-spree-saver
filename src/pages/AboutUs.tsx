import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingCart, ListPlus, Search, Save } from "lucide-react";

const steps = [
  {
    icon: ListPlus,
    title: "Create a List",
    description: "Start by creating your personalized shopping list with all the items you need.",
    step: "01"
  },
  {
    icon: ShoppingCart,
    title: "Add Shopping Items",
    description: "Add products to your list by scanning barcodes or searching our database.",
    step: "02"
  },
  {
    icon: Search,
    title: "Find & Check Prices",
    description: "Compare prices across all nearby stores to find the best deals for your items.",
    step: "03"
  },
  {
    icon: Save,
    title: "Save & Shop",
    description: "Save money with optimized shopping routes or request convenient delivery.",
    step: "04"
  }
];

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/">
            <h1 className="text-2xl font-bold">PriceCompare</h1>
          </Link>
          <div className="flex gap-4 items-center">
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost">About Us</Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost">Contact Us</Button>
            </Link>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-extrabold text-center mb-6 text-foreground">
            About PriceCompare
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-12">
            Empowering shoppers to save money through community-driven price comparison
          </p>

          <div className="prose prose-lg max-w-none mb-16">
            <p className="text-muted-foreground">
              PriceCompare is a revolutionary platform that brings together shoppers and stores in a transparent marketplace. 
              Our mission is to help you make informed purchasing decisions by providing real-time price comparisons across 
              multiple stores in your area.
            </p>
            <p className="text-muted-foreground mt-4">
              Built on the principle of community collaboration, our platform allows users to scan and share product prices, 
              creating a comprehensive database that benefits everyone. Whether you're planning your weekly grocery run or 
              looking for the best deal on a specific item, PriceCompare puts the power of information in your hands.
            </p>
          </div>

          {/* Video Placeholder */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
              See How It Works
            </h2>
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center shadow-lg">
              <p className="text-muted-foreground text-lg">Video Coming Soon</p>
            </div>
          </div>

          {/* How It Works Steps */}
          <section className="py-12">
            <h2 className="text-4xl font-extrabold text-center mb-12 text-foreground">
              How It Works
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="relative">
                    {index < steps.length - 1 && (
                      <div className="absolute top-12 left-1/2 hidden h-0.5 w-full bg-gradient-to-r from-primary/30 to-transparent lg:block" />
                    )}
                    <div className="relative flex flex-col items-center text-center">
                      <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-[var(--shadow-soft)]">
                        <Icon className="h-12 w-12 text-primary-foreground" />
                      </div>
                      <div className="mb-2 text-sm font-bold text-primary">
                        STEP {step.step}
                      </div>
                      <h3 className="mb-3 text-xl font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AboutUs;
