import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const FlashDeals = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, []);

  // Auto-scroll every 3 seconds
  useEffect(() => {
    if (promotions.length <= 1 || isHovering) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (scrollContainer) {
          const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
          const currentScroll = scrollContainer.scrollLeft;
          
          if (currentScroll >= maxScroll - 10) {
            scrollContainer.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            scrollContainer.scrollBy({ left: 300, behavior: "smooth" });
          }
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [promotions.length, isHovering]);

  const loadPromotions = async () => {
    const { data } = await supabase
      .from("ad_promotions")
      .select("*, stores(location, store_hq(name)), products(description)")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(12);
    
    setPromotions(data || []);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (scrollContainer) {
        const scrollAmount = 300;
        scrollContainer.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  if (promotions.length === 0) return null;

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Flash Deals</h2>
          <Button variant="link" className="text-primary">View all</Button>
        </div>

        <div 
          className="relative group"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 hover:bg-card rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <ScrollArea ref={scrollRef} className="w-full">
            <div className="flex gap-4 pb-4">
              {promotions.map((promo) => (
                <Card 
                  key={promo.id} 
                  className="flex-none w-[200px] hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardContent className="p-0">
                    {promo.image_url && (
                      <div className="relative">
                        <img
                          src={promo.image_url}
                          alt={promo.products?.description}
                          className="w-full h-[200px] object-cover rounded-t-lg"
                        />
                        <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-xs font-bold">
                          DEAL
                        </div>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-semibold text-foreground line-clamp-2 mb-2">
                        {promo.products?.description}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                        {promo.stores?.store_hq?.name} - {promo.stores?.location}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-muted-foreground line-through">K{(promo.promotional_price * 1.3).toFixed(2)}</span>
                        <span className="text-lg font-bold text-foreground">K{promo.promotional_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 hover:bg-card rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
