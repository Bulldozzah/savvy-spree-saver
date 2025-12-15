import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/neon-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { HoverButton } from "@/components/ui/hover-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, TrendingDown, User, ListChecks, ChevronDown, Store, MessageSquare, Search, LogOut, Share, DollarSign, Eye, CheckCircle2, XCircle, Trash2, Link2, Plus, Minus } from "lucide-react";
import { debounce } from "lodash";
import { ProfileEditor } from "@/components/ProfileEditor";
import { StoreSelector } from "@/components/StoreSelector";
import { ShoppingListManager } from "@/components/ShoppingListManager";
import { StoreFeedbackForm } from "@/components/StoreFeedbackForm";
import { MultiStorePriceComparison } from "@/components/MultiStorePriceComparison";
import { BudgetAISuggestions } from "@/components/BudgetAISuggestions";
import FloatingActionMenu from "@/components/ui/floating-action-menu";
import { AutoListCreator } from "@/components/AutoListCreator";
import { AnimatedButton } from "@/components/ui/animated-button";
import { countries } from "@/data/countries";
import { cn } from "@/lib/utils";
import { SmartShopperLayout } from "@/components/SmartShopperSidebar";

const ShopperDashboard = () => {
  const { toast } = useToast();
  
  // State management
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [compareStores, setCompareStores] = useState<string[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [listItems, setListItems] = useState<any[]>([]);
  const [newListName, setNewListName] = useState("");
  const [newListBudget, setNewListBudget] = useState("");
  const [editingBudget, setEditingBudget] = useState<Record<string, string>>({});
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [stockInfo, setStockInfo] = useState<Record<string, any[]>>({});
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [storePrices, setStorePrices] = useState<Record<string, any>>({});
  const [listManagerOpen, setListManagerOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [listItemsExpanded, setListItemsExpanded] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [storeDialogOpen, setStoreDialogOpen] = useState<number | null>(null);
  const [storeSearchTerm, setStoreSearchTerm] = useState("");
  const [listAssignedStores, setListAssignedStores] = useState<Record<string, any>>({});
  const [listTotals, setListTotals] = useState<Record<string, number | { inStock: number; all: number }>>({});
  const [activeSection, setActiveSection] = useState<number>(0);
  const [listItemsWithPrices, setListItemsWithPrices] = useState<any[]>([]);
  const [viewListDialogOpen, setViewListDialogOpen] = useState(false);
  const [viewingListId, setViewingListId] = useState<string>("");

  useEffect(() => {
    loadStores();
    loadShoppingLists();
    loadUserProfile();
    searchProducts("");
  }, []);

  // Auto-load prices when store or list items change
  useEffect(() => {
    if (selectedStore && listItems.length > 0) {
      const gtins = listItems.map(item => item.product_gtin);
      loadStorePrices(gtins);
    }
  }, [selectedStore, listItems]);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setUserProfile(data);
      if (data.currency) {
        const country = countries.find(c => c.currencyCode === data.currency);
        if (country) {
          setCurrencySymbol(country.currencySymbol);
        }
      }
      if (data.display_name) {
        setDisplayName(data.display_name);
      }
    }
  };

  const loadShoppingLists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    setShoppingLists(data || []);

    // Load assigned store info and calculate totals for each list
    if (data && data.length > 0) {
      const storesMap: Record<string, any> = {};
      const totalsMap: Record<string, number | { inStock: number; all: number }> = {};

      await Promise.all(
        data.map(async (list) => {
          if (list.assigned_store_id) {
            // Load store info
            const { data: storeData } = await supabase
              .from("stores")
              .select("*, store_hq(name)")
              .eq("id", list.assigned_store_id)
              .single();
            
            if (storeData) {
              storesMap[list.id] = storeData;

              // Load list items
              const { data: items } = await supabase
                .from("shopping_list_items")
                .select("product_gtin, quantity")
                .eq("shopping_list_id", list.id);

              if (items && items.length > 0) {
                // Load prices for these items at this store
                const gtins = items.map(item => item.product_gtin);
                const { data: prices } = await supabase
                  .from("store_prices")
                  .select("product_gtin, price, in_stock")
                  .eq("store_id", list.assigned_store_id)
                  .in("product_gtin", gtins);

                // Calculate total (only in-stock items)
                const total = items.reduce((sum, item) => {
                  const priceData = prices?.find(p => p.product_gtin === item.product_gtin);
                  if (priceData && priceData.in_stock) {
                    return sum + (Number(priceData.price) * item.quantity);
                  }
                  return sum;
                }, 0);

                // Calculate total including out-of-stock items
                const totalWithOutOfStock = items.reduce((sum, item) => {
                  const priceData = prices?.find(p => p.product_gtin === item.product_gtin);
                  if (priceData) {
                    return sum + (Number(priceData.price) * item.quantity);
                  }
                  return sum;
                }, 0);

                totalsMap[list.id] = { inStock: total, all: totalWithOutOfStock };
              }
            }
          }
        })
      );

      setListAssignedStores(storesMap);
      setListTotals(totalsMap);
    }
  };

  const createNewList = async () => {
    if (!newListName.trim()) {
      toast({ title: "Error", description: "Please enter a list name", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("shopping_lists")
      .insert({ 
        name: newListName, 
        user_id: user.id,
        budget: newListBudget ? parseFloat(newListBudget) : null
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "List created" });
      setNewListName("");
      setNewListBudget("");
      setSelectedListId(data.id);
      loadShoppingLists();
      loadListItems(data.id);
    }
  };

  const updateListBudget = async (listId: string, budget: string) => {
    const { error } = await supabase
      .from("shopping_lists")
      .update({ budget: budget ? parseFloat(budget) : null })
      .eq("id", listId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Budget updated" });
      setEditingBudget(prev => ({ ...prev, [listId]: "" }));
      loadShoppingLists();
    }
  };

  const deleteList = async (listId: string) => {
    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", listId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "List deleted" });
      if (selectedListId === listId) {
        setSelectedListId("");
        setListItems([]);
      }
      loadShoppingLists();
    }
  };

  const unassignStore = async (listId: string) => {
    const { error } = await supabase
      .from("shopping_lists")
      .update({ assigned_store_id: null })
      .eq("id", listId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Store unassigned from list" });
      loadShoppingLists();
    }
  };

  const handleAssignStore = async (listId: string, store: any) => {
    const { error } = await supabase
      .from("shopping_lists")
      .update({ assigned_store_id: store.id })
      .eq("id", listId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Assigned to ${store.store_hq?.name} - ${store.location}` });
      loadShoppingLists();
    }
  };

  const loadListItems = async (listId: string) => {
    const { data } = await supabase
      .from("shopping_list_items")
      .select("*, products(description)")
      .eq("shopping_list_id", listId);

    setListItems(data || []);
    
    // Load enriched data with prices if list has assigned store
    const selectedList = shoppingLists.find(l => l.id === listId);
    if (selectedList?.assigned_store_id && data && data.length > 0) {
      const gtins = data.map(item => item.product_gtin);
      const { data: prices } = await supabase
        .from("store_prices")
        .select("product_gtin, price, in_stock")
        .eq("store_id", selectedList.assigned_store_id)
        .in("product_gtin", gtins);

      const enrichedItems = data.map(item => {
        const priceData = prices?.find(p => p.product_gtin === item.product_gtin);
        return {
          ...item,
          price: priceData?.price,
          in_stock: priceData?.in_stock ?? false
        };
      });

      setListItemsWithPrices(enrichedItems);
    } else {
      setListItemsWithPrices([]);
    }
    
    // Load stock info for all items
    if (data && data.length > 0) {
      const stockInfoMap: Record<string, any[]> = {};
      await Promise.all(
        data.map(async (item) => {
          const { data: stockData } = await supabase
            .from("store_prices")
            .select("store_id, in_stock, stores(location, store_hq(name))")
            .eq("product_gtin", item.product_gtin);
          
          if (stockData) {
            stockInfoMap[item.product_gtin] = stockData;
          }
        })
      );
      setStockInfo(stockInfoMap);
    }
  };

  const loadStorePrices = async (gtins: string[]) => {
    if (!selectedStore || gtins.length === 0) return;

    const { data } = await supabase
      .from("store_prices")
      .select("product_gtin, price, in_stock")
      .eq("store_id", selectedStore.id)
      .in("product_gtin", gtins);

    const priceMap: Record<string, any> = {};
    data?.forEach(price => {
      priceMap[price.product_gtin] = price;
    });
    setStorePrices(priceMap);
  };

  const selectList = (listId: string) => {
    setSelectedListId(listId);
    loadListItems(listId);
  };

  const handleListUpdated = useCallback(async (listId: string) => {
    await loadShoppingLists();
    if (selectedListId === listId) {
      await loadListItems(listId);
    }
  }, [selectedListId]);

  const handleStoreSelected = (store: any) => {
    setSelectedStore(store);
  };


  const calculateTotal = () => {
    if (!selectedStore) return 0;
    
    return listItems.reduce((sum, item) => {
      const price = storePrices[item.product_gtin];
      if (price) {
        return sum + (Number(price.price) * item.quantity);
      }
      return sum;
    }, 0);
  };

  const calculateInStockTotal = () => {
    if (!selectedStore) return 0;
    
    return listItems.reduce((sum, item) => {
      const price = storePrices[item.product_gtin];
      if (price && price.in_stock) {
        return sum + (Number(price.price) * item.quantity);
      }
      return sum;
    }, 0);
  };

  const searchProducts = async (term: string) => {
    let query = supabase.from("products").select("*");
    
    if (term.trim()) {
      query = query.or(`gtin.ilike.%${term}%,description.ilike.%${term}%`);
    }
    
    query = query.limit(100);
    
    const { data } = await query;
    setProducts(data || []);
  };

  const debouncedSearch = useCallback(
    debounce((term: string) => searchProducts(term), 300),
    []
  );

  const loadStores = async () => {
    const { data } = await supabase.from("stores_public").select("*, store_hq(name)");
    setStores(data || []);
  };

  const updateProductQuantity = (gtin: string, delta: number) => {
    if (!selectedListId) {
      toast({
        title: "Select or create a list",
        description: "Please select or create a shopping list first",
        variant: "destructive",
      });
      return;
    }
    setProductQuantities(prev => {
      const current = prev[gtin] || 0;
      const newQty = Math.max(0, current + delta);
      return { ...prev, [gtin]: newQty };
    });
  };

  const addProductToList = async (gtin: string) => {
    if (!selectedListId) {
      toast({ 
        title: "Select or create a list", 
        description: "Please select or create a shopping list first", 
        variant: "destructive" 
      });
      return;
    }

    const quantity = productQuantities[gtin] || 0;
    if (quantity === 0) {
      toast({ title: "Info", description: "Set quantity greater than 0 to add", variant: "destructive" });
      return;
    }

    const existingItem = listItems.find(item => item.product_gtin === gtin);
    
    if (existingItem) {
      toast({ title: "Info", description: "Product already in list", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("shopping_list_items")
      .insert({
        shopping_list_id: selectedListId,
        product_gtin: gtin,
        quantity
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Product added to list" });
      loadListItems(selectedListId);
      setProductQuantities(prev => ({ ...prev, [gtin]: 0 }));
    }
  };

  const updateListItemQuantity = async (itemId: string, delta: number) => {
    // Check both listItems and listItemsWithPrices for the item
    const item = listItems.find(i => i.id === itemId) || listItemsWithPrices.find(i => i.id === itemId);
    if (!item) {
      console.warn('Item not found for quantity update:', itemId);
      return;
    }

    const newQuantity = Math.max(1, item.quantity + delta);

    // Optimistic update for both state arrays
    setListItems(prev => 
      prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i)
    );
    setListItemsWithPrices(prev => 
      prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i)
    );

    try {
      const { error } = await supabase
        .from("shopping_list_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) {
        console.error('Error updating quantity:', error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
        // Revert on error
        if (selectedListId) {
          loadListItems(selectedListId);
        }
      } else {
        // Reload to ensure consistency - but don't block on it
        if (selectedListId) {
          loadListItems(selectedListId);
          loadShoppingLists();
        }
      }
    } catch (err) {
      console.error('Unexpected error updating quantity:', err);
      // Don't propagate errors that might affect auth
    }
  };

  const removeItemFromList = async (itemId: string) => {
    const { error } = await supabase
      .from("shopping_list_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await loadListItems(selectedListId);
      await loadShoppingLists(); // Refresh totals
    }
  };

  const comparePrices = async () => {
    if (compareStores.length === 0 || compareStores.length > 2) {
      toast({ title: "Error", description: "Select 1 or 2 stores to compare", variant: "destructive" });
      return;
    }

    if (!selectedListId || listItems.length === 0) {
      toast({ title: "Error", description: "Select a list with products to compare", variant: "destructive" });
      return;
    }

    const gtins = listItems.map(item => item.product_gtin);

    const results = await Promise.all(
      compareStores.map(async (storeId) => {
        const { data: store } = await supabase
          .from("stores")
          .select("*, store_hq(name)")
          .eq("id", storeId)
          .single();

        const { data: prices } = await supabase
          .from("store_prices")
          .select("product_gtin, price, in_stock")
          .eq("store_id", storeId)
          .in("product_gtin", gtins);

        const total = prices?.reduce((sum, p) => {
          const item = listItems.find(i => i.product_gtin === p.product_gtin);
          const quantity = item?.quantity || 1;
          return sum + Number(p.price) * quantity;
        }, 0) || 0;

        return {
          store,
          prices: prices || [],
          total,
        };
      })
    );

    setComparison(results);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      window.location.href = "/";
    }
  };

  // Map activeSection number to view string for sidebar
  const sectionToView: Record<number, string> = {
    0: 'dashboard',  // My Shopping Lists is the dashboard/home
    1: 'compare',
    2: 'search-add-products',
    3: 'lists',      // Profile section
    4: 'my-feedback',
  };

  const viewToSection: Record<string, number> = {
    'dashboard': 0,  // Dashboard goes to My Shopping Lists
    'search-add-products': 2,
    'compare': 1,
    'lists': 0,
    'stores': 0,
    'my-feedback': 4,
  };

  const handleNavigate = (view: string) => {
    const section = viewToSection[view];
    if (section !== undefined) {
      setActiveSection(section);
    }
  };

  // Compute selected list details for sidebar
  const selectedList = shoppingLists.find(l => l.id === selectedListId);
  const selectedListName = selectedList?.name;
  const assignedStore = selectedListId ? listAssignedStores[selectedListId] : null;
  const assignedStoreName = assignedStore ? `${assignedStore.store_hq?.name} - ${assignedStore.location}` : null;
  const selectedListTotalData = selectedListId ? listTotals[selectedListId] : null;
  const selectedListTotal = selectedListTotalData 
    ? (typeof selectedListTotalData === 'number' ? selectedListTotalData : selectedListTotalData.inStock)
    : null;

  return (
    <SmartShopperLayout
      userRole="shopper"
      activeView={sectionToView[activeSection] || 'lists'}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onProfileClick={() => setActiveSection(3)}
      trustScore={4.8}
      totalSavings={0}
      currencySymbol={currencySymbol}
      selectedListName={selectedListName}
      assignedStoreName={assignedStoreName}
      selectedListTotal={selectedListTotal}
    >
      <DashboardContent 
        activeSection={activeSection}
        selectedStore={selectedStore}
        handleStoreSelected={handleStoreSelected}
        listManagerOpen={listManagerOpen}
        setListManagerOpen={setListManagerOpen}
        selectedListId={selectedListId}
        listItems={listItems}
        shoppingLists={shoppingLists}
        stores={stores}
        currencySymbol={currencySymbol}
        storePrices={storePrices}
        userProfile={userProfile}
        calculateTotal={calculateTotal}
        calculateInStockTotal={calculateInStockTotal}
        newListName={newListName}
        setNewListName={setNewListName}
        newListBudget={newListBudget}
        setNewListBudget={setNewListBudget}
        editingBudget={editingBudget}
        setEditingBudget={setEditingBudget}
        updateListBudget={updateListBudget}
        createNewList={createNewList}
        loadShoppingLists={loadShoppingLists}
        listAssignedStores={listAssignedStores}
        listTotals={listTotals}
        selectList={selectList}
        unassignStore={unassignStore}
        handleAssignStore={handleAssignStore}
        deleteList={deleteList}
        listItemsExpanded={listItemsExpanded}
        setListItemsExpanded={setListItemsExpanded}
        stockInfo={stockInfo}
        updateListItemQuantity={updateListItemQuantity}
        removeItemFromList={removeItemFromList}
        comparison={comparison}
        compareStores={compareStores}
        storeDialogOpen={storeDialogOpen}
        setStoreDialogOpen={setStoreDialogOpen}
        storeSearchTerm={storeSearchTerm}
        setStoreSearchTerm={setStoreSearchTerm}
        setCompareStores={setCompareStores}
        comparePrices={comparePrices}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        products={products}
        productQuantities={productQuantities}
        updateProductQuantity={updateProductQuantity}
        addProductToList={addProductToList}
        loadUserProfile={loadUserProfile}
        listItemsWithPrices={listItemsWithPrices}
        viewListDialogOpen={viewListDialogOpen}
        setViewListDialogOpen={setViewListDialogOpen}
        viewingListId={viewingListId}
        setViewingListId={setViewingListId}
      />
    </SmartShopperLayout>
  );
};

const DashboardContent = ({
  activeSection,
  selectedStore,
  handleStoreSelected,
  listManagerOpen,
  setListManagerOpen,
  selectedListId,
  listItems,
  shoppingLists,
  stores,
  currencySymbol,
  storePrices,
  userProfile,
  calculateTotal,
  calculateInStockTotal,
  newListName,
  setNewListName,
  newListBudget,
  setNewListBudget,
  editingBudget,
  setEditingBudget,
  updateListBudget,
  createNewList,
  loadShoppingLists,
  listAssignedStores,
  listTotals,
  selectList,
  unassignStore,
  handleAssignStore,
  deleteList,
  listItemsExpanded,
  setListItemsExpanded,
  stockInfo,
  updateListItemQuantity,
  removeItemFromList,
  comparison,
  compareStores,
  storeDialogOpen,
  setStoreDialogOpen,
  storeSearchTerm,
  setStoreSearchTerm,
  setCompareStores,
  comparePrices,
  searchTerm,
  handleSearchChange,
  products,
  productQuantities,
  updateProductQuantity,
  addProductToList,
  loadUserProfile,
  listItemsWithPrices,
  viewListDialogOpen,
  setViewListDialogOpen,
  viewingListId,
  setViewingListId,
}: {
  activeSection: number;
  selectedStore: any;
  handleStoreSelected: (store: any) => void;
  listManagerOpen: boolean;
  setListManagerOpen: (open: boolean) => void;
  selectedListId: string;
  listItems: any[];
  shoppingLists: any[];
  stores: any[];
  currencySymbol: string;
  storePrices: Record<string, any>;
  userProfile: any;
  calculateTotal: () => number;
  calculateInStockTotal: () => number;
  newListName: string;
  setNewListName: (name: string) => void;
  newListBudget: string;
  setNewListBudget: (budget: string) => void;
  editingBudget: Record<string, string>;
  setEditingBudget: (budget: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  updateListBudget: (listId: string, budget: string) => Promise<void>;
  createNewList: () => Promise<void>;
  loadShoppingLists: () => Promise<void>;
  listAssignedStores: Record<string, any>;
  listTotals: Record<string, number | { inStock: number; all: number }>;
  selectList: (listId: string) => void;
  unassignStore: (listId: string) => Promise<void>;
  handleAssignStore: (listId: string, store: any) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  listItemsExpanded: boolean;
  setListItemsExpanded: (expanded: boolean) => void;
  stockInfo: Record<string, any[]>;
  updateListItemQuantity: (itemId: string, delta: number) => Promise<void>;
  removeItemFromList: (itemId: string) => Promise<void>;
  comparison: any;
  compareStores: string[];
  storeDialogOpen: number | null;
  setStoreDialogOpen: (index: number | null) => void;
  storeSearchTerm: string;
  setStoreSearchTerm: (term: string) => void;
  setCompareStores: (stores: string[]) => void;
  comparePrices: () => Promise<void>;
  searchTerm: string;
  handleSearchChange: (value: string) => void;
  products: any[];
  productQuantities: Record<string, number>;
  updateProductQuantity: (gtin: string, delta: number) => void;
  addProductToList: (gtin: string) => Promise<void>;
  loadUserProfile: () => Promise<void>;
  listItemsWithPrices: any[];
  viewListDialogOpen: boolean;
  setViewListDialogOpen: (open: boolean) => void;
  viewingListId: string;
  setViewingListId: (id: string) => void;
}) => {
  return (
    <div className="flex flex-1 flex-col w-full">
      <div className="flex flex-col gap-4 flex-1 w-full">
        {activeSection === 0 && (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">My Shopping Lists</h1>
              <p className="text-muted-foreground">Create and manage your shopping lists</p>
            </div>

            <div className="mb-6 flex gap-3 items-start">
              <div className="flex-1">
                <StoreSelector 
                  selectedStore={selectedStore}
                  onStoreSelected={handleStoreSelected}
                />
              </div>
              <Dialog open={listManagerOpen} onOpenChange={setListManagerOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!selectedListId || listItems.length === 0} className="flex items-center">
                    <ListChecks className="h-4 w-4" />
                    Share List
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Share Shopping List</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {selectedListId && (
                      <ShoppingListManager
                        list={shoppingLists.find((l: any) => l.id === selectedListId)}
                        items={listItems}
                        stores={stores}
                        currencySymbol={currencySymbol}
                        selectedStore={selectedStore}
                        storePrices={storePrices}
                        userProfile={userProfile}
                      />
                    )}
                  </div>
                  </DialogContent>
                </Dialog>
              </div>

            {/* View List Items Dialog */}
            <Dialog open={viewListDialogOpen} onOpenChange={setViewListDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>
                    {shoppingLists.find((l: any) => l.id === viewingListId)?.name || "Shopping List Items"}
                  </DialogTitle>
                  <DialogDescription>
                    View all items in this shopping list with stock status
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                  {listItemsWithPrices.length > 0 ? (
                    <div className="space-y-3">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">In Stock</p>
                            </div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {listItemsWithPrices.filter(item => item.in_stock).length}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                              <p className="text-sm font-medium text-red-800 dark:text-red-200">Out of Stock</p>
                            </div>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {listItemsWithPrices.filter(item => !item.in_stock).length}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Items List */}
                      {listItemsWithPrices.map((item: any) => (
                        <Card key={item.id} className={cn(
                          "border-l-4",
                          item.in_stock ? "border-l-green-500" : "border-l-red-500"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {item.in_stock ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                  )}
                                  <p className="font-medium text-foreground">
                                    {item.products?.description}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Quantity:</span>
                                    <span className="ml-2 font-medium">{item.quantity}</span>
                                  </div>
                                  {item.price !== undefined && (
                                    <>
                                      <div>
                                        <span className="text-muted-foreground">Price:</span>
                                        <span className="ml-2 font-medium">{currencySymbol}{item.price.toFixed(2)}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Subtotal:</span>
                                        <span className="ml-2 font-medium">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                    </>
                                  )}
                                  <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className={cn(
                                      "ml-2 font-medium",
                                      item.in_stock ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                      {item.in_stock ? "Available" : "Not Available"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Total Summary */}
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Total (All Items)</p>
                              <p className="text-xl font-bold">
                                {currencySymbol}{listItemsWithPrices.reduce((sum, item) => 
                                  sum + (item.price ? item.price * item.quantity : 0), 0
                                ).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Total (In Stock)</p>
                              <p className="text-xl font-bold text-green-600">
                                {currencySymbol}{listItemsWithPrices
                                  .filter(item => item.in_stock)
                                  .reduce((sum, item) => sum + (item.price ? item.price * item.quantity : 0), 0)
                                  .toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No items in this list</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {selectedStore && selectedListId && listItems.length > 0 && (
              <Card className="mb-6 bg-primary/5">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total (All Items)</p>
                      <p className="text-2xl font-bold">{currencySymbol}{calculateTotal().toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total (In-Stock Only)</p>
                      <p className="text-2xl font-bold text-green-600">{currencySymbol}{calculateInStockTotal().toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>My Shopping Lists</CardTitle>
                    <AutoListCreator
                      onListCreated={loadShoppingLists}
                      currencySymbol={currencySymbol}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="New list name..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Budget (optional)..."
                      value={newListBudget}
                      onChange={(e) => setNewListBudget(e.target.value)}
                    />
                  </div>
                    <AnimatedButton onClick={createNewList} className="w-full h-10">
                      Create New List
                    </AnimatedButton>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {shoppingLists.map((list: any) => {
                      const assignedStore = listAssignedStores[list.id];
                      const listTotalData = listTotals[list.id];
                      const listTotal = typeof listTotalData === 'object' ? listTotalData.inStock : (listTotalData || 0);

                      return (
                        <div
                          key={list.id}
                          className={`group relative border rounded-xl p-3 cursor-pointer transform-gpu transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:hover:shadow-[0_-20px_80px_-20px_#ffffff1f_inset] hover:-translate-y-1 ${
                            selectedListId === list.id ? "bg-primary/10 border-primary shadow-lg" : "hover:bg-accent/5"
                          }`}
                          onClick={() => selectList(list.id)}
                        >
                          <div className="pointer-events-none absolute inset-0 rounded-xl transform-gpu transition-all duration-300 group-hover:bg-primary/[.02]" />
                          
                           {/* Header row with name and floating action menu */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{list.name}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Floating Action Menu */}
                              <FloatingActionMenu
                                className="relative bottom-0 right-0"
                                options={[
                                  ...(assignedStore ? [{
                                    label: "View List",
                                    Icon: <Eye className="w-4 h-4" />,
                                    onClick: () => {
                                      setViewingListId(list.id);
                                      selectList(list.id);
                                      setViewListDialogOpen(true);
                                    }
                                  }] : []),
                                  {
                                    label: "Share",
                                    Icon: <Share className="w-4 h-4" />,
                                    onClick: () => {
                                      selectList(list.id);
                                      setListManagerOpen(true);
                                    }
                                  },
                                  {
                                    label: "Budget",
                                    Icon: <DollarSign className="w-4 h-4" />,
                                    onClick: () => setEditingBudget(prev => ({ ...prev, [list.id]: list.budget?.toString() || "" }))
                                  },
                                  ...(assignedStore ? [{
                                    label: "Unassign Store",
                                    Icon: <Link2 className="w-4 h-4" />,
                                    onClick: () => unassignStore(list.id)
                                  }] : [])
                                ]}
                              />
                              
                              {/* Separate Delete Button */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <HoverButton
                                    className="w-10 h-10 !p-0 flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 text-destructive"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </HoverButton>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this shopping list and all its items. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteList(list.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          {!assignedStore && (
                            <div className="mb-2">
                              <StoreSelector
                                onStoreSelected={(store) => handleAssignStore(list.id, store)}
                                buttonText="Assign Store"
                              />
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            {new Date(list.created_at).toLocaleDateString()}
                          </p>
                          
                          {assignedStore && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex items-center gap-1 text-xs">
                                <Store className="h-3 w-3" />
                                <span className="font-medium">
                                  {assignedStore.store_hq?.name} - {assignedStore.location}
                                </span>
                              </div>
                              {listTotal !== undefined && (
                                <div className="space-y-1 mt-1">
                                  <p className="text-sm font-bold text-primary">
                                    Total (In Stock): {currencySymbol}{listTotal.toFixed(2)}
                                  </p>
                                  {typeof listTotalData === 'object' && listTotalData.all !== listTotalData.inStock && (
                                    <p className="text-xs text-destructive font-medium">
                                      Including out of stock: {currencySymbol}{listTotalData.all.toFixed(2)}
                                    </p>
                                  )}
                                  {list.budget && (
                                    <p className={`text-xs font-medium ${listTotal > Number(list.budget) ? "text-red-600" : "text-green-600"}`}>
                                      Budget: {currencySymbol}{Number(list.budget).toFixed(2)} 
                                      {listTotal > Number(list.budget) ? " ⚠️ Over budget!" : " ✓ Within budget"}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {list.budget && !assignedStore && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                Budget: {currencySymbol}{list.budget.toFixed(2)}
                              </p>
                            </div>
                          )}


                          {editingBudget[list.id] !== undefined ? (
                            <div className="mt-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Budget..."
                                  value={editingBudget[list.id]}
                                  onChange={(e) => setEditingBudget(prev => ({ ...prev, [list.id]: e.target.value }))}
                                  className="h-8"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => updateListBudget(list.id, editingBudget[list.id])}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingBudget(prev => {
                                    const newState = { ...prev };
                                    delete newState[list.id];
                                    return newState;
                                  })}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : null}

                          {list.budget && listTotal && listTotal > Number(list.budget) && (
                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                              <BudgetAISuggestions
                                listId={list.id}
                                budget={Number(list.budget)}
                                currencySymbol={currencySymbol}
                                onListUpdated={() => {
                                  // Reload lists and items after AI suggestions are applied
                                  window.location.reload();
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Selected List Items</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setListItemsExpanded(!listItemsExpanded)}
                      className="h-8 w-8 p-0 flex items-center justify-center"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${listItemsExpanded ? "" : "-rotate-90"}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedListId && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No list selected
                    </p>
                  )}
                  
                  {listItemsExpanded && selectedListId && (
                    <>
                      {listItemsWithPrices.length > 0 ? (
                        <>
                          <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {listItemsWithPrices.map((item: any) => (
                              <div key={item.id} className="group relative rounded-2xl p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium tracking-wide transform hover:scale-[1.02] hover:from-emerald-400 hover:to-teal-400 transition-all duration-200 shadow-lg hover:shadow-xl">
                                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/5 group-hover:bg-black/0 transition-all duration-200" />
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold break-words text-white">{item.products?.description}</p>
                                        <p className="text-xs text-white/70 truncate">GTIN: {item.product_gtin}</p>
                                      </div>
                                      {item.in_stock ? (
                                        <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-red-200 flex-shrink-0" />
                                      )}
                                    </div>
                                    
                                    <div className="mt-2 space-y-2">
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className="text-white/80">Qty:</span>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="h-6 w-6 p-0 flex items-center justify-center bg-white/20 border-white/30 hover:bg-white/30"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                updateListItemQuantity(item.id, -1);
                                              }}
                                            >
                                              <Minus className="h-3 w-3 text-white" />
                                            </Button>
                                            <span className="w-8 text-center font-bold text-white">{item.quantity}</span>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="h-6 w-6 p-0 flex items-center justify-center bg-white/20 border-white/30 hover:bg-white/30"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                updateListItemQuantity(item.id, 1);
                                              }}
                                            >
                                              <Plus className="h-3 w-3 text-white" />
                                            </Button>
                                          </div>
                                        </div>
                                        {item.price && (
                                          <span className={`text-xs sm:text-sm ${item.in_stock ? "font-semibold text-white" : "font-semibold text-red-200 line-through"}`}>
                                            {currencySymbol}{Number(item.price).toFixed(2)} × {item.quantity} = {currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                      <div className={`text-xs font-bold ${item.in_stock ? "text-white" : "text-red-200"}`}>
                                        {item.in_stock ? "✓ In Stock" : "✗ Out of Stock"}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => removeItemFromList(item.id)}
                                    className="flex-shrink-0 bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Total for in-stock items */}
                          <div className="pt-4 border-t">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                              <span className="font-semibold text-sm sm:text-base">Total (In-Stock Only):</span>
                              <span className="text-lg sm:text-xl font-bold text-primary">
                                {currencySymbol}
                                {listItemsWithPrices
                                  .filter(item => item.in_stock && item.price)
                                  .reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
                                  .toFixed(2)}
                              </span>
                            </div>
                            {listItemsWithPrices.some(item => !item.in_stock && item.price) && (
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mt-2">
                                <span className="text-xs sm:text-sm text-destructive">Including out of stock:</span>
                                <span className="text-base sm:text-lg font-semibold text-destructive">
                                  {currencySymbol}
                                  {listItemsWithPrices
                                    .filter(item => item.price)
                                    .reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
                                    .toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                          {listItems.map((item: any) => (
                            <div key={item.id} className="group relative rounded-2xl p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium tracking-wide transform hover:scale-[1.02] hover:from-emerald-400 hover:to-teal-400 transition-all duration-200 shadow-lg hover:shadow-xl">
                              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/5 group-hover:bg-black/0 transition-all duration-200" />
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold truncate text-white">{item.products?.description}</p>
                                  <p className="text-xs text-white/70 mt-1">GTIN: {item.product_gtin}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm text-white/80">Qty:</span>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0 flex items-center justify-center bg-white/20 border-white/30 hover:bg-white/30"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          updateListItemQuantity(item.id, -1);
                                        }}
                                      >
                                        <Minus className="h-3 w-3 text-white" />
                                      </Button>
                                      <span className="w-8 text-center font-bold text-white">{item.quantity}</span>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-6 w-6 p-0 flex items-center justify-center bg-white/20 border-white/30 hover:bg-white/30"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          updateListItemQuantity(item.id, 1);
                                        }}
                                      >
                                        <Plus className="h-3 w-3 text-white" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeItemFromList(item.id)}
                                  className="flex-shrink-0 bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

          </>
        )}

        {activeSection === 1 && (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">Check Prices</h1>
              <p className="text-muted-foreground">Compare prices across different stores</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Check Prices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Shopping List</label>
                  <Select value={selectedListId} onValueChange={selectList}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a shopping list" />
                    </SelectTrigger>
                    <SelectContent>
                      {shoppingLists.map((list: any) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {selectedListId ? `${listItems.length} items in list` : "No list selected"}
                  </p>
                </div>

                <MultiStorePriceComparison
                  listItems={listItems}
                  currencySymbol={currencySymbol}
                  shoppingLists={shoppingLists}
                  selectedListId={selectedListId}
                  onShoppingListChange={selectList}
                />

                <div className="space-y-2">
                  {[0, 1].map((index) => {
                    const selectedStore = stores.find((s: any) => s.id === compareStores[index]);
                    const filteredStores = stores.filter((store: any) => {
                      if (!storeSearchTerm.trim()) return true;
                      const storeName = store.store_hq?.name?.toLowerCase() || "";
                      const location = store.location?.toLowerCase() || "";
                      const search = storeSearchTerm.toLowerCase();
                      return storeName.includes(search) || location.includes(search);
                    });

                    return (
                      <Dialog 
                        key={index} 
                        open={storeDialogOpen === index} 
                        onOpenChange={(open) => {
                          setStoreDialogOpen(open ? index : null);
                          if (!open) setStoreSearchTerm("");
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Store className="h-4 w-4 mr-2" />
                            {selectedStore ? (
                              <span className="truncate">
                                {selectedStore.store_hq?.name} - {selectedStore.location}
                              </span>
                            ) : `Select Store ${index + 1}${index === 0 ? " (required)" : " (optional)"}`}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Select Store {index + 1}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Search by store name or area..."
                              value={storeSearchTerm}
                              onChange={(e) => setStoreSearchTerm(e.target.value)}
                            />
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                              {filteredStores.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No stores found
                                </p>
                              ) : (
                                filteredStores.map((store: any) => (
                                  <Card 
                                    key={store.id} 
                                    className={`cursor-pointer transition-all hover:bg-accent hover:border-primary ${
                                      compareStores[index] === store.id ? "border-primary bg-accent/50" : ""
                                    }`}
                                    onClick={() => {
                                      const newStores = [...compareStores];
                                      newStores[index] = store.id;
                                      setCompareStores(newStores.filter(Boolean));
                                      setStoreDialogOpen(null);
                                      setStoreSearchTerm("");
                                    }}
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
                  })}
                </div>

                <Button onClick={comparePrices} className="w-full" disabled={!selectedListId || listItems.length === 0}>
                  Check Price
                </Button>

                {comparison && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Total (All Items)</p>
                        <p className="text-xl font-bold">
                          {currencySymbol}{comparison.reduce((sum: number, result: any) => sum + result.total, 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total (In-Stock Only)</p>
                        <p className="text-xl font-bold text-green-600">
                          {currencySymbol}{comparison.reduce((sum: number, result: any) => {
                            const inStockTotal = result.prices
                              .filter((p: any) => p.in_stock)
                              .reduce((s: number, p: any) => {
                                const item = listItems.find((i: any) => i.product_gtin === p.product_gtin);
                                const quantity = item?.quantity || 1;
                                return s + Number(p.price) * quantity;
                              }, 0);
                            return sum + inStockTotal;
                          }, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {comparison.map((result: any, idx: number) => (
                      <Card key={idx} className={idx === 0 && comparison.length > 1 && result.total < comparison[1].total ? "border-green-500" : ""}>
                        <CardContent className="p-4">
                          <p className="font-semibold">
                            {result.store.store_hq?.name} - {result.store.location}
                          </p>
                          <p className="text-2xl font-bold text-primary mt-2">
                            {currencySymbol}{result.total.toFixed(2)}
                          </p>
                          <div className="mt-2 space-y-1">
                            {result.prices.map((p: any) => {
                              const item = listItems.find((i: any) => i.product_gtin === p.product_gtin);
                              const quantity = item?.quantity || 1;
                              const stockStatus = p.in_stock ? "✓ In Stock" : "✗ Out of Stock";
                              const stockColor = p.in_stock ? "text-green-600" : "text-red-600";
                              return (
                                <div key={p.product_gtin} className="text-sm">
                                  <p className="text-muted-foreground">
                                    {item?.products?.description}: {currencySymbol}{Number(p.price).toFixed(2)} × {quantity}
                                  </p>
                                  <p className={`text-xs ${stockColor}`}>{stockStatus}</p>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeSection === 2 && (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">Search & Add Products</h1>
              <p className="text-muted-foreground">Find products and add them to your shopping lists</p>
            </div>

            <Card className="group relative transform-gpu transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:hover:shadow-[0_-20px_80px_-20px_#ffffff1f_inset] hover:-translate-y-1">
              <div className="pointer-events-none absolute inset-0 rounded-xl transform-gpu transition-all duration-300 group-hover:bg-primary/[.02]" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Search Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Shopping List</label>
                  <Select value={selectedListId} onValueChange={selectList}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a shopping list" />
                    </SelectTrigger>
                    <SelectContent>
                      {shoppingLists.map((list: any) => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {selectedListId ? `${listItems.length} items in list` : "No list selected"}
                  </p>
                </div>
                
                <Input
                  placeholder="Search products by name or GTIN..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {products.map((product) => {
                    const isInList = listItems.some(item => item.product_gtin === product.gtin);
                    return (
                      <div 
                        key={product.gtin} 
                        className={cn(
                          "group relative border rounded-xl p-4 transform-gpu transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:hover:shadow-[0_-20px_80px_-20px_#ffffff1f_inset] hover:-translate-y-1 hover:bg-accent/5",
                          isInList && "bg-green-700/20 border-green-700/50 shadow-[0_0_15px_rgba(21,128,61,0.3)]"
                        )}
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-xl transform-gpu transition-all duration-300 group-hover:bg-primary/[.02]" />
                        
                        {/* Product name with badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold flex-1">{product.description}</p>
                          {isInList && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-700 text-white text-xs font-semibold rounded-full flex-shrink-0">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              In List
                            </span>
                          )}
                        </div>
                        
                        {/* GTIN and controls stacked below */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <p className="text-sm text-muted-foreground">GTIN: {product.gtin}</p>
                          <div className="flex items-center gap-2 sm:ml-auto">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProductQuantity(product.gtin, -1)}
                                disabled={!selectedListId}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center font-semibold">{productQuantities[product.gtin] || 0}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProductQuantity(product.gtin, 1)}
                                disabled={!selectedListId}
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (isInList) {
                                  const itemToRemove = listItems.find(item => item.product_gtin === product.gtin);
                                  if (itemToRemove) {
                                    removeItemFromList(itemToRemove.id);
                                  }
                                } else {
                                  addProductToList(product.gtin);
                                }
                              }}
                              disabled={!selectedListId || (!isInList && !productQuantities[product.gtin])}
                              variant={isInList ? "destructive" : "default"}
                            >
                              {isInList ? "Remove" : "Add"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeSection === 3 && (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">Edit Profile</h1>
              <p className="text-muted-foreground">Manage your account information and preferences</p>
            </div>

            <Card className="max-w-lg mx-auto bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileEditor onComplete={() => {
                  loadUserProfile();
                }} />
              </CardContent>
            </Card>
          </>
        )}

        {activeSection === 4 && (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">Give Feedback</h1>
              <p className="text-muted-foreground">Share your experience with stores</p>
            </div>

            <Card className="group relative transform-gpu transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:hover:shadow-[0_-20px_80px_-20px_#ffffff1f_inset] hover:-translate-y-1">
              <div className="pointer-events-none absolute inset-0 rounded-xl transform-gpu transition-all duration-300 group-hover:bg-primary/[.02]" />
              <CardHeader>
                <CardTitle>Store Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <StoreFeedbackForm />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopperDashboard;
