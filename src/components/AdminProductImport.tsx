import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminProductImport = () => {
  const [gtin, setGtin] = useState("");
  const [description, setDescription] = useState("");
  const [bulkData, setBulkData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const importSingleProduct = async () => {
    if (!gtin.trim() || !description.trim()) {
      toast({
        title: "Error",
        description: "Please enter both GTIN and description",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("products")
      .insert({ gtin: gtin.trim(), description: description.trim() });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Product imported successfully",
      });
      setGtin("");
      setDescription("");
    }
  };

  const importBulkProducts = async () => {
    if (!bulkData.trim()) {
      toast({
        title: "Error",
        description: "Please enter product data",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    const lines = bulkData.split("\n");
    const products = lines
      .map((line) => {
        const [gtin, description] = line.split(",").map((s) => s.trim());
        if (gtin && description) {
          return { gtin, description };
        }
        return null;
      })
      .filter(Boolean);

    if (products.length === 0) {
      toast({
        title: "Error",
        description: "No valid products found. Format: GTIN,Description (one per line)",
        variant: "destructive",
      });
      setIsImporting(false);
      return;
    }

    const { error } = await supabase.from("products").insert(products);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `${products.length} products imported successfully`,
      });
      setBulkData("");
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
              Add products to the database by GTIN and description
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
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    GTIN
                  </label>
                  <Input
                    placeholder="Enter product GTIN"
                    value={gtin}
                    onChange={(e) => setGtin(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Product Description
                  </label>
                  <Input
                    placeholder="Enter product description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={importSingleProduct}
                >
                  Import Product
                </Button>
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
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Product Data
                  </label>
                  <Textarea
                    placeholder="Format: GTIN,Description&#10;One product per line&#10;Example:&#10;1234567890123,Organic Milk 1L&#10;9876543210987,Whole Wheat Bread"
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enter one product per line in format: GTIN,Description
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={importBulkProducts}
                  disabled={isImporting}
                >
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
