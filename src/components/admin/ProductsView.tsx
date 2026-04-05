import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { z } from "zod";
import AdminProductImport from "@/components/AdminProductImport";

const productSchema = z.object({
  gtin: z.string().trim().regex(/^\d{8,14}$/, "GTIN must be 8-14 digits"),
  description: z.string().trim().min(1, "Description is required").max(500, "Description must be less than 500 characters")
});

type LookupItem = { id: string; name: string };

export function ProductsView() {
  const { toast } = useToast();
  const [gtin, setGtin] = useState("");
  const [description, setDescription] = useState("");
  const [categoryGroupId, setCategoryGroupId] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

  const [categoryGroups, setCategoryGroups] = useState<LookupItem[]>([]);

  useEffect(() => {
    const fetchLookups = async () => {
      const { data } = await supabase.from("category_groups").select("id, name").order("name");
      if (data) setCategoryGroups(data as LookupItem[]);
    };
    fetchLookups();
  }, []);

  const createProduct = async () => {
    const result = productSchema.safeParse({ gtin, description });
    if (!result.success) {
      toast({ title: "Validation Error", description: result.error.issues[0].message, variant: "destructive" });
      return;
    }

    const productData: Record<string, string> = {
      gtin: result.data.gtin,
      description: result.data.description,
    };
    if (categoryGroupId) productData.category_group_id = categoryGroupId;

    const { error } = await supabase.from("products").insert(productData);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Product created" });
      setGtin("");
      setDescription("");
      setCategoryGroupId("");
    }
  };

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
      // Try fetching in case of race condition / unique constraint
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

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast({ title: "Error", description: "Please select a CSV file", variant: "destructive" });
      return;
    }

    setIsUploadingCsv(true);

    try {
      const text = await csvFile.text();
      const lines = text.split("\n").filter(line => line.trim());
      const startIndex = lines[0].toLowerCase().includes("gtin") ? 1 : 0;

      const products: Array<Record<string, string>> = [];
      const validationErrors: string[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(",").map(s => s.trim());
        const [gtinVal, descVal, deptName, cgName, mcName] = parts;

        if (!gtinVal || !descVal) {
          validationErrors.push(`Line ${i + 1}: Missing GTIN or description`);
          continue;
        }

        const result = productSchema.safeParse({ gtin: gtinVal, description: descVal });
        if (!result.success) {
          validationErrors.push(`Line ${i + 1}: ${result.error.issues[0].message}`);
          continue;
        }

        const product: Record<string, string> = {
          gtin: result.data.gtin,
          description: result.data.description,
        };

        try {
          if (deptName) product.department_id = await resolveOrCreateLookup("departments", deptName, departments, setDepartments);
          if (cgName) product.category_group_id = await resolveOrCreateLookup("category_groups", cgName, categoryGroups, setCategoryGroups);
          if (mcName) product.merchandise_category_id = await resolveOrCreateLookup("merchandise_categories", mcName, merchandiseCategories, setMerchandiseCategories);
        } catch (err: any) {
          validationErrors.push(`Line ${i + 1}: ${err.message}`);
          continue;
        }

        products.push(product);
      }

      if (validationErrors.length > 0) {
        toast({ title: "Validation Errors", description: validationErrors.slice(0, 3).join("; "), variant: "destructive" });
        setIsUploadingCsv(false);
        return;
      }

      if (products.length === 0) {
        toast({ title: "Error", description: "No valid products found. Format: GTIN,Description,Department,Category Group,Merchandise Category", variant: "destructive" });
        setIsUploadingCsv(false);
        return;
      }

      // Check for duplicates within the CSV itself
      const gtinCounts = new Map<string, number[]>();
      products.forEach((p, idx) => {
        const g = p.gtin;
        if (!gtinCounts.has(g)) gtinCounts.set(g, []);
        gtinCounts.get(g)!.push(idx + startIndex + 1); // 1-based line numbers
      });
      const csvDuplicates = Array.from(gtinCounts.entries())
        .filter(([, lines]) => lines.length > 1)
        .map(([g, lines]) => `GTIN ${g} on lines ${lines.join(", ")}`);

      if (csvDuplicates.length > 0) {
        toast({
          title: "Duplicates in CSV",
          description: csvDuplicates.slice(0, 5).join("; ") + (csvDuplicates.length > 5 ? `; ...and ${csvDuplicates.length - 5} more` : ""),
          variant: "destructive",
        });
        setIsUploadingCsv(false);
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
        const dbDupLines = products
          .map((p, idx) => existingGtins.includes(p.gtin) ? `Line ${idx + startIndex + 1}: GTIN ${p.gtin}` : null)
          .filter(Boolean);
        toast({
          title: `${existingProducts.length} duplicate(s) already in database`,
          description: dbDupLines.slice(0, 5).join("; ") + (dbDupLines.length > 5 ? `; ...and ${dbDupLines.length - 5} more` : ""),
          variant: "destructive",
        });
        setIsUploadingCsv(false);
        return;
      }

      const { error } = await supabase.from("products").insert(products);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `${products.length} products imported successfully` });
        setCsvFile(null);
        const fileInput = document.getElementById("csv-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to parse CSV file", variant: "destructive" });
    }

    setIsUploadingCsv(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Product
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="GTIN (8-14 digits)" value={gtin} onChange={(e) => setGtin(e.target.value)} />
          <Input placeholder="Product Description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
            <SelectContent>
              {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={categoryGroupId} onValueChange={setCategoryGroupId}>
            <SelectTrigger><SelectValue placeholder="Select Category Group" /></SelectTrigger>
            <SelectContent>
              {categoryGroups.map(cg => <SelectItem key={cg.id} value={cg.id}>{cg.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={merchandiseCategoryId} onValueChange={setMerchandiseCategoryId}>
            <SelectTrigger><SelectValue placeholder="Select Merchandise Category" /></SelectTrigger>
            <SelectContent>
              {merchandiseCategories.map(mc => <SelectItem key={mc.id} value={mc.id}>{mc.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button onClick={createProduct}>Create Product</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Products (CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with format: GTIN,Description,Department,Category Group,Merchandise Category
          </p>
          <Input id="csv-upload" type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
          <Button onClick={handleCsvUpload} disabled={isUploadingCsv}>
            {isUploadingCsv ? "Uploading..." : "Upload CSV"}
          </Button>
        </CardContent>
      </Card>

      <AdminProductImport />
    </div>
  );
}
