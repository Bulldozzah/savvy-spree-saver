import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AutoListCreatorProps {
  onListCreated: () => void;
  currencySymbol: string;
}

interface MatchedProduct {
  gtin: string;
  description: string;
  searchTerm: string;
}

interface UnmatchedItem {
  searchTerm: string;
}

export const AutoListCreator = ({ onListCreated, currencySymbol }: AutoListCreatorProps) => {
  const [open, setOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [items, setItems] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState<MatchedProduct[]>([]);
  const [unmatchedItems, setUnmatchedItems] = useState<UnmatchedItem[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when closing
      setStep('input');
      setMatchedProducts([]);
      setUnmatchedItems([]);
    }
  };

  const searchProducts = async () => {
    if (!listName.trim()) {
      toast.error("Please enter a list name");
      return;
    }
    if (!items.trim()) {
      toast.error("Please enter items separated by commas");
      return;
    }

    setLoading(true);
    try {
      // Parse comma-separated items
      const itemList = items
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(item => item.length > 0);

      if (itemList.length === 0) {
        toast.error("Please enter at least one item");
        setLoading(false);
        return;
      }

      const matched: MatchedProduct[] = [];
      const unmatched: UnmatchedItem[] = [];

      // Search for each item in the products table
      for (const searchTerm of itemList) {
        const { data, error } = await supabase
          .from("products")
          .select("gtin, description")
          .ilike("description", `%${searchTerm}%`)
          .limit(1);

        if (error) {
          console.error("Error searching for product:", error);
          continue;
        }

        if (data && data.length > 0) {
          // Check if this product is already matched (avoid duplicates)
          if (!matched.some(m => m.gtin === data[0].gtin)) {
            matched.push({
              gtin: data[0].gtin,
              description: data[0].description,
              searchTerm
            });
          }
        } else {
          unmatched.push({ searchTerm });
        }
      }

      setMatchedProducts(matched);
      setUnmatchedItems(unmatched);
      setStep('review');

      if (matched.length === 0) {
        toast.error("No products found matching your items");
      } else if (unmatched.length > 0) {
        toast.warning(`Found ${matched.length} products. ${unmatched.length} items not found.`);
      } else {
        toast.success(`Found ${matched.length} products!`);
      }
    } catch (error: any) {
      console.error("Error searching products:", error);
      toast.error("Failed to search products");
    } finally {
      setLoading(false);
    }
  };

  const removeMatchedProduct = (gtin: string) => {
    setMatchedProducts(prev => prev.filter(p => p.gtin !== gtin));
  };

  const handleCreateList = async () => {
    if (matchedProducts.length === 0) {
      toast.error("No products to add to list");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to create a list");
        setLoading(false);
        return;
      }

      // Create the shopping list
      const { data: listData, error: listError } = await supabase
        .from("shopping_lists")
        .insert({
          name: listName.trim(),
          user_id: user.id,
          budget: budget ? parseFloat(budget) : null
        })
        .select()
        .single();

      if (listError) throw listError;

      // Add all matched products to the list
      const listItems = matchedProducts.map(product => ({
        shopping_list_id: listData.id,
        product_gtin: product.gtin,
        quantity: 1
      }));

      const { error: itemsError } = await supabase
        .from("shopping_list_items")
        .insert(listItems);

      if (itemsError) throw itemsError;

      toast.success(`List "${listName}" created with ${matchedProducts.length} items!`);
      setOpen(false);
      setListName("");
      setItems("");
      setBudget("");
      setMatchedProducts([]);
      setUnmatchedItems([]);
      setStep('input');
      onListCreated();
    } catch (error: any) {
      console.error("Error creating list:", error);
      toast.error(error.message || "Failed to create list");
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
          <DialogTitle>Create Auto List</DialogTitle>
          <DialogDescription>
            Enter items separated by commas and we'll find matching products for your list.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          {step === 'input' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="listName">List Name *</Label>
                <Input
                  id="listName"
                  placeholder="e.g., Weekly Groceries"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="items">Items (comma separated) *</Label>
                <Textarea
                  id="items"
                  placeholder="e.g., milk, bread, beans, sugar, salt, eggs"
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter item names separated by commas. We'll search for matching products.
                </p>
              </div>

              <div>
                <Label htmlFor="budget">Budget ({currencySymbol}) - Optional</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g., 500"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Matched Products ({matchedProducts.length})
                </h3>
                {matchedProducts.length > 0 ? (
                  <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                    {matchedProducts.map((product) => (
                      <div key={product.gtin} className="flex items-center justify-between p-2 hover:bg-accent/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Matched: "{product.searchTerm}"
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMatchedProduct(product.gtin)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No products matched</p>
                )}
              </div>

              {unmatchedItems.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Not Found ({unmatchedItems.length})
                  </h3>
                  <div className="border rounded-md p-2 bg-destructive/5">
                    <p className="text-sm text-muted-foreground">
                      {unmatchedItems.map(item => item.searchTerm).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {step === 'input' ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={searchProducts} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Find Products
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('input')} disabled={loading}>
                Back
              </Button>
              <Button onClick={handleCreateList} disabled={loading || matchedProducts.length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  `Create List (${matchedProducts.length} items)`
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
