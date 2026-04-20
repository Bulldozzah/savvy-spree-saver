import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  gtin: string;
  description: string;
}

interface ListItem {
  product: Product;
  quantity: number;
}

const CreateShoppingList = () => {
  const [listName, setListName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchProducts = async (term: string) => {
    if (!term || term.length < 2) {
      setProducts([]);
      return;
    }

    setIsSearching(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`gtin.ilike.%${term}%,description.ilike.%${term}%`)
      .limit(10);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to search products",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setIsSearching(false);
  };

  const addToList = (product: Product) => {
    const existing = listItems.find((item) => item.product.gtin === product.gtin);
    if (existing) {
      setListItems(
        listItems.map((item) =>
          item.product.gtin === product.gtin
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setListItems([...listItems, { product, quantity: 1 }]);
    }
    setSearchTerm("");
    setProducts([]);
  };

  const removeFromList = (gtin: string) => {
    setListItems(listItems.filter((item) => item.product.gtin !== gtin));
  };

  const updateQuantity = (gtin: string, quantity: number) => {
    if (quantity < 1) return;
    setListItems(
      listItems.map((item) =>
        item.product.gtin === gtin ? { ...item, quantity } : item
      )
    );
  };

  const saveShoppingList = async () => {
    if (!listName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a list name",
        variant: "destructive",
      });
      return;
    }

    if (listItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to your list",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a shopping list",
        variant: "destructive",
      });
      return;
    }

    const { data: list, error: listError } = await supabase
      .from("shopping_lists")
      .insert({ name: listName, user_id: user.id })
      .select()
      .single();

    if (listError) {
      toast({
        title: "Error",
        description: "Failed to create shopping list",
        variant: "destructive",
      });
      return;
    }

    const items = listItems.map((item) => ({
      shopping_list_id: list.id,
      product_gtin: item.product.gtin,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("shopping_list_items")
      .insert(items);

    if (itemsError) {
      toast({
        title: "Error",
        description: "Failed to add items to list",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Shopping list created successfully!",
    });

    setListName("");
    setListItems([]);
  };

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-extrabold text-foreground md:text-5xl">
              Create Your Shopping List
            </h2>
            <p className="text-lg text-muted-foreground">
              Search products and build your personalized shopping list
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-none shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Search Products</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search by name or barcode..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchProducts(e.target.value);
                  }}
                  className="mb-4"
                />

                {isSearching && (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                )}

                <div className="space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.gtin}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div>
                        <div className="font-medium text-foreground">
                          {product.description}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            barcode: {product.gtin}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToList(product)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Your List</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="List name..."
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="mb-4"
                />

                <div className="space-y-3 mb-6">
                  {listItems.map((item) => (
                    <div
                      key={item.product.gtin}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {item.product.description}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            barcode: {item.product.gtin}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.product.gtin,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-16"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromList(item.product.gtin)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {listItems.length > 0 && (
                  <Button
                    className="w-full"
                    onClick={saveShoppingList}
                  >
                    Save Shopping List
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateShoppingList;
