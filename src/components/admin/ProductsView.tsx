import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { z } from "zod";
import AdminProductImport from "@/components/AdminProductImport";

const productSchema = z.object({
  gtin: z.string().trim().regex(/^\d{8,14}$/, "GTIN must be 8-14 digits"),
  description: z.string().trim().min(1, "Description is required").max(500, "Description must be less than 500 characters")
});

export function ProductsView() {
  const { toast } = useToast();
  const [gtin, setGtin] = useState("");
  const [description, setDescription] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

  const createProduct = async () => {
    const result = productSchema.safeParse({ gtin, description });
    if (!result.success) {
      toast({ title: "Validation Error", description: result.error.issues[0].message, variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("products").insert({
      gtin: result.data.gtin,
      description: result.data.description,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Product created" });
      setGtin("");
      setDescription("");
    }
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
        const [gtinVal, descVal] = parts;

        if (!gtinVal || !descVal) {
          validationErrors.push(`Line ${i + 1}: Missing GTIN or description`);
          continue;
        }

        const result = productSchema.safeParse({ gtin: gtinVal, description: descVal });
        if (!result.success) {
          validationErrors.push(`Line ${i + 1}: ${result.error.issues[0].message}`);
          continue;
        }

        products.push({
          gtin: result.data.gtin,
          description: result.data.description,
        });
      }

      if (validationErrors.length > 0) {
        toast({ title: "Validation Errors", description: validationErrors.slice(0, 3).join("; "), variant: "destructive" });
        setIsUploadingCsv(false);
        return;
      }

      if (products.length === 0) {
        toast({ title: "Error", description: "No valid products found. Format: GTIN,Description", variant: "destructive" });
        setIsUploadingCsv(false);
        return;
      }

      // Check for duplicates within the CSV itself
      const gtinCounts = new Map<string, number[]>();
      products.forEach((p, idx) => {
        const g = p.gtin;
        if (!gtinCounts.has(g)) gtinCounts.set(g, []);
        gtinCounts.get(g)!.push(idx + startIndex + 1);
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
          <Button onClick={createProduct}>Create Product</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Products (CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with format: GTIN,Description
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
