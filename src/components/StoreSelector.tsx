import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Store } from "lucide-react";

interface StoreSelectorProps {
  onStoreSelected: (store: any) => void;
  selectedStore?: any;
  buttonText?: string;
}

export const StoreSelector = ({ onStoreSelected, selectedStore, buttonText = "Find Store" }: StoreSelectorProps) => {
  const [stores, setStores] = useState<any[]>([]);
  const [filteredStores, setFilteredStores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

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
    onStoreSelected(store);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Store className="h-4 w-4 mr-2" />
          {selectedStore ? (
            <span className="truncate">
              {selectedStore.store_hq?.name} - {selectedStore.location}
            </span>
          ) : buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select a Store to Shop</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search by store name or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {filteredStores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No stores found
              </p>
            ) : (
              filteredStores.map((store) => (
                <Card 
                  key={store.id} 
                  className={`cursor-pointer transition-all hover:bg-accent hover:border-primary ${
                    selectedStore?.id === store.id ? "border-primary bg-accent/50" : ""
                  }`}
                  onClick={() => handleStoreSelect(store)}
                >
                  <CardContent className="p-4">
                    <p className="font-semibold">{store.store_hq?.name}</p>
                    <p className="text-sm text-muted-foreground">{store.location}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
