import { HeroWithMockup } from "@/components/ui/hero-with-mockup";
import { Button } from "@/components/ui/neon-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingCart, 
  TrendingDown, 
  ListChecks, 
  Store, 
  Smartphone,
  Clock,
  DollarSign,
  CheckCircle2,
  Github
} from "lucide-react";
import { Link } from "react-router-dom";

const ShopperLanding = () => {
  const features = [
    {
      icon: <ListChecks className="h-8 w-8 text-primary" />,
      title: "Smart Shopping Lists",
      description: "Create and manage multiple shopping lists with ease. Add products, set quantities, and organize your shopping."
    },
    {
      icon: <TrendingDown className="h-8 w-8 text-primary" />,
      title: "Compare Prices",
      description: "Compare prices across multiple stores instantly. Find the best deals and save money on every purchase."
    },
    {
      icon: <Store className="h-8 w-8 text-primary" />,
      title: "Find Stores",
      description: "Discover stores near you with real-time pricing and product availability information."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: "Mobile Friendly",
      description: "Access your lists anywhere, anytime. Optimized for mobile shopping on the go."
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Save Time",
      description: "Plan your shopping trips efficiently. Know what's available and where before you go."
    },
    {
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      title: "Save Money",
      description: "Never overpay again. Get instant price comparisons and find the best deals automatically."
    }
  ];

  const benefits = [
    "Create unlimited shopping lists",
    "Compare prices across stores",
    "Real-time stock availability",
    "Share lists with stores",
    "Track your savings",
    "Get personalized recommendations"
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #ede8ea, #dbe2f2)' }}>
      {/* Hero Section */}
      <HeroWithMockup
        title="Shop Smarter, Save More"
        description="Compare prices across stores, create smart shopping lists, and never overpay again. Your ultimate shopping companion."
        primaryCta={{
          text: "Start Shopping Smart",
          href: "/auth",
        }}
        secondaryCta={{
          text: "View Demo",
          href: "/shopper",
          icon: <ShoppingCart className="mr-2 h-4 w-4" />,
        }}
        mockupImage={{
          alt: "Wise Up Shop - Shopping Dashboard",
          width: 1248,
          height: 765,
          src: "https://images.unsplash.com/photo-1557821552-17105176677c?w=1248&h=765&fit=crop&q=80"
        }}
      />

      {/* Features Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-brand to-secondary bg-clip-text text-transparent">
              Everything You Need to Shop Smart
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make your shopping experience seamless and cost-effective
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover-scale animate-fade-in border-[3px] border-border hover:border-primary hover:shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.4)] transition-all duration-300 bg-card/50 backdrop-blur-sm"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors border-2 border-primary/20">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Shoppers Love Wise Up Shop
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of smart shoppers who are saving time and money every day
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-4">
                <Link to="/auth">
                  <Button variant="solid" size="lg">Get Started Free</Button>
                </Link>
                <Link to="/shopper">
                  <Button variant="outline" size="lg">Try Demo</Button>
                </Link>
              </div>
            </div>

            <div className="animate-scale-in">
              <Card className="p-8 border-[3px] border-primary/30 bg-gradient-to-br from-primary/10 to-transparent shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.3)]">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                      <TrendingDown className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">30%</p>
                      <p className="text-muted-foreground">Average Savings</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">2 Hours</p>
                      <p className="text-muted-foreground">Time Saved Weekly</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                      <Store className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">50+</p>
                      <p className="text-muted-foreground">Partner Stores</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-brand/5 to-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.15)_0%,_transparent_50%)]" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-brand to-secondary bg-clip-text text-transparent">
              Ready to Transform Your Shopping?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of smart shoppers and start saving today
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/auth">
                <Button variant="solid" size="lg" className="text-lg px-8">Create Free Account</Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" size="lg" className="text-lg px-8">Learn More</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ShopperLanding;
