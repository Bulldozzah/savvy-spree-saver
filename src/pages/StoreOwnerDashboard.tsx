import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/neon-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Package, Upload, Store, User, Phone, MessageSquare, LogOut, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
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
  const [verifiedStatus, setVerifiedStatus] = useState<Record<string, boolean>>({});
  const [sourceStatus, setSourceStatus] = useState<Record<string, string>>({});
  const [csvErrors, setCsvErrors] = useState<Array<{ line: number; gtin: string; message: string }>>([]);
  const [csvErrorDialogOpen, setCsvErrorDialogOpen] = useState(false);
  const [lastImportStats, setLastImportStats] = useState<{ success: number; failed: number } | null>(null);

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
    const verifiedMap: Record<string, boolean> = {};
    const sourceMap: Record<string, string> = {};
    data?.forEach((p: any) => {
      priceMap[p.product_gtin] = p.price.toString();
      stockMap[p.product_gtin] = p.in_stock ?? true;
      verifiedMap[p.product_gtin] = p.verified ?? false;
      sourceMap[p.product_gtin] = p.source ?? 'store_owner';
    });
    setPrices(priceMap);
    setCurrentPrices(priceMap);
    setInStock(stockMap);
    setVerifiedStatus(verifiedMap);
    setSourceStatus(sourceMap);
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

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("store_prices")
      .upsert({
        store_id: selectedStoreId,
        product_gtin: result.data.gtin,
        price: result.data.price,
        in_stock: inStock[gtin] ?? true,
        verified: true,
        source: 'store_owner',
        verified_by: user?.id,
        updated_by: user?.id,
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

  const downloadSampleCsv = () => {
    const sampleContent = "product_gtin,price,in_stock\n1234567890123,9.99,true\n9876543210987,14.50,true\n5551234567890,25.00,false";
    const blob = new Blob([sampleContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_bulk_prices.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBulkPrices = async () => {
    if (!selectedStoreId || !csvData.trim()) {
      toast({ title: "Error", description: "Please select a store and enter CSV data", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setCsvErrors([]);
    setLastImportStats(null);

    const lines = csvData.trim().split("\n");
    const { data: { user } } = await supabase.auth.getUser();
    const parsedRows: Array<{ line: number; gtin: string; price: number; inStock: boolean }> = [];
    const errors: Array<{ line: number; gtin: string; message: string }> = [];

    // Detect if first line is a header row
    const firstLine = lines[0].trim().toLowerCase();
    const startIndex = firstLine.includes('product_gtin') || firstLine.includes('gtin') ? 1 : 0;

    lines.slice(startIndex).forEach((line, index) => {
      const lineNum = index + startIndex + 1;
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) return;

      const parts = trimmedLine.split(",").map((s) => s.trim());
      const [gtin, price, stockStr] = parts;

      if (!gtin) {
        errors.push({ line: lineNum, gtin: '-', message: 'Product GTIN is missing' });
        return;
      }

      if (!/^\d+$/.test(gtin)) {
        errors.push({ line: lineNum, gtin, message: 'Invalid GTIN — must contain only numbers' });
        return;
      }

      if (!price) {
        errors.push({ line: lineNum, gtin, message: 'Price is missing' });
        return;
      }

      const parsedPrice = parseFloat(price);

      if (isNaN(parsedPrice)) {
        errors.push({ line: lineNum, gtin, message: `"${price}" is not a valid price` });
        return;
      }

      if (parsedPrice <= 0) {
        errors.push({ line: lineNum, gtin, message: 'Price must be greater than zero' });
        return;
      }

      if (parsedPrice > 999999.99) {
        errors.push({ line: lineNum, gtin, message: 'Price is too large (max 999,999.99)' });
        return;
      }

      // Validate in_stock value if provided
      if (stockStr !== undefined && stockStr !== '') {
        const lower = stockStr.toLowerCase();
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(lower)) {
          errors.push({ line: lineNum, gtin, message: `"${stockStr}" is not a valid stock value — use true/false` });
          return;
        }
      }

      const inStockValue = stockStr !== undefined && stockStr !== '' ? !['false', '0', 'no'].includes(stockStr.toLowerCase()) : true;

      parsedRows.push({ line: lineNum, gtin, price: parsedPrice, inStock: inStockValue });
    });

    // Validate GTINs exist in products table
    if (parsedRows.length > 0) {
      const uniqueGtins = [...new Set(parsedRows.map(r => r.gtin))];

      // Chunk the .in() query to avoid URL length limits (HTTP 400 on large CSVs).
      // Supabase/PostgREST GET URL length is capped (~2-8KB depending on infra).
      const GTIN_QUERY_CHUNK = 200;
      const validGtins = new Set<string>();
      let gtinFetchError: any = null;
      for (let i = 0; i < uniqueGtins.length; i += GTIN_QUERY_CHUNK) {
        const chunk = uniqueGtins.slice(i, i + GTIN_QUERY_CHUNK);
        const { data: existingProducts, error: fetchError } = await supabase
          .from("products")
          .select("gtin")
          .in("gtin", chunk);
        if (fetchError) {
          gtinFetchError = fetchError;
          break;
        }
        (existingProducts || []).forEach((p: any) => validGtins.add(p.gtin));
      }

      if (gtinFetchError) {
        setIsImporting(false);
        toast({ title: "Validation Error", description: `Failed to validate GTINs: ${gtinFetchError.message}`, variant: "destructive" });
        return;
      }

      const invalidRows: typeof parsedRows = [];
      const validRows: typeof parsedRows = [];

      parsedRows.forEach(row => {
        if (validGtins.has(row.gtin)) {
          validRows.push(row);
        } else {
          invalidRows.push(row);
          errors.push({ line: row.line, gtin: row.gtin, message: 'Product not found in catalog — this GTIN does not exist in the products database' });
        }
      });

      // Build upsert array from valid rows only
      // Deduplicate by product_gtin — keep the last occurrence
      const deduped = new Map<string, { store_id: string; product_gtin: string; price: number; in_stock: boolean; verified: boolean; source: string; verified_by: string | undefined; updated_by: string | undefined }>();
      validRows.forEach((row) => {
        deduped.set(row.gtin, {
          store_id: selectedStoreId,
          product_gtin: row.gtin,
          price: row.price,
          in_stock: row.inStock,
          verified: true,
          source: 'store_owner',
          verified_by: user?.id,
          updated_by: user?.id,
        });
      });
      const uniqueUpdates = Array.from(deduped.values());

      // Store errors for dialog
      setCsvErrors(errors);

      if (uniqueUpdates.length > 0) {
        // Chunk the upsert to avoid payload/timeout issues on very large CSVs
        const UPSERT_CHUNK = 500;
        let upsertError: any = null;
        let importedCount = 0;
        for (let i = 0; i < uniqueUpdates.length; i += UPSERT_CHUNK) {
          const batch = uniqueUpdates.slice(i, i + UPSERT_CHUNK);
          const { error } = await supabase.from("store_prices").upsert(batch, {
            onConflict: 'store_id,product_gtin',
            ignoreDuplicates: false,
          });
          if (error) {
            upsertError = error;
            break;
          }
          importedCount += batch.length;
        }

        setIsImporting(false);

        if (upsertError) {
          toast({
            title: "Database Error",
            description: `${upsertError.message}${importedCount > 0 ? ` (${importedCount} rows imported before failure)` : ''}`,
            variant: "destructive",
          });
          return;
        }

        setLastImportStats({ success: uniqueUpdates.length, failed: errors.length });

        if (errors.length > 0) {
          setCsvErrorDialogOpen(true);
          toast({
            title: "Partial Import",
            description: `${uniqueUpdates.length} prices imported/updated. ${errors.length} row(s) had errors.`,
          });
        } else {
          toast({
            title: "Success",
            description: `${uniqueUpdates.length} prices imported/updated successfully`,
          });
          setCsvData("");
          setSelectedFile(null);
        }
        loadStorePrices(selectedStoreId);
      } else {
        setIsImporting(false);
        setLastImportStats({ success: 0, failed: errors.length });
        if (errors.length > 0) {
          setCsvErrorDialogOpen(true);
        } else {
          toast({ title: "No Data", description: "No valid rows found in the CSV", variant: "destructive" });
        }
      }
    } else {
      setIsImporting(false);
      setCsvErrors(errors);
      setLastImportStats({ success: 0, failed: errors.length });
      if (errors.length > 0) {
        setCsvErrorDialogOpen(true);
      } else {
        toast({ title: "No Data", description: "No valid rows found in the CSV", variant: "destructive" });
      }
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
        downloadSampleCsv={downloadSampleCsv}
        isImporting={isImporting}
        storeContact={storeContact}
        setStoreContact={setStoreContact}
        updateStoreContact={updateStoreContact}
        isSavingContact={isSavingContact}
        profileDialogOpen={profileDialogOpen}
        setProfileDialogOpen={setProfileDialogOpen}
        loadUserProfile={loadUserProfile}
        verifiedStatus={verifiedStatus}
        sourceStatus={sourceStatus}
        csvErrors={csvErrors}
        csvErrorDialogOpen={csvErrorDialogOpen}
        setCsvErrorDialogOpen={setCsvErrorDialogOpen}
        lastImportStats={lastImportStats}
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
  downloadSampleCsv,
  isImporting,
  storeContact,
  setStoreContact,
  updateStoreContact,
  isSavingContact,
  profileDialogOpen,
  setProfileDialogOpen,
  loadUserProfile,
  verifiedStatus,
  sourceStatus,
  csvErrors,
  csvErrorDialogOpen,
  setCsvErrorDialogOpen,
  lastImportStats,
}: any) => {
  return (
    <div className="flex flex-1 flex-col w-full">
      <div className="flex flex-col gap-4 flex-1 w-full">
        {/* Store Selector - visible across all tabs */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Manager Dashboard</h1>
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

        {/* Bulk CSV Upload */}
        {activeSection === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Bulk Upload CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">
                  Upload a CSV file to update multiple product prices at once.
                </p>
                <p className="text-sm text-muted-foreground">
                  CSV columns: <code className="bg-background px-2 py-1 rounded">product_gtin, price, in_stock</code>
                </p>
                <p className="text-xs text-muted-foreground">
                  All other fields (store_id, verified, verified_by, updated_by, source) are auto-filled.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={downloadSampleCsv}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Sample CSV
              </Button>

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
                placeholder={"product_gtin,price,in_stock\n1234567890123,9.99,true\n9876543210987,14.50,false"}
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />

              <div className="flex gap-2">
                <Button
                  onClick={importBulkPrices}
                  disabled={isImporting || !csvData.trim()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? "Importing..." : "Import Prices"}
                </Button>

                {csvErrors.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setCsvErrorDialogOpen(true)}
                    className="flex items-center gap-2 border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    See Errors ({csvErrors.length})
                  </Button>
                )}
              </div>

              {lastImportStats && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 text-sm">
                  {lastImportStats.success > 0 && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {lastImportStats.success} imported
                    </span>
                  )}
                  {lastImportStats.failed > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-4 w-4" />
                      {lastImportStats.failed} failed
                    </span>
                  )}
                </div>
              )}

              <Dialog open={csvErrorDialogOpen} onOpenChange={setCsvErrorDialogOpen}>
                <DialogContent className="max-w-lg max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      CSV Import Errors ({csvErrors.length})
                    </DialogTitle>
                    <DialogDescription>
                      The following rows could not be imported. Please fix them and try again.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                    {csvErrors.map((err: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                      >
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium">Row {err.line}</span>
                          {err.gtin !== '-' && (
                            <span className="text-muted-foreground"> · GTIN: {err.gtin}</span>
                          )}
                          <p className="text-destructive mt-0.5">{err.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={() => setCsvErrorDialogOpen(false)}>
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

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
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              Current: {currencySymbol}{currentPrices[product.gtin]}
                            </span>
                            <VerifiedBadge verified={verifiedStatus[product.gtin] ?? false} />
                          </div>
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
