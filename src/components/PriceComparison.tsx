import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, TrendingDown } from "lucide-react";

const samplePrices = [
  {
    store: "FreshMart Downtown",
    price: 2.99,
    distance: "0.5 km",
    savings: 15,
    rating: 4.8,
    isLowest: true
  },
  {
    store: "QuickStop Plaza",
    price: 3.29,
    distance: "1.2 km",
    savings: 6,
    rating: 4.5,
    isLowest: false
  },
  {
    store: "MegaStore West",
    price: 3.49,
    distance: "2.1 km",
    savings: 0,
    rating: 4.2,
    isLowest: false
  }
];

const PriceComparison = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-extrabold text-foreground md:text-5xl">
              Real-Time Price Comparison
            </h2>
            <p className="text-lg text-muted-foreground">
              See instant price differences across stores in your area
            </p>
          </div>
          
          <Card className="mb-6 border-none shadow-[var(--shadow-card)]">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-2xl">🥛</span>
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-xl font-bold text-foreground">
                    Organic Whole Milk
                  </h3>
                  <p className="text-sm text-muted-foreground">1 Gallon • Brand: FreshDairy</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      Save up to $0.50
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            {samplePrices.map((item, index) => (
              <Card
                key={index}
                className={`border-none shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-soft)] ${
                  item.isLowest ? 'ring-2 ring-secondary' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-foreground">{item.store}</h4>
                          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {item.distance}
                          </div>
                        </div>
                        {item.isLowest && (
                          <Badge className="bg-secondary text-secondary-foreground">
                            Best Price
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-foreground">
                        ${item.price}
                      </div>
                      {item.savings > 0 && (
                        <div className="text-sm font-medium text-secondary">
                          Save {item.savings}%
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceComparison;
