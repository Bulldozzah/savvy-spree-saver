import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceTrackingDashboard } from "./PriceTrackingDashboard";
import { DemandInsightsDashboard } from "./DemandInsightsDashboard";
import { RegionalAnalyticsDashboard } from "./RegionalAnalyticsDashboard";
import { CompetitorIntelligenceDashboard } from "./CompetitorIntelligenceDashboard";
import { BarChart3, TrendingUp, Map, Package, Target } from "lucide-react";

export const AnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
        <p className="text-muted-foreground">
          B2B Data Sales Dashboard - Comprehensive market intelligence for brands
        </p>
      </div>

      <Tabs defaultValue="price-tracking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
          <TabsTrigger value="price-tracking" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Price Tracking
          </TabsTrigger>
          <TabsTrigger value="demand" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Demand Insights
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Regional Analysis
          </TabsTrigger>
          <TabsTrigger value="competitor" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Competitor Intel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="price-tracking" className="space-y-4">
          <PriceTrackingDashboard />
        </TabsContent>

        <TabsContent value="demand" className="space-y-4">
          <DemandInsightsDashboard />
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <RegionalAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="competitor" className="space-y-4">
          <CompetitorIntelligenceDashboard />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Additional analytics features in development</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <Package className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Promotion Performance Reports</p>
              <p className="text-sm text-muted-foreground">
                Track effectiveness of promotions, price drops impact, and conversion metrics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
