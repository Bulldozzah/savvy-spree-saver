import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Search } from "lucide-react";

export const AdPromotionManager = () => {
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [promotionalPrice, setPromotionalPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadPromotions();
    loadStores();
  }, []);

  const loadPromotions = async () => {
    const { data } = await supabase
      .from("ad_promotions")
      .select("*, stores(location, store_hq(name)), products(description)")
      .order("display_order", { ascending: true });
    setPromotions(data || []);
  };

  const loadStores = async () => {
    const { data } = await supabase
      .from("stores")
      .select("id, location, store_hq(name)");
    setStores(data || []);
  };

  const searchProducts = async (term: string) => {
    setProductSearch(term);
    
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`gtin.ilike.%${term}%,description.ilike.%${term}%`)
      .limit(10);

    if (error) {
      toast({ title: "Error", description: "Failed to search products", variant: "destructive" });
      setSearchResults([]);
    } else {
      setSearchResults(data || []);
    }
    setIsSearching(false);
  };

  const selectProduct = (product: any) => {
    setSelectedProduct(product);
    setProductSearch("");
    setSearchResults([]);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `promotions/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("advertisements")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Error", description: uploadError.message, variant: "destructive" });
      return null;
    }

    const { data } = supabase.storage.from("advertisements").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const createPromotion = async () => {
    if (!selectedStore || !selectedProduct?.gtin || !promotionalPrice) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    let imageUrl = null;
    
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) {
        setIsUploading(false);
        return;
      }
    }

    const { error } = await supabase.from("ad_promotions").insert({
      store_id: selectedStore,
      product_gtin: selectedProduct.gtin,
      promotional_price: parseFloat(promotionalPrice),
      image_url: imageUrl,
      display_order: displayOrder,
      is_active: true,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Promotion created" });
      setSelectedStore("");
      setSelectedProduct("");
      setPromotionalPrice("");
      setImageFile(null);
      setDisplayOrder(0);
      loadPromotions();
    }
    setIsUploading(false);
  };

  const togglePromotion = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("ad_promotions")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Promotion ${!isActive ? "activated" : "deactivated"}` });
      loadPromotions();
    }
  };

  const deletePromotion = async (id: string) => {
    const { error } = await supabase.from("ad_promotions").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Promotion deleted" });
      loadPromotions();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Promotional Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Store</Label>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.store_hq?.name} - {store.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Product</Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, description, or barcode..."
                  value={productSearch}
                  onChange={(e) => searchProducts(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {selectedProduct && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{selectedProduct.description}</p>
                        <p className="text-sm text-muted-foreground">GTIN: {selectedProduct.gtin}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedProduct(null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isSearching && productSearch.length >= 2 && (
                <Card>
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  </CardContent>
                </Card>
              )}

              {!isSearching && searchResults.length > 0 && (
                <Card className="max-h-60 overflow-y-auto">
                  <CardContent className="p-0">
                    {searchResults.map((product) => (
                      <div
                        key={product.gtin}
                        className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                        onClick={() => selectProduct(product)}
                      >
                        <div>
                          <p className="font-medium">{product.description}</p>
                          <p className="text-sm text-muted-foreground">GTIN: {product.gtin}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          Select
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {!isSearching && productSearch.length >= 2 && searchResults.length === 0 && (
                <Card>
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">No products found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <div>
            <Label>Promotional Price</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="9.99"
              value={promotionalPrice}
              onChange={(e) => setPromotionalPrice(e.target.value)}
            />
          </div>
          <div>
            <Label>Display Order</Label>
            <Input
              type="number"
              placeholder="0"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Product Image (Optional)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button onClick={createPromotion} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Create Promotion"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No promotions found</p>
          ) : (
            <div className="space-y-4">
              {promotions.map((promo) => (
                <div key={promo.id} className="border rounded p-4 flex items-center gap-4">
                  {promo.image_url && (
                    <img src={promo.image_url} alt={promo.products?.description} className="w-24 h-24 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{promo.products?.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {promo.stores?.store_hq?.name} - {promo.stores?.location}
                    </p>
                    <p className="text-lg font-bold text-primary">${promo.promotional_price}</p>
                    <p className="text-xs text-muted-foreground">Order: {promo.display_order}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={promo.is_active}
                      onCheckedChange={() => togglePromotion(promo.id, promo.is_active)}
                    />
                    <Label>{promo.is_active ? "Active" : "Inactive"}</Label>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deletePromotion(promo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
