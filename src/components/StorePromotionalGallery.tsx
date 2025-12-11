import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconChevronRight, IconShoppingCart } from "@tabler/icons-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface PromotionalItem {
  id: string;
  image_url: string | null;
  promotional_price: number;
  product_gtin: string | null;
  products?: {
    description: string;
  };
}

interface StorePromotion {
  store_id: string;
  store_name: string;
  store_location: string;
  items: PromotionalItem[];
}

export const StorePromotionalGallery = () => {
  const [storePromotions, setStorePromotions] = useState<StorePromotion[]>([]);

  useEffect(() => {
    loadStorePromotions();
  }, []);

  const loadStorePromotions = async () => {
    const { data } = await supabase
      .from("ad_promotions")
      .select("*, stores(id, location, store_hq(name)), products(description)")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      // Group promotions by store
      const grouped = data.reduce((acc: { [key: string]: StorePromotion }, promo: any) => {
        const storeId = promo.stores?.id;
        if (!storeId) return acc;

        if (!acc[storeId]) {
          acc[storeId] = {
            store_id: storeId,
            store_name: promo.stores?.store_hq?.name || "Unknown Store",
            store_location: promo.stores?.location || "Unknown Location",
            items: [],
          };
        }

        acc[storeId].items.push({
          id: promo.id,
          image_url: promo.image_url,
          promotional_price: promo.promotional_price,
          product_gtin: promo.product_gtin,
          products: promo.products,
        });

        return acc;
      }, {});

      setStorePromotions(Object.values(grouped));
    }
  };

  const scrollGallery = (storeId: string, direction: "left" | "right") => {
    const container = document.getElementById(`gallery-${storeId}`);
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (storePromotions.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-8">
          <IconShoppingCart className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Store Promotions</h2>
        </div>

        <div className="space-y-8">
          {storePromotions.map((store) => (
            <div key={store.store_id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {store.store_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{store.store_location}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {store.items.length} {store.items.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="relative group">
                {store.items.length > 4 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => scrollGallery(store.store_id, "left")}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 hover:bg-card rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconChevronLeft className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => scrollGallery(store.store_id, "right")}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 hover:bg-card rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}

                <ScrollArea className="w-full">
                  <div
                    id={`gallery-${store.store_id}`}
                    className="flex gap-4 pb-4"
                  >
                    {store.items.map((item) => (
                      <Card
                        key={item.id}
                        className="flex-none w-[220px] hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
                      >
                        <CardContent className="p-0">
                          {item.image_url && (
                            <div className="relative">
                              <img
                                src={item.image_url}
                                alt={item.products?.description || "Product"}
                                className="w-full h-[220px] object-cover rounded-t-lg"
                              />
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-bold shadow-lg">
                                PROMO
                              </div>
                            </div>
                          )}
                          <div className="p-4">
                            <p className="text-sm font-semibold text-foreground line-clamp-2 mb-3 min-h-[40px]">
                              {item.products?.description || "Product"}
                            </p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-muted-foreground line-through">
                                K{(item.promotional_price * 1.25).toFixed(2)}
                              </span>
                              <span className="text-xl font-bold text-primary">
                                K{item.promotional_price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
