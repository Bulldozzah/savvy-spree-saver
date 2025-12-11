import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Store, TrendingDown, TrendingUp, Award, DollarSign } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface StoreOption {
  id: string;
  name: string;
  location: string;
}

interface BrandRanking {
  brand: string;
  avg_price: number;
  product_count: number;
  market_share: number;
}

interface StorePriceComparison {
  store_name: string;
  store_location: string;
  avg_price: number;
  total_products: number;
}

interface PriceUndercutting {
  product: string;
  cheapest_store: string;
  cheapest_price: number;
  expensive_store: string;
  expensive_price: number;
  price_diff: number;
  percentage_diff: number;
}

export const CompetitorIntelligenceDashboard = () => {
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [brandRankings, setBrandRankings] = useState<BrandRanking[]>([]);
  const [storeComparison, setStoreComparison] = useState<StorePriceComparison[]>([]);
  const [undercuttingPatterns, setUndercuttingPatterns] = useState<PriceUndercutting[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    const { data } = await supabase
      .from("stores")
      .select(`
        id,
        location,
        store_hq(name)
      `);

    if (data) {
      const storeOptions = data.map(store => ({
        id: store.id,
        name: (store.store_hq as any)?.name || "Unknown",
        location: store.location
      }));
      setStores(storeOptions);
    }
  };

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const runAnalysis = async () => {
    if (selectedStores.length < 2) {
      return;
    }

    setLoading(true);

    // Load brand rankings
    const { data: priceData } = await supabase
      .from("store_prices")
      .select(`
        price,
        store_id,
        products(description),
        stores(store_hq(name))
      `)
      .in("store_id", selectedStores);

    if (priceData) {
      // Calculate brand rankings
      const brandMap = new Map<string, { total_price: number; count: number }>();
      
      priceData.forEach(item => {
        const brand = (item.stores as any)?.store_hq?.name || "Unknown";
        const price = Number(item.price);
        
        if (!brandMap.has(brand)) {
          brandMap.set(brand, { total_price: 0, count: 0 });
        }
        const current = brandMap.get(brand)!;
        current.total_price += price;
        current.count += 1;
      });

      const totalProducts = priceData.length;
      const rankings: BrandRanking[] = Array.from(brandMap.entries()).map(([brand, data]) => ({
        brand,
        avg_price: data.total_price / data.count,
        product_count: data.count,
        market_share: (data.count / totalProducts) * 100
      }));

      rankings.sort((a, b) => a.avg_price - b.avg_price);
      setBrandRankings(rankings);

      // Calculate store-level comparison
      const storeMap = new Map<string, { total_price: number; count: number; name: string; location: string }>();
      
      priceData.forEach(item => {
        const storeId = item.store_id;
        const store = stores.find(s => s.id === storeId);
        if (!store) return;
        
        const price = Number(item.price);
        
        if (!storeMap.has(storeId)) {
          storeMap.set(storeId, { 
            total_price: 0, 
            count: 0,
            name: store.name,
            location: store.location
          });
        }
        const current = storeMap.get(storeId)!;
        current.total_price += price;
        current.count += 1;
      });

      const comparison: StorePriceComparison[] = Array.from(storeMap.entries()).map(([_, data]) => ({
        store_name: data.name,
        store_location: data.location,
        avg_price: data.total_price / data.count,
        total_products: data.count
      }));

      comparison.sort((a, b) => a.avg_price - b.avg_price);
      setStoreComparison(comparison);

      // Find undercutting patterns (top 10 products with biggest price differences)
      const productPriceMap = new Map<string, Array<{ store: string; location: string; price: number }>>();
      
      priceData.forEach(item => {
        const product = (item.products as any)?.description || "Unknown";
        const store = stores.find(s => s.id === item.store_id);
        if (!store) return;
        
        const price = Number(item.price);
        
        if (!productPriceMap.has(product)) {
          productPriceMap.set(product, []);
        }
        productPriceMap.get(product)!.push({
          store: `${store.name} - ${store.location}`,
          location: store.location,
          price
        });
      });

      const undercutting: PriceUndercutting[] = [];
      productPriceMap.forEach((prices, product) => {
        if (prices.length < 2) return;
        
        prices.sort((a, b) => a.price - b.price);
        const cheapest = prices[0];
        const expensive = prices[prices.length - 1];
        const diff = expensive.price - cheapest.price;
        
        undercutting.push({
          product,
          cheapest_store: cheapest.store,
          cheapest_price: cheapest.price,
          expensive_store: expensive.store,
          expensive_price: expensive.price,
          price_diff: diff,
          percentage_diff: (diff / expensive.price) * 100
        });
      });

      undercutting.sort((a, b) => b.percentage_diff - a.percentage_diff);
      setUndercuttingPatterns(undercutting.slice(0, 10));
    }

    setLoading(false);
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Stores to Compare</CardTitle>
          <CardDescription>Choose at least 2 stores to analyze competitor intelligence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {stores.map(store => (
                <div key={store.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                  <Checkbox
                    id={store.id}
                    checked={selectedStores.includes(store.id)}
                    onCheckedChange={() => toggleStore(store.id)}
                  />
                  <label htmlFor={store.id} className="text-sm cursor-pointer flex-1">
                    {store.name} - {store.location}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedStores.length} store(s) selected
              </p>
              <Button 
                onClick={runAnalysis} 
                disabled={selectedStores.length < 2 || loading}
              >
                {loading ? "Analyzing..." : "Run Analysis"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {storeComparison.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cheapest Store</CardTitle>
                <TrendingDown className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">K{storeComparison[0]?.avg_price.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {storeComparison[0]?.store_name} - {storeComparison[0]?.store_location}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Expensive Store</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  K{storeComparison[storeComparison.length - 1]?.avg_price.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {storeComparison[storeComparison.length - 1]?.store_name} - {storeComparison[storeComparison.length - 1]?.store_location}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price Difference</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  K{(storeComparison[storeComparison.length - 1]?.avg_price - storeComparison[0]?.avg_price).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((1 - storeComparison[0]?.avg_price / storeComparison[storeComparison.length - 1]?.avg_price) * 100).toFixed(1)}% cheaper at best store
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Store Price Comparison</CardTitle>
                <CardDescription>Average prices across selected stores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={storeComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="store_name" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as StorePriceComparison;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.store_name} - {data.store_location}</p>
                              <p className="text-sm">Avg Price: K{data.avg_price.toFixed(2)}</p>
                              <p className="text-sm">Products: {data.total_products}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="avg_price" fill="hsl(var(--primary))" name="Average Price" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Brand Market Share</CardTitle>
                <CardDescription>Distribution of products by brand</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={brandRankings}
                      dataKey="market_share"
                      nameKey="brand"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ brand, market_share }) => `${brand}: ${market_share.toFixed(1)}%`}
                    >
                      {brandRankings.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Brand Rankings by Average Price</CardTitle>
              <CardDescription>Which brands offer the best value</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={brandRankings} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="brand" type="category" width={100} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as BrandRanking;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.brand}</p>
                            <p className="text-sm">Avg Price: K{data.avg_price.toFixed(2)}</p>
                            <p className="text-sm">Products: {data.product_count}</p>
                            <p className="text-sm">Market Share: {data.market_share.toFixed(1)}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="avg_price" fill="hsl(var(--chart-2))" name="Average Price" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Price Undercutting Patterns</CardTitle>
              <CardDescription>Top 10 products with the biggest price differences between stores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {undercuttingPatterns.map((pattern, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{pattern.product}</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="font-medium text-green-600">Cheapest</p>
                              <p className="text-muted-foreground">{pattern.cheapest_store}</p>
                              <p className="font-bold">K{pattern.cheapest_price.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-red-500" />
                            <div>
                              <p className="font-medium text-red-600">Most Expensive</p>
                              <p className="text-muted-foreground">{pattern.expensive_store}</p>
                              <p className="font-bold">K{pattern.expensive_price.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-primary">{pattern.percentage_diff.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">K{pattern.price_diff.toFixed(2)} difference</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
