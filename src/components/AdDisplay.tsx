import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export const AdDisplay = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [generalAds, setGeneralAds] = useState<any[]>([]);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    // Load active banners
    const { data: bannerData } = await supabase
      .from("ad_banners")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(3);

    // Load active promotions
    const { data: promoData } = await supabase
      .from("ad_promotions")
      .select("*, stores(location, store_hq(name)), products(description)")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(6);

    // Load active general ads
    const { data: generalData } = await supabase
      .from("ad_general")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(4);

    setBanners(bannerData || []);
    setPromotions(promoData || []);
    setGeneralAds(generalData || []);
  };

  if (banners.length === 0 && promotions.length === 0 && generalAds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 py-12">
      {/* Banner Ads Section */}
      {banners.length > 0 && (
        <section className="container mx-auto px-4 max-w-6xl">
          <div className="space-y-4">
            {banners.map((banner) => (
              <a
                key={banner.id}
                href={banner.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all bg-card"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-48 md:h-64 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-xl text-foreground">{banner.title}</p>
                      {banner.description && (
                        <p className="text-sm text-muted-foreground mt-2">{banner.description}</p>
                      )}
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Promotional Items Section */}
      {promotions.length > 0 && (
        <section className="bg-muted/50 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Special Deals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo) => (
                <Card key={promo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {promo.image_url && (
                      <img
                        src={promo.image_url}
                        alt={promo.products?.description}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{promo.products?.description}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {promo.stores?.store_hq?.name} - {promo.stores?.location}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          ${parseFloat(promo.promotional_price).toFixed(2)}
                        </span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Special Offer
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* General Ads Section */}
      {generalAds.length > 0 && (
        <section className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-8">Featured</h2>
          <div className="space-y-4">
            {generalAds.map((ad) => (
              <a
                key={ad.id}
                href={ad.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all bg-card"
              >
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full h-48 md:h-64 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-xl text-foreground">{ad.title}</h3>
                      {ad.description && (
                        <p className="text-sm text-muted-foreground mt-2">{ad.description}</p>
                      )}
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
