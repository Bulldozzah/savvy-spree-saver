import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MapPin, TrendingUp, DollarSign, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RegionalPrice {
  location: string;
  hq_name: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  product_count: number;
}

export const RegionalAnalyticsDashboard = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [regionalData, setRegionalData] = useState<RegionalPrice[]>([]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (selectedProduct) {
      loadRegionalPrices();
    }
  }, [selectedProduct]);

  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setProducts([]);
      return;
    }

    const { data } = await supabase
      .from("products")
      .select("*")
      .or(`description.ilike.%${query}%,gtin.ilike.%${query}%`)
      .limit(50);
    
    if (data) setProducts(data);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadRegionalPrices = async () => {
    const { data, error } = await supabase
      .from("store_prices")
      .select(`
        price,
        stores(
          location,
          city,
          hq_id,
          store_hq(name)
        )
      `)
      .eq("product_gtin", selectedProduct);

    if (data) {
      // Group by location
      const locationMap = new Map<string, number[]>();
      const hqMap = new Map<string, string>();

      data.forEach(item => {
        const store = item.stores as any;
        const location = store?.location || "Unknown";
        const hqName = store?.store_hq?.name || "Unknown";
        const price = Number(item.price);

        if (!locationMap.has(location)) {
          locationMap.set(location, []);
          hqMap.set(location, hqName);
        }
        locationMap.get(location)!.push(price);
      });

      // Calculate stats per location
      const regional: RegionalPrice[] = Array.from(locationMap.entries()).map(([location, prices]) => {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        return {
          location,
          hq_name: hqMap.get(location) || "Unknown",
          avg_price: avg,
          min_price: Math.min(...prices),
          max_price: Math.max(...prices),
          product_count: prices.length
        };
      });

      regional.sort((a, b) => a.avg_price - b.avg_price);
      setRegionalData(regional);
    }
  };

  const cheapestRegion = regionalData[0];
  const expensiveRegion = regionalData[regionalData.length - 1];
  const avgPrice = regionalData.length > 0 
    ? regionalData.reduce((sum, r) => sum + r.avg_price, 0) / regionalData.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex-1">
        <label className="text-sm font-medium mb-2 block">Select Product for Regional Analysis</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedProduct && selectedProductName
                ? selectedProductName
                : "Search by product name or barcode..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-0">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Type product name or barcode..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {searchQuery.length < 2 
                    ? "Type at least 2 characters to search..." 
                    : "No product found."}
                </CommandEmpty>
                <CommandGroup>
                  {products.map((product) => (
                    <CommandItem
                      key={product.gtin}
                      value={product.gtin}
                      onSelect={() => {
                        setSelectedProduct(product.gtin);
                        setSelectedProductName(product.description);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedProduct === product.gtin ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{product.description}</span>
                        <span className="text-xs text-muted-foreground">{product.gtin}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {regionalData.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cheapest Region</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">K{cheapestRegion?.avg_price.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {cheapestRegion?.hq_name} - {cheapestRegion?.location}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Expensive Region</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">K{expensiveRegion?.avg_price.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {expensiveRegion?.hq_name} - {expensiveRegion?.location}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price Volatility</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  K{expensiveRegion && cheapestRegion ? (expensiveRegion.avg_price - cheapestRegion.avg_price).toFixed(2) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Regional price difference</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Regional Price Comparison</CardTitle>
              <CardDescription>Average prices across different store locations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={regionalData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="location" 
                    type="category" 
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as RegionalPrice;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.hq_name} - {data.location}</p>
                            <p className="text-sm">Avg: K{data.avg_price.toFixed(2)}</p>
                            <p className="text-sm">Range: K{data.min_price.toFixed(2)} - K{data.max_price.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="avg_price" fill="hsl(var(--primary))" name="Average Price" />
                  <Bar dataKey="min_price" fill="hsl(var(--chart-2))" name="Minimum Price" />
                  <Bar dataKey="max_price" fill="hsl(var(--chart-3))" name="Maximum Price" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Insights</CardTitle>
              <CardDescription>Key findings from regional price analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Best Value Location</p>
                  <p className="text-sm text-muted-foreground">
                    Consumers in {cheapestRegion?.location} ({cheapestRegion?.hq_name}) get the best prices, 
                    paying {expensiveRegion && cheapestRegion ? ((1 - cheapestRegion.avg_price / expensiveRegion.avg_price) * 100).toFixed(1) : 0}% 
                    less than the most expensive region
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">Market Average</p>
                  <p className="text-sm text-muted-foreground">
                    The average price across all regions is K{avgPrice.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium">Price Spread</p>
                  <p className="text-sm text-muted-foreground">
                    Analyzing {regionalData.length} different store locations for regional price patterns
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
