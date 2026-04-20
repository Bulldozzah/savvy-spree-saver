import { ListChecks, MapPin, Truck, ShieldCheck, Bell, Package } from "lucide-react";

const features = [
  {
    icon: ListChecks,
    title: "Create Shopping Lists",
    description: "Build your personalized shopping lists and manage your items all in one place.",
    color: "primary"
  },
  {
    icon: Package,
    title: "Product Catalog",
    description: "Browse our comprehensive product catalog with GTIN codes and detailed descriptions.",
    color: "secondary"
  },
  {
    icon: MapPin,
    title: "Compare Nearby Stores",
    description: "See real-time prices from stores in your area, all contributed by shoppers like you.",
    color: "accent"
  },
  {
    icon: Truck,
    title: "Delivery Integration",
    description: "Request local riders or taxis to pick up and deliver your optimized shopping list.",
    color: "primary"
  },
  {
    icon: ShieldCheck,
    title: "Community Trust",
    description: "Rate prices, earn badges, and build a reliable network of price information.",
    color: "secondary"
  },
  {
    icon: Bell,
    title: "Price Alerts",
    description: "Get notified when your favorite items drop in price or when better deals are available.",
    color: "accent"
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-extrabold text-foreground md:text-5xl">
            Everything You Need to Save
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Powered by community insights and smart technology to transform your shopping experience
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group rounded-2xl bg-card p-8 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-soft)] hover:-translate-y-1"
              >
                <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-${feature.color}/10 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-7 w-7 text-${feature.color}`} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
