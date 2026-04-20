import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ShoppingCart, TrendingUp, Search, BarChart3 } from "lucide-react";

interface ProductDemand {
  product_gtin: string;
  description: string;
  count: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const DemandInsightsDashboard = () => {
  const [topProducts, setTopProducts] = useState<ProductDemand[]>([]);
  const [totalLists, setTotalLists] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [avgItemsPerList, setAvgItemsPerList] = useState(0);

  useEffect(() => {
    loadDemandData();
  }, []);

  const loadDemandData = async () => {
    // Get most added to shopping lists
    const { data: items, error } = await supabase
      .from("shopping_list_items")
      .select(`
        product_gtin,
        quantity,
        products(description)
      `);

    if (items) {
      // Count occurrences of each product
      const productCounts = new Map<string, { description: string; count: number }>();
      
      items.forEach(item => {
        const gtin = item.product_gtin;
        const description = (item.products as any)?.description || "Unknown Product";
        
        if (productCounts.has(gtin)) {
          productCounts.get(gtin)!.count++;
        } else {
          productCounts.set(gtin, { description, count: 1 });
        }
      });

      // Convert to array and sort by count
      const sorted = Array.from(productCounts.entries())
        .map(([gtin, data]) => ({
          product_gtin: gtin,
          description: data.description,
          count: data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setTopProducts(sorted);
      setTotalItems(items.length);
    }

    // Get shopping list stats
    const { data: lists } = await supabase
      .from("shopping_lists")
      .select("id");

    if (lists) {
      setTotalLists(lists.length);
      setAvgItemsPerList(lists.length > 0 ? totalItems / lists.length : 0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shopping Lists</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLists}</div>
            <p className="text-xs text-muted-foreground">Created by users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items Added</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Across all lists</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Items Per List</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgItemsPerList.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Average basket size</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Most Added Products</CardTitle>
          <CardDescription>Products most frequently added to shopping lists</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="description" 
                type="category" 
                width={200}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" name="Times Added" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Demand Distribution</CardTitle>
            <CardDescription>Top 5 products by demand share</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProducts.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ description, percent }) => `${description.slice(0, 15)}... ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {topProducts.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insights Summary</CardTitle>
            <CardDescription>Key takeaways from demand data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.length > 0 && (
              <>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Top Product</p>
                    <p className="text-sm text-muted-foreground">
                      "{topProducts[0].description}" is the most added item with {topProducts[0].count} additions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShoppingCart className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Shopping Behavior</p>
                    <p className="text-sm text-muted-foreground">
                      Users typically add {avgItemsPerList.toFixed(0)} items to their shopping lists
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Market Activity</p>
                    <p className="text-sm text-muted-foreground">
                      {totalLists} active shopping lists indicate strong user engagement
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
