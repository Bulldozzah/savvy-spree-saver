import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export const PromotionalGrid = () => {
  const [generalAds, setGeneralAds] = useState<any[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGeneralAds();
  }, []);

  // Auto-scroll vertically every 3 seconds
  useEffect(() => {
    if (generalAds.length === 0 || isHovering) return;

    const interval = setInterval(() => {
      if (gridRef.current) {
        const maxScroll = gridRef.current.scrollHeight - gridRef.current.clientHeight;
        const currentScroll = gridRef.current.scrollTop;
        
        if (currentScroll >= maxScroll - 10) {
          gridRef.current.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          gridRef.current.scrollBy({ top: 300, behavior: "smooth" });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [generalAds.length, isHovering]);

  const loadGeneralAds = async () => {
    const { data } = await supabase
      .from("ad_general")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(6);
    
    setGeneralAds(data || []);
  };

  if (generalAds.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div 
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[900px] overflow-y-auto pr-2"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {generalAds.map((ad) => (
            <a
              key={ad.id}
              href={ad.link_url || "#"}
              target={ad.link_url ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                <div className="relative">
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-full h-[280px] object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                      {ad.title}
                      {ad.link_url && (
                        <ExternalLink className="h-4 w-4 opacity-70" />
                      )}
                    </h3>
                    {ad.description && (
                      <p className="text-sm text-white/90">{ad.description}</p>
                    )}
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
