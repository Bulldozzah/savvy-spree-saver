import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ListPlus } from "lucide-react";

const ShoppingListCreator = () => {
  const [listName, setListName] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create shopping lists",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("shopping_lists")
        .insert([{ 
          name: listName, 
          user_id: user.id,
          budget: budget ? parseFloat(budget) : null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shopping list created successfully",
      });
      
      setListName("");
      setBudget("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListPlus className="h-5 w-5 text-primary" />
          Create Shopping List
        </CardTitle>
        <CardDescription>
          Start a new shopping list to organize your purchases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="listName">List Name</Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g., Weekly Groceries"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (Optional)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g., 150.00"
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create List"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShoppingListCreator;
