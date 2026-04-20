import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sparkles, Loader2, ArrowRight, Check } from "lucide-react";

interface BudgetAISuggestionsProps {
  listId: string;
  budget: number;
  currencySymbol: string;
  onListUpdated: () => void;
}

export const BudgetAISuggestions = ({
  listId,
  budget,
  currencySymbol,
  onListUpdated,
}: BudgetAISuggestionsProps) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const getSuggestions = async () => {
    setLoading(true);
    setSuggestions(null);
    
    try {
      // Load the list items first
      const { data: items, error: itemsError } = await supabase
        .from("shopping_list_items")
        .select("*, products(description)")
        .eq("shopping_list_id", listId);

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) {
        toast({
          title: "No items",
          description: "Add items to your list first before getting suggestions.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('suggest-budget-alternatives', {
        body: {
          listItems: items.map(item => ({
            product: {
              gtin: item.product_gtin,
              description: item.products?.description || 'Unknown Product'
            },
            quantity: item.quantity
          })),
          budget,
          currencySymbol
        }
      });

      if (error) throw error;

      setSuggestions(data);
      setDialogOpen(true);
    } catch (error: any) {
      console.error('Error getting AI suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applySuggestions = async () => {
    if (!suggestions) return;

    setConfirmOpen(false);
    setLoading(true);

    try {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('shopping_list_id', listId);

      if (deleteError) throw deleteError;

      // Insert new suggested items
      const { error: insertError } = await supabase
        .from('shopping_list_items')
        .insert(
          suggestions.suggestedList.map((item: any) => ({
            shopping_list_id: listId,
            product_gtin: item.gtin,
            quantity: item.quantity
          }))
        );

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: `List updated with AI suggestions. Saved ${currencySymbol}${suggestions.savings}!`,
      });

      setDialogOpen(false);
      onListUpdated();
    } catch (error: any) {
      console.error('Error applying suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to update list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={getSuggestions}
        disabled={loading}
        size="sm"
        variant="outline"
        className="gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            AI Optimizer
          </>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Budget Suggestions
            </DialogTitle>
          </DialogHeader>

          {suggestions && (
            <div className="space-y-6">
              {/* Savings Summary */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Total</p>
                      <p className="text-2xl font-bold">{currencySymbol}{suggestions.currentTotal}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Suggested Total</p>
                      <p className="text-2xl font-bold text-green-600">{currencySymbol}{suggestions.suggestedTotal}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Savings</p>
                      <p className="text-2xl font-bold text-green-600">-{currencySymbol}{suggestions.savings}</p>
                    </div>
                  </div>
                  {Number(suggestions.suggestedTotal) <= budget && (
                    <p className="text-center mt-4 text-green-600 font-medium flex items-center justify-center gap-2">
                      <Check className="h-5 w-5" />
                      Within your budget of {currencySymbol}{budget.toFixed(2)}!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Side by Side Comparison */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Current List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {suggestions.currentList.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="font-medium text-sm">{item.description}</p>
                          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                            <span>Qty: {item.quantity}</span>
                            <span>{currencySymbol}{(Number(item.avgPrice) * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Suggested List */}
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Suggested Alternatives
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {suggestions.suggestedList.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg bg-primary/5">
                          <p className="font-medium text-sm">{item.description}</p>
                          <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                            <span>Qty: {item.quantity}</span>
                            <span className="text-green-600 font-medium">
                              {currencySymbol}{(Number(item.avgPrice) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          {item.reason && (
                            <p className="text-xs text-primary mt-2 italic">{item.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Button */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Keep Current List
                </Button>
                <Button onClick={() => setConfirmOpen(true)} className="gap-2">
                  Apply Suggestions
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your shopping list?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all items in your current list with the AI-suggested alternatives.
              You'll save {currencySymbol}{suggestions?.savings} and stay within your budget.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applySuggestions} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Yes, Update List'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};