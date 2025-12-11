import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/neon-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Package, Upload, Store, User, Phone, MessageSquare, LogOut } from "lucide-react";
import { debounce } from "lodash";
import { z } from "zod";
import { ProfileEditor } from "@/components/ProfileEditor";
import { StoreProfileEditor } from "@/components/StoreProfileEditor";
import { StoreFeedbackViewer } from "@/components/StoreFeedbackViewer";
import { countries } from "@/data/countries";
import { cn } from "@/lib/utils";
import { SmartShopperLayout } from "@/components/SmartShopperSidebar";

// Validation schema for price updates
const priceSchema = z.object({
  gtin: z.string().trim().min(1, "GTIN is required"),
  price: z.number().positive("Price must be positive").max(999999.99, "Price too large")
});

const StoreOwnerDashboard = () => {
  const { toast } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [currentPrices, setCurrentPrices] = useState<Record<string, string>>({});
  const [inStock, setInStock] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [csvData, setCsvData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [storeContact, setStoreContact] = useState({ email: "", contact: "", whatsapp: "" });
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [activeSection, setActiveSection] = useState<number>(0);

  useEffect(() => {
    loadStores();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      if (!data.profile_completed) {
        setProfileDialogOpen(true);
      }
      if (data.currency) {
        const country = countries.find(c => c.currencyCode === data.currency);
        if (country) {
          setCurrencySymbol(country.currencySymbol);
        }
      }
    }
  };

  useEffect(() => {
    if (selectedStoreId) {
      loadStorePrices(selectedStoreId);
      loadStoreContact(selectedStoreId);
    }
  }, [selectedStoreId]);

  const loadStores = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("stores")
      .select("*, store_hq(name)")
      .eq("store_owner_id", user.id);
    
    setStores(data || []);
    if (data && data.length > 0) {
      setSelectedStoreId(data[0].id);
    }
  };

  const searchProducts = async (term: string) => {
    setIsSearching(true);
    if (!term.trim()) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .limit(500);
      setProducts(data || []);
      setIsSearching(false);
      return;
    }

    const { data } = await supabase
      .from("products")
      .select("*")
      .or(`gtin.ilike.%${term}%,description.ilike.%${term}%`)
      .limit(500);
    
    setProducts(data || []);
    setIsSearching(false);
  };

  const debouncedSearch = useCallback(
    debounce((term: string) => searchProducts(term), 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const loadStorePrices = async (storeId: string) => {
    const { data } = await supabase
      .from("store_prices")
      .select("*")
      .eq("store_id", storeId);
    
    const priceMap: Record<string, string> = {};
    const stockMap: Record<string, boolean> = {};
    data?.forEach((p) => {
      priceMap[p.product_gtin] = p.price.toString();
      stockMap[p.product_gtin] = p.in_stock ?? true;
    });
    setPrices(priceMap);
    setCurrentPrices(priceMap);
    setInStock(stockMap);
  };

  const loadStoreContact = async (storeId: string) => {
    const { data } = await supabase
      .from("stores")
      .select("email, contact, whatsapp")
      .eq("id", storeId)
      .single();
    
    if (data) {
      setStoreContact({
        email: data.email || "",
        contact: data.contact || "",
        whatsapp: data.whatsapp || ""
      });
    }
  };

  const updateStoreContact = async () => {
    if (!selectedStoreId) return;

    setIsSavingContact(true);
    const { error } = await supabase
      .from("stores")
      .update({
        email: storeContact.email.trim() || null,
        contact: storeContact.contact.trim() || null,
        whatsapp: storeContact.whatsapp.trim() || null
      })
      .eq("id", selectedStoreId);

    setIsSavingContact(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Store contact information updated" });
    }
  };

  const updateStockStatus = async (gtin: string, stockStatus: boolean) => {
    if (!selectedStoreId) return;

    // First check if the price entry exists
    const { data: existingPrice } = await supabase
      .from("store_prices")
      .select("*")
      .eq("store_id", selectedStoreId)
      .eq("product_gtin", gtin)
      .single();

    if (!existingPrice) {
      toast({ 
        title: "Price Required", 
        description: "Please set a price for this product first before updating stock status.", 
        variant: "destructive" 
      });
      // Revert the checkbox state
      setInStock(prev => ({ ...prev, [gtin]: !stockStatus }));
      return;
    }

    // Update only the in_stock field
    const { error } = await supabase
      .from("store_prices")
      .update({ in_stock: stockStatus })
      .eq("store_id", selectedStoreId)
      .eq("product_gtin", gtin);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      // Revert the checkbox state
      setInStock(prev => ({ ...prev, [gtin]: !stockStatus }));
    } else {
      toast({ 
        title: "Success", 
        description: `Product marked as ${stockStatus ? 'in stock' : 'out of stock'}`,
        duration: 2000
      });
    }
  };

  const updatePrice = async (gtin: string) => {
    if (!selectedStoreId || !prices[gtin]) return;

    const parsedPrice = parseFloat(prices[gtin]);
    const result = priceSchema.safeParse({ gtin, price: parsedPrice });
    
    if (!result.success) {
      toast({ 
        title: "Validation Error", 
        description: result.error.issues[0].message, 
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase
      .from("store_prices")
      .upsert({
        store_id: selectedStoreId,
        product_gtin: result.data.gtin,
        price: result.data.price,
        in_stock: inStock[gtin] ?? true,
      }, {
        onConflict: 'store_id,product_gtin'
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Price updated" });
      // Update currentPrices to reflect the new price
      setCurrentPrices(prev => ({ ...prev, [gtin]: result.data.price.toString() }));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
    };
    reader.readAsText(file);
  };

  const importBulkPrices = async () => {
    if (!selectedStoreId || !csvData.trim()) {
      toast({ title: "Error", description: "Please select a store and enter CSV data", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    const lines = csvData.trim().split("\n");
    const priceUpdates: Array<{ store_id: string; product_gtin: string; price: number }> = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const [gtin, price] = line.split(",").map((s) => s.trim());
      if (!gtin || !price) {
        errors.push(`Line ${index + 1}: Invalid format (expected GTIN,Price)`);
        return;
      }
      const parsedPrice = parseFloat(price);
      
      // Validate using schema
      const result = priceSchema.safeParse({ gtin, price: parsedPrice });
      if (!result.success) {
        errors.push(`Line ${index + 1}: ${result.error.issues[0].message}`);
        return;
      }
      
      priceUpdates.push({
        store_id: selectedStoreId,
        product_gtin: result.data.gtin,
        price: result.data.price,
      });
    });

    if (errors.length > 0) {
      toast({ 
        title: "Import Errors", 
        description: errors.join(", "), 
        variant: "destructive" 
      });
      setIsImporting(false);
      return;
    }

    const { error } = await supabase.from("store_prices").upsert(priceUpdates, {
      onConflict: 'store_id,product_gtin'
    });

    setIsImporting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: `${priceUpdates.length} prices imported successfully` 
      });
      setCsvData("");
      setSelectedFile(null);
      loadStorePrices(selectedStoreId);
    }
  };

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      window.location.href = "/";
    }
  };

  // Map activeSection to view string for sidebar
  const sectionToView: Record<number, string> = {
    0: 'store-prices',
    1: 'store-prices',
    2: 'store-admin',
    3: 'store-admin',
    4: 'customer-feedback',
    5: 'feedback',
  };

  const viewToSection: Record<string, number> = {
    'store-admin': 2,
    'store-prices': 0,
    'customer-feedback': 4,
    'feedback': 5,
  };

  const handleNavigate = (view: string) => {
    const section = viewToSection[view];
    if (section !== undefined) {
      setActiveSection(section);
    }
  };

  if (stores.length === 0) {
    return (
      <SmartShopperLayout
        userRole="store_owner"
        activeView="store-admin"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        <Card>
          <CardContent className="p-6">
            <p>No store assigned to your account. Please contact admin.</p>
          </CardContent>
        </Card>
      </SmartShopperLayout>
    );
  }

  return (
    <SmartShopperLayout
      userRole="store_owner"
      activeView={sectionToView[activeSection] || 'store-prices'}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onProfileClick={() => setActiveSection(5)}
    >
      <StoreOwnerContent 
        activeSection={activeSection}
        stores={stores}
        selectedStoreId={selectedStoreId}
        setSelectedStoreId={setSelectedStoreId}
        selectedStore={selectedStore}
        products={products}
        prices={prices}
        setPrices={setPrices}
        currentPrices={currentPrices}
        inStock={inStock}
        setInStock={setInStock}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isSearching={isSearching}
        updatePrice={updatePrice}
        updateStockStatus={updateStockStatus}
        currencySymbol={currencySymbol}
        csvData={csvData}
        setCsvData={setCsvData}
        selectedFile={selectedFile}
        handleFileUpload={handleFileUpload}
        importBulkPrices={importBulkPrices}
        isImporting={isImporting}
        storeContact={storeContact}
        setStoreContact={setStoreContact}
        updateStoreContact={updateStoreContact}
        isSavingContact={isSavingContact}
        profileDialogOpen={profileDialogOpen}
        setProfileDialogOpen={setProfileDialogOpen}
        loadUserProfile={loadUserProfile}
      />
    </SmartShopperLayout>
  );
};

