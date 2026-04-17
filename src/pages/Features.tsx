import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  ListChecks,
  Search,
  BarChart3,
  Camera,
  Store,
  GitCompare,
  MessageSquare,
  Upload,
  MapPin,
  Bell,
  Shield,
  Users,
} from "lucide-react";
import Footer from "@/components/Footer";

const shopperFeatures = [
  {
    icon: ListChecks,
    title: "Smart Shopping Lists",
    description:
      "Create intelligent shopping lists that help you organize your grocery needs. Add items by searching or scanning barcodes.",
  },
  {
    icon: Search,
    title: "Search & Add Products",
    description:
      "Search our extensive product database by name, description, or barcode to find exactly what you need.",
  },
  {
    icon: Camera,
    title: "Scan & Update Prices",
    description:
      "Use your phone's camera to scan product barcodes and instantly update or verify prices at your local store.",
  },
  {
    icon: Store,
    title: "Browse Stores",
    description:
      "Explore nearby stores, view their product catalogs, and compare what's available before you shop.",
  },
  {
    icon: GitCompare,
    title: "Compare Prices",
    description:
      "Compare prices for the same product across multiple stores to find the best deal in your area.",
  },
  {
    icon: MessageSquare,
    title: "Store Feedback",
    description:
      "Rate and review stores based on your shopping experience. Help the community find the best places to shop.",
  },
];

const storeOwnerFeatures = [
  {
    icon: BarChart3,
    title: "Store Manager Dashboard",
    description:
      "A comprehensive dashboard to manage your store's prices, products, and customer interactions all in one place.",
  },
  {
    icon: Upload,
    title: "Bulk CSV Price Upload",
    description:
      "Upload a CSV file with product GTINs, prices, and stock status to update hundreds of prices in seconds.",
  },
  {
    icon: MapPin,
    title: "Google Maps Integration",
    description:
      "Set your store location with Google Maps. Customers can find you easily with accurate coordinates and address.",
  },
  {
    icon: Bell,
    title: "Customer Feedback",
    description:
      "View and respond to customer reviews and ratings. Understand what your customers love and what can be improved.",
  },
];

const platformFeatures = [
  {
    icon: Shield,
    title: "Verified Prices",
    description:
      "Prices submitted by store owners are automatically verified, giving shoppers confidence in the data they see.",
  },
  {
    icon: Users,
    title: "Community-Driven",
    description:
      "Shoppers contribute prices they find in stores, building a comprehensive and up-to-date price database for everyone.",
  },
  {
    icon: ShoppingCart,
    title: "Mobile-Ready",
    description:
      "Designed for use on the go. Access Savio-shop from your phone while you're in the store to make smarter decisions.",
  },
];

const Features = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/">
            <h1 className="text-2xl font-bold">Savio-shop</h1>
          </Link>
          <div className="flex gap-4 items-center">
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/features">
              <Button variant="ghost">Features</Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost">About Us</Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost">Contact Us</Button>
            </Link>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-5xl font-extrabold mb-6 text-foreground">
              Features & Functions
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to shop smarter and manage your store
              efficiently — all in one platform.
            </p>
          </div>
        </section>

        {/* Shopper Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 mb-4">
                For Shoppers
              </span>
              <h2 className="text-3xl font-bold text-foreground">
                Shop Smarter, Save More
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Tools designed to help you find the best prices, organize your
                shopping, and never overpay again.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {shopperFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-card rounded-2xl p-6 shadow-lg hover:-translate-y-1 transition-transform duration-300 border"
                  >
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Store Owner Features */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 mb-4">
                For Store Owners
              </span>
              <h2 className="text-3xl font-bold text-foreground">
                Manage Your Store with Ease
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Powerful tools to keep your prices updated, attract customers,
                and grow your business.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {storeOwnerFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-card rounded-2xl p-6 shadow-lg hover:-translate-y-1 transition-transform duration-300 border"
                  >
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 mb-4">
                Platform
              </span>
              <h2 className="text-3xl font-bold text-foreground">
                Built for Trust & Transparency
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Core principles that make Savio-shop reliable for everyone.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {platformFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-card rounded-2xl p-6 shadow-lg hover:-translate-y-1 transition-transform duration-300 border text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4 mx-auto">
                      <Icon className="w-7 h-7 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Ready to Start Saving?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join Savio-shop today and take control of your grocery spending.
              It's free for shoppers.
            </p>
            <Link to="/auth">
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full shadow-lg text-lg px-8"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
