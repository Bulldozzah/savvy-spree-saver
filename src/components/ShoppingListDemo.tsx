import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Plus } from "lucide-react";

const listItems = [
  { name: "Organic Milk", price: 2.99, store: "FreshMart" },
  { name: "Whole Wheat Bread", price: 3.49, store: "FreshMart" },
  { name: "Free-Range Eggs", price: 4.99, store: "QuickStop" },
  { name: "Fresh Tomatoes", price: 2.29, store: "FreshMart" },
  { name: "Olive Oil", price: 8.99, store: "QuickStop" }
];

const ShoppingListDemo = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-extrabold text-foreground md:text-5xl">
              Optimized Shopping Lists
            </h2>
            <p className="text-lg text-muted-foreground">
              Build your list and we'll calculate the best combination of stores for maximum savings
            </p>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-none shadow-[var(--shadow-card)]">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">Your Shopping List</h3>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {listItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.store}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">${item.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 rounded-lg bg-gradient-to-r from-secondary/10 to-secondary/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Total</span>
                    <span className="text-2xl font-bold text-foreground">$22.75</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none bg-gradient-to-br from-secondary/10 to-primary/5 shadow-[var(--shadow-card)]">
              <CardContent className="p-6">
                <div className="mb-4">
                  <Badge className="bg-secondary text-secondary-foreground">
                    Optimized Route
                  </Badge>
                </div>
                
                <h3 className="mb-6 text-xl font-bold text-foreground">
                  Best Shopping Strategy
                </h3>
                
                <div className="space-y-4">
                  <div className="rounded-lg bg-card p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-foreground">FreshMart Downtown</span>
                      <span className="text-sm text-muted-foreground">3 items</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">$8.77</div>
                    <div className="mt-1 text-sm text-muted-foreground">0.5 km away</div>
                  </div>
                  
                  <div className="rounded-lg bg-card p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-foreground">QuickStop Plaza</span>
                      <span className="text-sm text-muted-foreground">2 items</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">$13.98</div>
                    <div className="mt-1 text-sm text-muted-foreground">1.2 km away</div>
                  </div>
                  
                  <div className="rounded-lg bg-gradient-to-r from-secondary to-secondary/90 p-4 text-secondary-foreground">
                    <div className="mb-1 text-sm font-medium opacity-90">You'll Save</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">$4.80</span>
                      <span className="text-sm">(17% savings)</span>
                    </div>
                  </div>
                </div>
                
                <Button className="mt-6 w-full bg-primary hover:bg-primary/90" size="lg">
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShoppingListDemo;
