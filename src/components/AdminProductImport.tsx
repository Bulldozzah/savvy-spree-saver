import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type LookupItem = { id: string; name: string };

const AdminProductImport = () => {
  const [gtin, setGtin] = useState("");
  const [description, setDescription] = useState("");
  const [categoryGroupId, setCategoryGroupId] = useState("");
  const [bulkData, setBulkData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const [categoryGroups, setCategoryGroups] = useState<LookupItem[]>([]);

  useEffect(() => {
    const fetchLookups = async () => {
      const { data } = await supabase.from("category_groups").select("id, name").order("name");
      if (data) setCategoryGroups(data as LookupItem[]);
    };
    fetchLookups();
  }, []);

  const resolveOrCreateLookup = async (
    table: string,
    name: string,
    cache: LookupItem[],
    setCache: React.Dispatch<React.SetStateAction<LookupItem[]>>
  ): Promise<string> => {
    const trimmed = name.trim();
    if (!trimmed) return "";
    const existing = cache.find(item => item.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    const { data, error } = await supabase.from(table).insert({ name: trimmed }).select("id, name").single();
    if (error) {
      const { data: fetched } = await supabase.from(table).select("id, name").ilike("name", trimmed).single();
      if (fetched) {
        setCache(prev => [...prev, fetched as LookupItem]);
        return (fetched as LookupItem).id;
      }
      throw new Error(`Failed to resolve ${table}: ${trimmed}`);
    }
    setCache(prev => [...prev, data as LookupItem]);
    return (data as LookupItem).id;
  };

  const importSingleProduct = async () => {
    if (!gtin.trim() || !description.trim()) {
      toast({ title: "Error", description: "Please enter both GTIN and description", variant: "destructive" });
      return;
    }

    const productData: Record<string, string> = {
      gtin: gtin.trim(),
      description: description.trim(),
    };
    if (departmentId) productData.department_id = departmentId;
    if (categoryGroupId) productData.category_group_id = categoryGroupId;
    if (merchandiseCategoryId) productData.merchandise_category_id = merchandiseCategoryId;

    const { error } = await supabase.from("products").insert(productData);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Product imported successfully" });
      setGtin("");
      setDescription("");
      setDepartmentId("");
      setCategoryGroupId("");
      setMerchandiseCategoryId("");
    }
  };

  const importBulkProducts = async () => {
    if (!bulkData.trim()) {
      toast({ title: "Error", description: "Please enter product data", variant: "destructive" });
      return;
    }

    setIsImporting(true);

    try {
      const lines = bulkData.split("\n").filter(l => l.trim());
      const products: Array<Record<string, string>> = [];

      for (const line of lines) {
        const parts = line.split(",").map(s => s.trim());
        const [gtinVal, descVal, deptName, cgName, mcName] = parts;
        if (!gtinVal || !descVal) continue;

        const product: Record<string, string> = { gtin: gtinVal, description: descVal };

        try {
          if (deptName) product.department_id = await resolveOrCreateLookup("departments", deptName, departments, setDepartments);
          if (cgName) product.category_group_id = await resolveOrCreateLookup("category_groups", cgName, categoryGroups, setCategoryGroups);
          if (mcName) product.merchandise_category_id = await resolveOrCreateLookup("merchandise_categories", mcName, merchandiseCategories, setMerchandiseCategories);
        } catch {
          continue;
        }

        products.push(product);
      }

      if (products.length === 0) {
        toast({ title: "Error", description: "No valid products found. Format: GTIN,Description,Department,Category Group,Merchandise Category", variant: "destructive" });
        setIsImporting(false);
        return;
      }

      // Check for duplicates within the pasted data
      const gtinCounts = new Map<string, number[]>();
      products.forEach((p, idx) => {
        const g = p.gtin;
        if (!gtinCounts.has(g)) gtinCounts.set(g, []);
        gtinCounts.get(g)!.push(idx + 1);
      });
      const internalDups = Array.from(gtinCounts.entries())
        .filter(([, rows]) => rows.length > 1)
        .map(([g, rows]) => `GTIN ${g} on rows ${rows.join(", ")}`);

      if (internalDups.length > 0) {
        toast({
          title: "Duplicates in data",
          description: internalDups.slice(0, 5).join("; ") + (internalDups.length > 5 ? `; ...and ${internalDups.length - 5} more` : ""),
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      // Check for duplicates against the database
      const gtins = products.map(p => p.gtin);
      const { data: existingProducts } = await supabase
        .from("products")
        .select("gtin")
        .in("gtin", gtins);

      if (existingProducts && existingProducts.length > 0) {
        const existingGtins = existingProducts.map(p => p.gtin);
        const dbDups = products
          .map((p, idx) => existingGtins.includes(p.gtin) ? `Row ${idx + 1}: GTIN ${p.gtin}` : null)
          .filter(Boolean);
        toast({
          title: `${existingProducts.length} duplicate(s) already in database`,
          description: dbDups.slice(0, 5).join("; ") + (dbDups.length > 5 ? `; ...and ${dbDups.length - 5} more` : ""),
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      const { error } = await supabase.from("products").insert(products);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `${products.length} products imported successfully` });
        setBulkData("");
      }
    } catch {
      toast({ title: "Error", description: "Failed to process bulk data", variant: "destructive" });
    }

    setIsImporting(false);
  };

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-extrabold text-foreground md:text-5xl">
              Admin: Import Products
            </h2>
            <p className="text-lg text-muted-foreground">
              Add products to the database by GTIN, description, and classification
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-none shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Single Product Import
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">GTIN</label>
                  <Input placeholder="Enter product GTIN" value={gtin} onChange={(e) => setGtin(e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Product Description</label>
                  <Input placeholder="Enter product description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Department</label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Category Group</label>
                  <Select value={categoryGroupId} onValueChange={setCategoryGroupId}>
                    <SelectTrigger><SelectValue placeholder="Select Category Group" /></SelectTrigger>
                    <SelectContent>
                      {categoryGroups.map(cg => <SelectItem key={cg.id} value={cg.id}>{cg.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Merchandise Category</label>
                  <Select value={merchandiseCategoryId} onValueChange={setMerchandiseCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Select Merchandise Category" /></SelectTrigger>
                    <SelectContent>
                      {merchandiseCategories.map(mc => <SelectItem key={mc.id} value={mc.id}>{mc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={importSingleProduct}>Import Product</Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Bulk Import
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Product Data</label>
                  <Textarea
                    placeholder={"Format: GTIN,Description,Department,Category Group,Merchandise Category\nOne product per line\nExample:\n1234567890123,Organic Milk 1L,Groceries,DAIRY,FRESH MILK\n9876543210987,Whole Wheat Bread,Groceries,BAKERY,BREAD"}
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enter one product per line in format: GTIN,Description,Department,Category Group,Merchandise Category
                  </p>
                </div>
                <Button className="w-full" onClick={importBulkProducts} disabled={isImporting}>
                  {isImporting ? "Importing..." : "Import All Products"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminProductImport;
