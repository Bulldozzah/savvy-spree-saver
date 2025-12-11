import { ListPlus, ShoppingCart, Search, Save } from "lucide-react";

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

const HowItWorks = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-extrabold text-foreground md:text-5xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Four simple steps to start saving on every shopping trip
          </p>
        </div>
        
        <div className="mx-auto max-w-5xl">
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
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
