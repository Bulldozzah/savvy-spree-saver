import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AutoListCreatorProps {
  onListCreated: () => void;
  currencySymbol: string;
}

interface Store {
  id: string;
  location: string;
  hq_id: string;
}

export const AutoListCreator = ({ onListCreated, currencySymbol }: AutoListCreatorProps) => {
  const [open, setOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [items, setItems] = useState("");
  const [budget, setBudget] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);

  const loadStores = async () => {
    setLoadingStores(true);
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, location, hq_id")
        .order("location");

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error loading stores:", error);
      toast.error("Failed to load stores");
    } finally {
      setLoadingStores(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && stores.length === 0) {
      loadStores();
    }
  };

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId);
      } else if (prev.length < 5) {
        return [...prev, storeId];
      } else {
        toast.error("You can select up to 5 stores");
        return prev;
      }
    });
  };

  const handleCreateAutoList = async () => {
    if (!listName.trim()) {
      toast.error("Please enter a list name");
      return;
    }
    if (!items.trim()) {
      toast.error("Please enter items you want");
      return;
    }
    if (!budget || parseFloat(budget) <= 0) {
      toast.error("Please enter a valid budget");
      return;
    }
    if (selectedStores.length === 0) {
      toast.error("Please select at least one store");
      return;
    }

    setLoading(true);
    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error("You must be logged in to create an auto list");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-auto-list", {
        body: {
          listName: listName.trim(),
          items: items.trim(),
          budget: parseFloat(budget),
          storeIds: selectedStores,
          currencySymbol
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Auto list created successfully!");
      setOpen(false);
      setListName("");
      setItems("");
      setBudget("");
      setSelectedStores([]);
      onListCreated();
    } catch (error: any) {
      console.error("Error creating auto list:", error);
      toast.error(error.message || "Failed to create auto list");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Create Auto List
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Auto List with AI</DialogTitle>
          <DialogDescription>
            Tell us what items you need and your budget. AI will create an optimized shopping list from your selected stores.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="listName">List Name</Label>
              <Input
                id="listName"
                placeholder="e.g., Weekly Groceries"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="items">Items You Want</Label>
              <Textarea
                id="items"
                placeholder="Enter items separated by commas (e.g., washing powder, sugar, salt, bathing soap)"
                value={items}
                onChange={(e) => setItems(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="budget">Budget ({currencySymbol})</Label>
              <Input
                id="budget"
                type="number"
                placeholder="500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label>Select Stores (up to 5)</Label>
              {loadingStores ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                  {stores.map((store) => (
                    <div key={store.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={store.id}
                        checked={selectedStores.includes(store.id)}
                        onCheckedChange={() => toggleStore(store.id)}
                      />
                      <label
                        htmlFor={store.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {store.location}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {selectedStores.length}/5
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateAutoList} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Create List
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
