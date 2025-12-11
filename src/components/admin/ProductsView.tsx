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
      toast({ 
        title: "Validation Error", 
        description: result.error.issues[0].message, 
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase.from("products").insert({ 
      gtin: result.data.gtin, 
      description: result.data.description 
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
      
      const products: Array<{ gtin: string; description: string }> = [];
      const validationErrors: string[] = [];
      
      lines.slice(startIndex).forEach((line, idx) => {
        const [gtin, description] = line.split(",").map((s) => s.trim());
        if (!gtin || !description) {
          validationErrors.push(`Line ${startIndex + idx + 1}: Missing GTIN or description`);
          return;
        }
        
        const result = productSchema.safeParse({ gtin, description });
        if (!result.success) {
          validationErrors.push(`Line ${startIndex + idx + 1}: ${result.error.issues[0].message}`);
          return;
        }
        products.push({ gtin: result.data.gtin, description: result.data.description });
      });

      if (validationErrors.length > 0) {
        toast({
          title: "Validation Errors",
          description: validationErrors.join("; "),
          variant: "destructive",
        });
        setIsUploadingCsv(false);
        return;
      }

      if (products.length === 0) {
        toast({
          title: "Error",
          description: "No valid products found. Format: GTIN,Description",
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
          <Input
            placeholder="GTIN (8-14 digits)"
            value={gtin}
            onChange={(e) => setGtin(e.target.value)}
          />
          <Input
            placeholder="Product Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
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
          <Input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
          />
          <Button 
            onClick={handleCsvUpload} 
            disabled={isUploadingCsv}
          >
            {isUploadingCsv ? "Uploading..." : "Upload CSV"}
          </Button>
        </CardContent>
      </Card>

      <AdminProductImport />
    </div>
  );
}
