import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingBag, BarChart3, Bell, ListChecks, TrendingDown, Menu, X, ArrowRight } from "lucide-react";
import { FlashDeals } from "@/components/FlashDeals";
import { GeneralAdsCarousel } from "@/components/GeneralAdsCarousel";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Load banners
  useEffect(() => {
    const loadBanners = async () => {
      const { data } = await supabase
        .from("ad_banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(5);
      
      if (data && data.length > 0) {
        setBanners(data);
      }
    };
    loadBanners();
  }, []);

  // Auto-advance hero slides
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 1. Sticky Navbar with Mobile Menu */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">WiseUp Shop</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-6 items-center">
              <Link to="/" className="text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/auth" className="text-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link to="/auth" className="text-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link to="/auth">
                <Button className="rounded-full shadow-md hover:shadow-lg transition-shadow">
                  Login / Sign Up
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-foreground hover:text-primary"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 flex flex-col gap-4 animate-fade-in">
              <Link
                to="/"
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/auth"
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                to="/auth"
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-full">Login / Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* 2. Hero Carousel - Image Stacking with Opacity Transitions */}
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-slate-900">
        {/* Stacked Banner Images */}
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ease-in-out ${
              index === currentBannerIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover opacity-60"
            />
          </div>
        ))}

        {/* Overlay Content - Centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg tracking-tight animate-fade-in-up">
            Discover the True Cost
            <br />
            <span className="text-primary">of Your Groceries</span>
          </h1>
          <p
            className="text-xl md:text-2xl font-light text-emerald-50 mb-8 max-w-2xl drop-shadow-lg animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Compare prices, create smart lists, and save money with community-driven insights
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Link to="/auth">
              <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full bg-white text-foreground hover:bg-white/90"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Navigation Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBannerIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentBannerIndex ? "w-6 bg-white" : "w-2.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Flash Deals - Horizontal Scroll */}
      <FlashDeals />

      {/* 4. About Section - Brand Mission */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 tracking-tight">
              See the True Cost of Your Groceries
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              WiseUp Shop empowers shoppers to make informed purchasing decisions through real-time price
              comparisons. Our community-driven platform brings transparency to grocery shopping, helping you save
              money on every purchase.
            </p>
          </div>
        </div>
      </section>

      {/* 5. General Ad Banner - Dynamic Carousel */}
      <GeneralAdsCarousel />

      {/* 6. Features Grid - 3 Columns */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Why Choose WiseUp Shop?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card rounded-2xl p-6 shadow-lg hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-6">
                <ListChecks className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Smart Lists</h3>
              <p className="text-muted-foreground leading-relaxed">
                Create intelligent shopping lists that automatically find the best prices across stores in your area.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card rounded-2xl p-6 shadow-lg hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Price Comparisons</h3>
              <p className="text-muted-foreground leading-relaxed">
                Compare real-time prices from multiple stores and find the best deals on your favorite products.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card rounded-2xl p-6 shadow-lg hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-6">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Price Alerts</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get notified when prices drop on items you're watching and never miss a great deal again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. How It Works - 4 Step Process */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-slate-700">
                1
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Create List</h3>
              <p className="text-sm text-muted-foreground">Build your shopping list with products you need</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-slate-700">
                2
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Compare Prices</h3>
              <p className="text-sm text-muted-foreground">See real-time prices from stores near you</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-slate-700">
                3
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Choose Store</h3>
              <p className="text-sm text-muted-foreground">Pick the store with the best overall value</p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                4
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Save Money</h3>
              <p className="text-sm text-muted-foreground">Enjoy savings on every shopping trip</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Stats Strip - Social Proof with Grid Layout */}
      <section className="py-12 bg-emerald-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
            {/* Left: CTA Text */}
            <div className="col-span-1 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">Ready to Start Saving?</h2>
              <p className="text-emerald-100">Join thousands of smart shoppers</p>
            </div>

            {/* Right: Stats Grid */}
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-emerald-400 mb-2">50,000+</div>
                <div className="text-emerald-100">Active Users</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-400 mb-2">500+</div>
                <div className="text-emerald-100">Partner Stores</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-400 mb-2">$2M+</div>
                <div className="text-emerald-100">Total Savings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Start Shopping Smarter Today</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the power of informed shopping decisions
          </p>
          <Link to="/auth">
            <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
};

export default Index;
