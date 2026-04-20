import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, CheckCircle2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MultiStorePriceComparisonProps {
  listItems: any[];
  currencySymbol: string;
  shoppingLists: any[];
  selectedListId: string;
  onShoppingListChange: (listId: string) => void;
}

export const MultiStorePriceComparison = ({ 
  listItems, 
  currencySymbol, 
  shoppingLists, 
  selectedListId, 
  onShoppingListChange 
}: MultiStorePriceComparisonProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [filteredStores, setFilteredStores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStores, setSelectedStores] = useState<any[]>([]);
  const [comparisonResults, setComparisonResults] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    if (open) {
      loadStores();
    }
  }, [open]);

  useEffect(() => {
    filterStores();
  }, [searchTerm, stores]);

  const loadStores = async () => {
    const { data } = await supabase
      .from("stores_public")
      .select("*, store_hq(name)")
      .order("location");
    setStores(data || []);
    setFilteredStores(data || []);
  };

  const filterStores = () => {
    if (!searchTerm.trim()) {
      setFilteredStores(stores);
      return;
    }

    const filtered = stores.filter((store) => {
      const storeName = store.store_hq?.name?.toLowerCase() || "";
      const location = store.location?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return storeName.includes(search) || location.includes(search);
    });

    setFilteredStores(filtered);
  };

  const handleStoreSelect = (store: any) => {
    if (selectedStores.find(s => s.id === store.id)) {
      setSelectedStores(selectedStores.filter(s => s.id !== store.id));
    } else if (selectedStores.length < 5) {
      setSelectedStores([...selectedStores, store]);
    } else {
      toast({ 
        title: "Maximum reached", 
        description: "You can only select up to 5 stores at a time",
        variant: "destructive"
      });
    }
  };

  const handleCompare = async () => {
    if (selectedStores.length === 0) {
      toast({ 
        title: "No stores selected", 
        description: "Please select at least one store to compare",
        variant: "destructive"
      });
      return;
    }

    if (listItems.length === 0) {
      toast({ 
        title: "Empty list", 
        description: "Your shopping list is empty",
        variant: "destructive"
      });
      return;
    }

    setIsComparing(true);
    const gtins = listItems.map(item => item.product_gtin);

    try {
      const results = await Promise.all(
        selectedStores.map(async (store) => {
          const { data: prices } = await supabase
            .from("store_prices")
            .select("product_gtin, price, in_stock")
            .eq("store_id", store.id)
            .in("product_gtin", gtins);

          let totalAll = 0;
          let totalInStock = 0;
          let inStockCount = 0;
          let outOfStockCount = 0;

          listItems.forEach(item => {
            const price = prices?.find(p => p.product_gtin === item.product_gtin);
            if (price) {
              const itemTotal = Number(price.price) * item.quantity;
              totalAll += itemTotal;
              
              if (price.in_stock) {
                totalInStock += itemTotal;
                inStockCount++;
              } else {
                outOfStockCount++;
              }
            }
          });

          return {
            store,
            totalAll,
            totalInStock,
            inStockCount,
            outOfStockCount,
            totalItems: listItems.length
          };
        })
      );

      // Sort by cheapest in-stock total
      const sortedResults = results.sort((a, b) => a.totalInStock - b.totalInStock);
      setComparisonResults(sortedResults);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to compare prices",
        variant: "destructive"
      });
    } finally {
      setIsComparing(false);
    }
  };

  const handleReset = () => {
    setSelectedStores([]);
    setComparisonResults([]);
    setSearchTerm("");
  };

  const isStoreSelected = (storeId: string) => {
    return selectedStores.find(s => s.id === storeId);
  };

  const getStoreNumber = (storeId: string) => {
    const index = selectedStores.findIndex(s => s.id === storeId);
    return index !== -1 ? index + 1 : null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full flex items-center justify-center">
          <Store className="mr-2 h-5 w-5" />
          Check Multiple Stores
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Prices Across Multiple Stores</DialogTitle>
        </DialogHeader>

        {comparisonResults.length === 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Select up to 5 stores ({selectedStores.length}/5 selected)
              </p>
              {selectedStores.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Clear Selection
                </Button>
              )}
            </div>

            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <p className="font-semibold mb-2">Selected Stores:</p>
                {selectedStores.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStores.map((store, index) => (
                      <div 
                        key={store.id}
                        className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2"
                      >
                        <span className="font-bold text-primary">{index + 1}</span>
                        <div>
                          <p className="text-sm font-semibold">{store.store_hq?.name}</p>
                          <p className="text-xs text-muted-foreground">{store.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No stores selected yet. Select stores from the list below.</p>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Select value={selectedListId} onValueChange={onShoppingListChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Pick my shopping list" />
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
                onClick={handleCompare} 
                disabled={selectedStores.length === 0 || isComparing || !selectedListId}
                className="flex-1"
              >
                {isComparing ? "Comparing..." : "Compare"}
              </Button>
            </div>

            <Input
              placeholder="Search by store name or area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {filteredStores.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No stores found
                </p>
              ) : (
                filteredStores.map((store) => {
                  const selected = isStoreSelected(store.id);
                  const storeNumber = getStoreNumber(store.id);
                  
                  return (
                    <Card 
                      key={store.id} 
                      className={`cursor-pointer transition-all hover:bg-accent hover:border-primary ${
                        selected ? "border-primary bg-accent/50" : ""
                      }`}
                      onClick={() => handleStoreSelect(store)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{store.store_hq?.name}</p>
                          <p className="text-sm text-muted-foreground">{store.location}</p>
                        </div>
                        {selected && (
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold text-2xl text-primary">{storeNumber}</span>
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-lg">Comparison Results</p>
              <Button variant="outline" onClick={handleReset}>
                New Comparison
              </Button>
            </div>

            <div className="space-y-3">
              {comparisonResults.map((result, index) => (
                <Card 
                  key={result.store.id}
                  className={index === 0 ? "border-2 border-green-500 bg-green-50 dark:bg-green-950" : ""}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">#{index + 1}</span>
                        <div>
                          <p>{result.store.store_hq?.name}</p>
                          <p className="text-sm font-normal text-muted-foreground">{result.store.location}</p>
                        </div>
                      </div>
                      {index === 0 && (
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          Cheapest!
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total (All Items)</p>
                        <p className="text-xl font-bold">{currencySymbol}{result.totalAll.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total (In-Stock)</p>
                        <p className="text-xl font-bold text-green-600">{currencySymbol}{result.totalInStock.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">In Stock</p>
                          <p className="text-lg font-semibold">{result.inStockCount}/{result.totalItems}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Out of Stock</p>
                          <p className="text-lg font-semibold">{result.outOfStockCount}/{result.totalItems}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
