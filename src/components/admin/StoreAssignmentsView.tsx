import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Store, Search } from "lucide-react";

export function StoreAssignmentsView() {
  const { toast } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [emailSearch, setEmailSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStoreForAssignment, setSelectedStoreForAssignment] = useState("");
  const [storeAssignmentDialogOpen, setStoreAssignmentDialogOpen] = useState(false);
  const [storeAssignmentSearch, setStoreAssignmentSearch] = useState("");

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    const { data } = await supabase
      .from("stores")
      .select("*, store_hq(name)")
      .order("created_at", { ascending: false });
    
    if (data) {
      const ownerIds = data.filter(s => s.store_owner_id).map(s => s.store_owner_id);
      
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", ownerIds);
        
        const storesWithProfiles = data.map(store => {
          const profile = profilesData?.find(p => p.user_id === store.store_owner_id);
          return { ...store, profiles: profile };
        });
        
        setStores(storesWithProfiles);
        return;
      }
    }
    
    setStores(data || []);
  };

  const searchUsersByEmail = async () => {
    if (!emailSearch.trim()) {
      toast({ title: "Error", description: "Please enter an email to search", variant: "destructive" });
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, email, display_name")
      .ilike("email", `%${emailSearch}%`);

    let results = profileData || [];

    if (!results || results.length === 0) {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("search-users", {
        body: { q: emailSearch },
      });

      if (fnError) {
        toast({ title: "Error", description: fnError.message, variant: "destructive" });
        return;
      }

      const users = (fnData as any)?.users as Array<{ id: string; email: string }> | undefined;
      if (users && users.length > 0) {
        results = users.map((u) => ({
          user_id: u.id,
          email: u.email,
          display_name: u.email?.split("@")[0] || null,
        }));
      }
    }

    setSearchResults(results);
    if (results.length === 0) {
      toast({ title: "No Results", description: "No users found with that email" });
    }
  };

  const assignUserToStore = async (userId: string, storeId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "store_owner")
      .maybeSingle();

    if (!roleData) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "store_owner" });
      
      if (roleError) {
        toast({ title: "Error", description: "Failed to assign store_owner role", variant: "destructive" });
        return;
      }
    }

    const { error } = await supabase
      .from("stores")
      .update({ store_owner_id: userId })
      .eq("id", storeId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Store owner assigned successfully" });
      setEmailSearch("");
      setSearchResults([]);
      setSelectedStoreForAssignment("");
      loadStores();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Assign Store Manager by Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Store</label>
            <Dialog open={storeAssignmentDialogOpen} onOpenChange={(open) => {
              setStoreAssignmentDialogOpen(open);
              if (!open) setStoreAssignmentSearch("");
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Store className="h-4 w-4 mr-2" />
                  {selectedStoreForAssignment ? (
                    <span className="truncate">
                      {stores.find(s => s.id === selectedStoreForAssignment)?.store_hq?.name} - {stores.find(s => s.id === selectedStoreForAssignment)?.location}
                    </span>
                  ) : "Select a store to assign owner"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Select Store</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search by store name or location..."
                    value={storeAssignmentSearch}
                    onChange={(e) => setStoreAssignmentSearch(e.target.value)}
                  />
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {stores.filter(store => {
                      const searchTerm = storeAssignmentSearch.toLowerCase();
                      if (!searchTerm) return true;
                      const storeName = store.store_hq?.name?.toLowerCase() || "";
                      const location = store.location?.toLowerCase() || "";
                      return storeName.includes(searchTerm) || location.includes(searchTerm);
                    }).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No stores found
                      </p>
                    ) : (
                      stores.filter(store => {
                        const searchTerm = storeAssignmentSearch.toLowerCase();
                        if (!searchTerm) return true;
                        const storeName = store.store_hq?.name?.toLowerCase() || "";
                        const location = store.location?.toLowerCase() || "";
                        return storeName.includes(searchTerm) || location.includes(searchTerm);
                      }).map((store) => (
                        <Card 
                          key={store.id} 
                          className={`cursor-pointer transition-all hover:bg-accent hover:border-primary ${
                            selectedStoreForAssignment === store.id ? "border-primary bg-accent/50" : ""
                          }`}
                          onClick={() => {
                            setSelectedStoreForAssignment(store.id);
                            setStoreAssignmentDialogOpen(false);
                            setStoreAssignmentSearch("");
                          }}
                        >
                          <CardContent className="p-4">
                            <p className="font-semibold">{store.store_hq?.name}</p>
                            <p className="text-sm text-muted-foreground">{store.location}</p>
                            {store.store_owner_id && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Current Owner: {store.profiles?.display_name || store.store_owner_id}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Search User by Email</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email to search..."
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsersByEmail()}
              />
              <Button onClick={searchUsersByEmail}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Results</label>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <Card key={result.user_id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{result.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.display_name || "No display name"}
                        </p>
                        <p className="text-xs text-muted-foreground">{result.user_id}</p>
                      </div>
                      <Button
                        onClick={() => {
                          if (!selectedStoreForAssignment) {
                            toast({ 
                              title: "Error", 
                              description: "Please select a store first", 
                              variant: "destructive" 
                            });
                            return;
                          }
                          assignUserToStore(result.user_id, selectedStoreForAssignment);
                        }}
                        disabled={!selectedStoreForAssignment}
                      >
                        Assign to Store
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
