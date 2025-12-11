import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { AdBannerManager } from "@/components/AdBannerManager";
import { AdPromotionManager } from "@/components/AdPromotionManager";
import { AdGeneralManager } from "@/components/AdGeneralManager";
import { Megaphone } from "lucide-react";

export function AdsView() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Megaphone className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Advertisement Management</h2>
        </div>
        
        <Tabs defaultValue="banners" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="banners">Banner Ads</TabsTrigger>
            <TabsTrigger value="promotions">Promotional Items</TabsTrigger>
            <TabsTrigger value="general">General Ads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="banners" className="mt-6">
            <AdBannerManager />
          </TabsContent>
          
          <TabsContent value="promotions" className="mt-6">
            <AdPromotionManager />
          </TabsContent>
          
          <TabsContent value="general" className="mt-6">
            <AdGeneralManager />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
