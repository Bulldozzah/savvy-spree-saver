import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Activity, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PriceStats {
  product_gtin: string;
  description: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  store_count: number;
  price_range: number;
}

interface PriceTrend {
  date: string;
  avg_price: number;
  min_price: number;
  max_price: number;
}

export const PriceTrackingDashboard = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [priceTrends, setPriceTrends] = useState<PriceTrend[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (selectedProduct) {
      loadPriceStats();
      loadPriceTrends();
    }
  }, [selectedProduct, timeRange]);

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

  const loadPriceStats = async () => {
    const { data, error } = await supabase
      .from("store_prices")
      .select("price, stores(location, hq_id, store_hq(name))")
      .eq("product_gtin", selectedProduct);

    if (data && data.length > 0) {
      const prices = data.map(d => d.price);
      const avgPrice = prices.reduce((a, b) => Number(a) + Number(b), 0) / prices.length;
      const minPrice = Math.min(...prices.map(Number));
      const maxPrice = Math.max(...prices.map(Number));

      const product = products.find(p => p.gtin === selectedProduct);

      setPriceStats({
        product_gtin: selectedProduct,
        description: product?.description || "",
        avg_price: avgPrice,
        min_price: minPrice,
        max_price: maxPrice,
        store_count: data.length,
        price_range: maxPrice - minPrice
      });
    }
  };

  const loadPriceTrends = async () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Mock data for trends - in production, you'd track historical prices
    const mockTrends: PriceTrend[] = [];
    for (let i = 0; i < days; i += Math.ceil(days / 10)) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      mockTrends.push({
        date: date.toISOString().split('T')[0],
        avg_price: priceStats ? priceStats.avg_price * (0.95 + Math.random() * 0.1) : 0,
        min_price: priceStats ? priceStats.min_price * (0.95 + Math.random() * 0.1) : 0,
        max_price: priceStats ? priceStats.max_price * (0.95 + Math.random() * 0.1) : 0,
      });
    }
    setPriceTrends(mockTrends);
  };

  const priceChange = priceTrends.length > 1 
    ? ((priceTrends[priceTrends.length - 1].avg_price - priceTrends[0].avg_price) / priceTrends[0].avg_price * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Select Product</label>
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
        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {priceStats && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">K{priceStats.avg_price.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Across {priceStats.store_count} stores</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price Range</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">K{priceStats.price_range.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  K{priceStats.min_price.toFixed(2)} - K{priceStats.max_price.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price Trend</CardTitle>
                {priceChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${priceChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">Over {timeRange}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Store Coverage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{priceStats.store_count}</div>
                <p className="text-xs text-muted-foreground">Stores stocking this item</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Price Trends</CardTitle>
              <CardDescription>Historical price movements across stores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avg_price" stroke="hsl(var(--primary))" name="Average Price" />
                  <Line type="monotone" dataKey="min_price" stroke="hsl(var(--chart-2))" name="Minimum Price" />
                  <Line type="monotone" dataKey="max_price" stroke="hsl(var(--chart-3))" name="Maximum Price" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
