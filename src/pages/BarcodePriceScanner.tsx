import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { StoreSelector } from "@/components/StoreSelector";
import { SmartShopperLayout } from "@/components/SmartShopperSidebar";
import { Camera, CheckCircle2, Package, Store, DollarSign, Search } from "lucide-react";
import { countries } from "@/data/countries";

const BarcodePriceScanner = () => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scannedGtin, setScannedGtin] = useState("");
  const [manualGtin, setManualGtin] = useState("");
  const [product, setProduct] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [price, setPrice] = useState("");
  const [existingPrice, setExistingPrice] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [productNotFound, setProductNotFound] = useState(false);

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("currency").eq("user_id", user.id).maybeSingle();
    if (data?.currency) {
      const country = countries.find(c => c.currencyCode === data.currency);
      if (country) setCurrencySymbol(country.currencySymbol);
    }
  };

  const lookupProduct = async (gtin: string) => {
    setScannedGtin(gtin);
    setProductNotFound(false);
    setExistingPrice(null);
    
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("gtin", gtin)
      .maybeSingle();

    if (data) {
      setProduct(data);
      // If store already selected, check existing price
      if (selectedStore) {
        await loadExistingPrice(gtin, selectedStore.id);
      }
    } else {
      setProduct(null);
      setProductNotFound(true);
      toast({ title: "Product Not Found", description: `No product found for barcode: ${gtin}`, variant: "destructive" });
    }
  };

  const loadExistingPrice = async (gtin: string, storeId: string) => {
    const { data } = await supabase
      .from("store_prices")
      .select("*")
      .eq("product_gtin", gtin)
      .eq("store_id", storeId)
      .maybeSingle();
    
    setExistingPrice(data);
    if (data) {
      setPrice(data.price.toString());
    }
  };

  useEffect(() => {
    if (product && selectedStore) {
      loadExistingPrice(product.gtin, selectedStore.id);
    }
  }, [selectedStore]);

  const handleSubmitPrice = async () => {
    if (!product || !selectedStore || !price) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast({ title: "Error", description: "Please enter a valid price", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("store_prices")
      .upsert({
        store_id: selectedStore.id,
        product_gtin: product.gtin,
        price: parsedPrice,
        in_stock: true,
        verified: false,
        source: 'shopper',
        updated_by: user.id,
      }, { onConflict: 'store_id,product_gtin' });

    setIsSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Price Submitted!", description: `${currencySymbol} ${parsedPrice.toFixed(2)} submitted for review` });
      // Reload to show updated status
      await loadExistingPrice(product.gtin, selectedStore.id);
    }
  };

  const handleManualLookup = () => {
    if (manualGtin.trim()) {
      lookupProduct(manualGtin.trim());
    }
  };

  const resetScan = () => {
    setProduct(null);
    setScannedGtin("");
    setManualGtin("");
    setPrice("");
    setExistingPrice(null);
    setProductNotFound(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <SmartShopperLayout
      userRole="shopper"
      activeView="scan-price"
      onNavigate={() => {}}
      onLogout={handleLogout}
    >
      <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-foreground mb-1">Scan & Update Price</h1>
          <p className="text-muted-foreground text-sm">Scan a product barcode in-store and submit the current price</p>
        </div>

        {/* Step 1: Select Store */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4" />
              Step 1: Select Store
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StoreSelector
              selectedStore={selectedStore}
              onStoreSelected={setSelectedStore}
              buttonText="Select the store you're in"
            />
            {selectedStore && (
              <p className="text-sm text-muted-foreground mt-2">
                📍 {selectedStore.store_hq?.name} - {selectedStore.location}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Scan or Enter Barcode */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Step 2: Scan or Enter Barcode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <BarcodeScanner
              onDetected={lookupProduct}
              scanning={scanning}
              onStartScan={() => setScanning(true)}
              onStopScan={() => setScanning(false)}
            />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or enter manually</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Enter GTIN / Barcode"
                value={manualGtin}
                onChange={(e) => setManualGtin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
              />
              <Button onClick={handleManualLookup} size="icon" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {scannedGtin && (
              <p className="text-xs text-muted-foreground">Barcode: {scannedGtin}</p>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Product Confirmation */}
        {product && (
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Step 3: Confirm Product
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-sm">{product.description}</p>
                <p className="text-xs text-muted-foreground">GTIN: {product.gtin}</p>
              </div>

              {existingPrice && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Price</p>
                    <p className="font-semibold">{currencySymbol} {Number(existingPrice.price).toFixed(2)}</p>
                  </div>
                  <VerifiedBadge verified={existingPrice.verified} size="md" />
                </div>
              )}

              {/* Step 4: Enter Price */}
              <div>
                <CardTitle className="text-base flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4" />
                  Step 4: Enter Price
                </CardTitle>
                <div className="flex gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">{currencySymbol}</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitPrice}
                  disabled={isSubmitting || !price}
                  className="flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Submit Price"}
                </Button>
                <Button variant="outline" onClick={resetScan}>
                  Scan Another
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Community-submitted prices will show as <VerifiedBadge verified={false} /> until verified by the store owner
              </p>
            </CardContent>
          </Card>
        )}

        {productNotFound && (
          <Card className="border-destructive/30">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Product with barcode <span className="font-mono font-medium">{scannedGtin}</span> was not found in the database.
              </p>
              <Button variant="outline" onClick={resetScan} className="mt-3">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </SmartShopperLayout>
  );
};

export default BarcodePriceScanner;