const StoreOwnerContent = ({
  activeSection,
  stores,
  selectedStoreId,
  setSelectedStoreId,
  selectedStore,
  products,
  prices,
  setPrices,
  currentPrices,
  inStock,
  setInStock,
  searchTerm,
  setSearchTerm,
  isSearching,
  updatePrice,
  updateStockStatus,
  currencySymbol,
  csvData,
  setCsvData,
  selectedFile,
  handleFileUpload,
  importBulkPrices,
  isImporting,
  storeContact,
  setStoreContact,
  updateStoreContact,
  isSavingContact,
  profileDialogOpen,
  setProfileDialogOpen,
  loadUserProfile,
}: any) => {
  return (
    <div className="flex flex-1 flex-col w-full">
      <div className="flex flex-col gap-4 flex-1 w-full">
        {/* Store Selector - visible across all tabs */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Store Manager Dashboard</h1>
            <p className="text-muted-foreground">Manage your store prices and products</p>
          </div>

          {stores.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Select Store
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store: any) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.store_hq?.name} - {store.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {selectedStore && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{selectedStore.store_hq?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedStore.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Individual Price Updates */}
        {activeSection === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Update Product Prices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search products by GTIN or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {isSearching && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Searching products...
                </p>
              )}

              {!isSearching && products.length === 0 && searchTerm && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No products found matching "{searchTerm}"
                </p>
              )}

              {!isSearching && products.length === 0 && !searchTerm && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Start typing to search for products...
                </p>
              )}

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {products.map((product: any) => (
                  <div key={product.gtin} className="flex flex-col gap-3 border rounded p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{product.description}</p>
                        <p className="text-sm text-muted-foreground">GTIN: {product.gtin}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-4 border rounded-md p-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`stock-${product.gtin}`}
                            checked={inStock[product.gtin] ?? true}
                            onChange={() => {
                              setInStock({ ...inStock, [product.gtin]: true });
                              updateStockStatus(product.gtin, true);
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm whitespace-nowrap">In Stock</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`stock-${product.gtin}`}
                            checked={inStock[product.gtin] === false}
                            onChange={() => {
                              setInStock({ ...inStock, [product.gtin]: false });
                              updateStockStatus(product.gtin, false);
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm whitespace-nowrap">Out of Stock</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentPrices[product.gtin] && (
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            Current: {currencySymbol}{currentPrices[product.gtin]}
                          </span>
                        )}
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={`New Price (${currencySymbol})`}
                          value={prices[product.gtin] || ""}
                          onChange={(e) => setPrices({ ...prices, [product.gtin]: e.target.value })}
                          className="w-40"
                        />
                        <Button onClick={() => updatePrice(product.gtin)} size="sm">
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk CSV Import */}
        {activeSection === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Batch Price Update via CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">
                  Upload multiple product prices at once
                </p>
                <p className="text-sm text-muted-foreground">
                  Format: <code className="bg-background px-2 py-1 rounded">GTIN,Price</code> (one per line)
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Example:</p>
                  <code className="block bg-background px-2 py-1 rounded">1234567890123,9.99</code>
                  <code className="block bg-background px-2 py-1 rounded">9876543210987,14.50</code>
                  <code className="block bg-background px-2 py-1 rounded">5551234567890,25.00</code>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Upload CSV File</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  {selectedFile && (
                    <span className="text-sm text-muted-foreground">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or paste CSV data
                  </span>
                </div>
              </div>

              <Textarea
                placeholder="1234567890123,9.99&#10;9876543210987,14.50"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />

              <Button 
                onClick={importBulkPrices} 
                disabled={isImporting || !csvData.trim()}
                className="w-full"
              >
                {isImporting ? "Importing..." : "Import Prices"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Store Profile */}
        {activeSection === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StoreProfileEditor />
            </CardContent>
          </Card>
        )}

        {/* Store Contact */}
        {activeSection === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Store Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Update your store's contact information so shoppers can share their lists with you.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Email</label>
                  <Input
                    type="email"
                    placeholder="store@example.com"
                    value={storeContact.email}
                    onChange={(e) => setStoreContact({ ...storeContact, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Phone</label>
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={storeContact.contact}
                    onChange={(e) => setStoreContact({ ...storeContact, contact: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">WhatsApp Number</label>
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={storeContact.whatsapp}
                    onChange={(e) => setStoreContact({ ...storeContact, whatsapp: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +1 for US, +44 for UK)
                  </p>
                </div>

                <Button 
                  onClick={updateStoreContact} 
                  disabled={isSavingContact}
                  className="w-full"
                >
                  {isSavingContact ? "Saving..." : "Save Contact Information"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Feedback */}
        {activeSection === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Customer Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StoreFeedbackViewer />
            </CardContent>
          </Card>
        )}

        {/* Edit Profile */}
        {activeSection === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileEditor onComplete={() => {
                loadUserProfile();
              }} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StoreOwnerDashboard;
