import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { SmartShopperLayout } from "@/components/SmartShopperSidebar";
import { StoreSelector } from "@/components/StoreSelector";
import { Search, ShoppingCart, Store, Package, AlertTriangle, DollarSign, ArrowLeft } from "lucide-react";
import { debounce } from "lodash";
import { countries } from "@/data/countries";
import { cn } from "@/lib/utils";

interface StoreProduct {
  product_gtin: string;
  description: string;
  price: number;
  unverified_price: number | null;
  verified: boolean;
  in_stock: boolean;
  source: string;
}

const BrowseStore = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<StoreProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [updatePriceDialog, setUpdatePriceDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [addToListDialog, setAddToListDialog] = useState(false);
  const [addingProduct, setAddingProduct] = useState<StoreProduct | null>(null);
  const [storeSearchTerm, setStoreSearchTerm] = useState("");
  const [filteredStores, setFilteredStores] = useState<any[]>([]);

  useEffect(() => {
    loadStores();
    loadUserProfile();
    loadShoppingLists();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadStoreProducts(selectedStore.id);
    }
  }, [selectedStore]);

  useEffect(() => {
    filterStores();
  }, [storeSearchTerm, stores]);

  const loadStores = async () => {
    const { data } = await supabase
      .from("stores")
      .select("*, store_hq(name)")
      .order("location");
    if (data) {
      setStores(data);
      setFilteredStores(data);
    }
  };

  const filterStores = () => {
    if (!storeSearchTerm.trim()) {
      setFilteredStores(stores);
      return;
    }
    const term = storeSearchTerm.toLowerCase();
    setFilteredStores(
      stores.filter(
        (s) =>
          s.store_hq?.name?.toLowerCase().includes(term) ||
          s.location?.toLowerCase().includes(term) ||
          s.city?.toLowerCase().includes(term)
      )
    );
  };

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("currency")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.currency) {
      const country = countries.find((c) => c.currencyCode === data.currency);
      if (country) setCurrencySymbol(country.currencySymbol);
    }
  };

  const loadShoppingLists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setShoppingLists(data);
  };

  const loadStoreProducts = async (storeId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("store_prices")
      .select("product_gtin, price, unverified_price, verified, in_stock, source")
      .eq("store_id", storeId);

    if (error) {
      toast({ title: "Error loading products", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setStoreProducts([]);
      setFilteredProducts([]);
      setLoading(false);
      return;
    }

    // Fetch product descriptions
    const gtins = data.map((d) => d.product_gtin);
    const { data: products } = await supabase
      .from("products")
      .select("gtin, description")
      .in("gtin", gtins);

    const descMap: Record<string, string> = {};
    products?.forEach((p) => (descMap[p.gtin] = p.description));

    const merged: StoreProduct[] = data.map((sp) => ({
      ...sp,
      description: descMap[sp.product_gtin] || sp.product_gtin,
    }));

    // Sort: in-stock first, then alphabetical
    merged.sort((a, b) => {
      if (a.in_stock !== b.in_stock) return a.in_stock ? -1 : 1;
      return a.description.localeCompare(b.description);
    });

    setStoreProducts(merged);
    setFilteredProducts(merged);
    setLoading(false);
  };

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (!term.trim()) {
        setFilteredProducts(storeProducts);
        return;
      }
      const lower = term.toLowerCase();
      setFilteredProducts(
        storeProducts.filter(
          (p) =>
            p.description.toLowerCase().includes(lower) ||
            p.product_gtin.includes(lower)
        )
      );
    }, 300),
    [storeProducts]
  );

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    debouncedSearch(val);
  };

  const handleUpdatePrice = async () => {
    if (!selectedProduct || !newPrice || !selectedStore) return;
    const priceVal = parseFloat(newPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if a row already exists
    const { data: existing } = await supabase
      .from("store_prices")
      .select("id")
      .eq("store_id", selectedStore.id)
      .eq("product_gtin", selectedProduct.product_gtin)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("store_prices")
        .update({
          unverified_price: priceVal,
          verified: false,
          source: "shopper",
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        toast({ title: "Error updating price", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("store_prices").insert({
        store_id: selectedStore.id,
        product_gtin: selectedProduct.product_gtin,
        price: priceVal,
        unverified_price: priceVal,
        verified: false,
        source: "shopper",
        updated_by: user.id,
        in_stock: true,
      });

      if (error) {
        toast({ title: "Error adding price", description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: "Price submitted", description: "Your price update has been recorded as unverified." });
    setUpdatePriceDialog(false);
    setNewPrice("");
    setSelectedProduct(null);
    loadStoreProducts(selectedStore.id);
  };

  const handleAddToList = async () => {
    if (!addingProduct || !selectedListId) return;

    const { data: existing } = await supabase
      .from("shopping_list_items")
      .select("id, quantity")
      .eq("shopping_list_id", selectedListId)
      .eq("product_gtin", addingProduct.product_gtin)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("shopping_list_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
      toast({ title: "Quantity updated", description: `${addingProduct.description} quantity increased.` });
    } else {
      const { error } = await supabase.from("shopping_list_items").insert({
        shopping_list_id: selectedListId,
        product_gtin: addingProduct.product_gtin,
        quantity: 1,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Added to list", description: `${addingProduct.description} added.` });
    }

    setAddToListDialog(false);
    setAddingProduct(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getDisplayPrice = (p: StoreProduct) => {
    if (p.verified) return p.price;
    return p.unverified_price ?? p.price;
  };

  const storeName = selectedStore
    ? `${selectedStore.store_hq?.name} - ${selectedStore.location}`
    : "";

  // Store selection screen
  if (!selectedStore) {
    return (
      <SmartShopperLayout
        userRole="shopper"
        activeView="browse-store"
        onNavigate={(view) => {
          if (view === "scan-price") navigate("/scan");
          else if (view === "browse-store") { /* already here */ }
          else navigate("/shop");
        }}
        onLogout={handleLogout}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Store className="h-7 w-7 text-primary" />
            Browse Store
          </h1>
          <p className="text-muted-foreground mb-6">
            Select a store to browse its products, prices, and verification status.
          </p>

          <div className="mb-4">
            <Input
              placeholder="Search stores by name, location, or city..."
              value={storeSearchTerm}
              onChange={(e) => setStoreSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid gap-3">
            {filteredStores.map((store) => (
              <Card
                key={store.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all duration-200"
                onClick={() => setSelectedStore(store)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {store.store_hq?.name} - {store.location}
                    </p>
                    {store.city && (
                      <p className="text-sm text-muted-foreground">{store.city}</p>
                    )}
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground">
                    Shop
                  </Button>
                </CardContent>
              </Card>
            ))}
            {filteredStores.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No stores found.</p>
            )}
          </div>
        </div>
      </SmartShopperLayout>
    );
  }

  // Virtual store browsing screen
  return (
    <SmartShopperLayout
      userRole="shopper"
      activeView="browse-store"
      onNavigate={(view) => {
        if (view === "scan-price") navigate("/scan");
        else if (view === "browse-store") setSelectedStore(null);
        else navigate("/shop");
      }}
      onLogout={handleLogout}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedStore(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              {storeName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or GTIN..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No products found in this store.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.product_gtin}
                className={cn(
                  "transition-all duration-200",
                  !product.in_stock && "opacity-60"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">
                          {product.description}
                        </p>
                        {!product.in_stock && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        GTIN: {product.product_gtin}
                      </p>

                      {/* Prices */}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {product.verified && (
                          <div className="flex items-center gap-1.5">
                            <VerifiedBadge verified size="md" />
                            <span className="font-bold text-lg text-foreground">
                              {currencySymbol}{product.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {product.unverified_price !== null && product.unverified_price !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <VerifiedBadge verified={false} size="md" />
                            <span className={cn(
                              "font-semibold",
                              product.verified ? "text-sm text-muted-foreground" : "text-lg text-foreground"
                            )}>
                              {currencySymbol}{product.unverified_price.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {!product.verified && (product.unverified_price === null || product.unverified_price === undefined) && (
                          <div className="flex items-center gap-1.5">
                            <VerifiedBadge verified={false} size="md" />
                            <span className="font-bold text-lg text-foreground">
                              {currencySymbol}{product.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {/* Price difference warning */}
                        {product.verified && product.unverified_price !== null && product.unverified_price !== undefined && product.unverified_price !== product.price && (
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Price differs</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProduct(product);
                          setNewPrice("");
                          setUpdatePriceDialog(true);
                        }}
                      >
                        <DollarSign className="h-3.5 w-3.5 mr-1" />
                        Update Price
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setAddingProduct(product);
                          setAddToListDialog(true);
                        }}
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                        Add to List
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Update Price Dialog */}
      <Dialog open={updatePriceDialog} onOpenChange={setUpdatePriceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Price</DialogTitle>
            <DialogDescription>
              Submit a new price for this product. It will be marked as unverified until the store owner confirms it.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground">{selectedProduct.description}</p>
                <p className="text-sm text-muted-foreground">GTIN: {selectedProduct.product_gtin}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {selectedProduct.verified && (
                  <p>Verified: <span className="font-semibold">{currencySymbol}{selectedProduct.price.toFixed(2)}</span></p>
                )}
                {selectedProduct.unverified_price !== null && (
                  <p>Community: <span className="font-semibold">{currencySymbol}{selectedProduct.unverified_price?.toFixed(2)}</span></p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Enter New Price ({currencySymbol})
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>
              <Button onClick={handleUpdatePrice} className="w-full">
                Submit Price
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add to List Dialog */}
      <Dialog open={addToListDialog} onOpenChange={setAddToListDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Shopping List</DialogTitle>
            <DialogDescription>
              Choose which shopping list to add this product to.
            </DialogDescription>
          </DialogHeader>
          {addingProduct && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground">{addingProduct.description}</p>
                <p className="text-sm text-muted-foreground">
                  Price: {currencySymbol}{getDisplayPrice(addingProduct).toFixed(2)}
                  {" "}
                  <VerifiedBadge verified={addingProduct.verified} size="sm" />
                </p>
              </div>
              {shoppingLists.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No shopping lists yet. Create one from your dashboard first.
                </p>
              ) : (
                <>
                  <Select value={selectedListId} onValueChange={setSelectedListId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a list" />
                    </SelectTrigger>
                    <SelectContent>
                      {shoppingLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddToList}
                    disabled={!selectedListId}
                    className="w-full"
                  >
                    Add to List
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SmartShopperLayout>
  );
};

export default BrowseStore;
