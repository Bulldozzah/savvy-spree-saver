import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const GeneralAdsCarousel = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadAds();
  }, []);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const loadAds = async () => {
    const { data } = await supabase
      .from("ad_general")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(5);
    
    if (data && data.length > 0) {
      setAds(data);
    }
  };

  if (ads.length === 0) {
    // Fallback to static content if no ads
    return (
      <section className="relative h-[300px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2000"
          alt="Local Goods"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Support Local Goods</h2>
          <p className="text-white/90 text-lg mb-6">
            Discover amazing products from local vendors and support your community
          </p>
          <div>
            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 shadow-lg">
              Explore Local
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[300px] overflow-hidden">
      {/* Stacked Ad Images */}
      {ads.map((ad, index) => (
        <div
          key={ad.id}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={ad.image_url}
            alt={ad.title}
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        </div>
      ))}

      {/* Overlay Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 transition-all duration-300">
          {ads[currentIndex]?.title}
        </h2>
        {ads[currentIndex]?.description && (
          <p className="text-white/90 text-lg mb-6 transition-all duration-300">
            {ads[currentIndex].description}
          </p>
        )}
        {ads[currentIndex]?.link_url && (
          <div>
            <a href={ads[currentIndex].link_url} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 shadow-lg">
                Learn More
              </Button>
            </a>
          </div>
        )}
      </div>

      {/* Navigation Dots */}
      {ads.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? "w-6 bg-white" : "w-2.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
