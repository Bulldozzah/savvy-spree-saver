import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Building2, Pencil } from "lucide-react";
import { z } from "zod";

const hqSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters")
});

const storeSchema = z.object({
  hq_id: z.string().uuid("Invalid HQ selection"),
  location: z.string().trim().min(1, "Location is required").max(200, "Location must be less than 200 characters"),
  store_owner_id: z.string().uuid("Invalid User ID").nullable().or(z.literal(""))
});

export function StoresView() {
  const { toast } = useToast();
  const [hqName, setHqName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedHq, setSelectedHq] = useState("");
  const [hqs, setHqs] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [filteredStores, setFilteredStores] = useState<any[]>([]);
  const [filterHqId, setFilterHqId] = useState<string>("all");
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState("");
  const [storeCsvFile, setStoreCsvFile] = useState<File | null>(null);
  const [isUploadingStoreCsv, setIsUploadingStoreCsv] = useState(false);
  const [csvSelectedHq, setCsvSelectedHq] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStoreData, setEditingStoreData] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    location: "",
    address: "",
    contact: "",
    whatsapp: "",
    email: "",
    latitude: "",
    longitude: "",
    city: ""
  });

  useEffect(() => {
    loadHqs();
    loadStores();
  }, []);

  useEffect(() => {
    let filtered = stores;
    
    // Filter by HQ
    if (filterHqId !== "all") {
      filtered = filtered.filter(store => store.hq_id === filterHqId);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(store => 
        store.store_hq?.name?.toLowerCase().includes(search) ||
        store.location?.toLowerCase().includes(search) ||
        store.city?.toLowerCase().includes(search)
      );
    }
    
    setFilteredStores(filtered);
  }, [stores, filterHqId, searchTerm]);

  const loadHqs = async () => {
    const { data } = await supabase.from("store_hq").select("*");
    setHqs(data || []);
  };

  const loadStores = async () => {
    const { data, error } = await supabase
      .from("stores")
      .select("*, store_hq(name)")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: "Failed to load stores", variant: "destructive" });
      return;
    }

    if (data && data.length > 0) {
      const ownerIds = data.filter(s => s.store_owner_id).map(s => s.store_owner_id);
      
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", ownerIds);
        
        const storesWithProfiles = data.map(store => {
          const profile = profilesData?.find(p => p.user_id === store.store_owner_id);
          return {
            ...store,
            profiles: profile
          };
        });
        
        setStores(storesWithProfiles);
        return;
      }
    }
    
    setStores(data || []);
  };

  const createHQ = async () => {
    const result = hqSchema.safeParse({ name: hqName });
    if (!result.success) {
      toast({ 
        title: "Validation Error", 
        description: result.error.issues[0].message, 
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase.from("store_hq").insert({ name: result.data.name });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Store HQ created" });
      setHqName("");
      loadHqs();
    }
  };

  const createStore = async () => {
    if (!selectedHq || !location.trim()) {
      toast({ 
        title: "Validation Error", 
        description: "Please select HQ and enter location", 
        variant: "destructive" 
      });
      return;
    }

    const result = storeSchema.safeParse({ 
      hq_id: selectedHq, 
      location, 
      store_owner_id: null 
    });
    
    if (!result.success) {
      toast({ 
        title: "Validation Error", 
        description: result.error.issues[0].message, 
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase.from("stores").insert({
      hq_id: result.data.hq_id,
      location: result.data.location,
      store_owner_id: null,
    });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Store created" });
      setLocation("");
      setSelectedHq("");
      loadStores();
    }
  };

  const updateStoreLocation = async (storeId: string, newLocation: string) => {
    if (!newLocation.trim()) {
      toast({ title: "Error", description: "Location cannot be empty", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("stores")
      .update({ location: newLocation })
      .eq("id", storeId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Store location updated" });
      setEditingStoreId(null);
      setEditingLocation("");
      loadStores();
    }
  };

  const deleteStore = async (storeId: string) => {
    const { error } = await supabase
      .from("stores")
      .delete()
      .eq("id", storeId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Store deleted" });
      loadStores();
    }
  };

  const assignStoreManager = async (storeId: string, userId: string) => {
    if (!userId.trim()) {
      toast({ title: "Error", description: "Please enter user ID", variant: "destructive" });
      return;
    }

    const result = z.string().uuid().safeParse(userId);
    if (!result.success) {
      toast({ title: "Error", description: "Invalid UUID format", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("stores")
      .update({ store_owner_id: userId })
      .eq("id", storeId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Store manager assigned" });
      loadStores();
    }
  };

  const unassignStoreManager = async (storeId: string) => {
    const { error } = await supabase
      .from("stores")
      .update({ store_owner_id: null })
      .eq("id", storeId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Store manager unassigned" });
      loadStores();
    }
  };

  const handleStoreCsvUpload = async () => {
    if (!csvSelectedHq) {
      toast({ title: "Error", description: "Please select an HQ first", variant: "destructive" });
      return;
    }

    if (!storeCsvFile) {
      toast({ title: "Error", description: "Please select a CSV file", variant: "destructive" });
      return;
    }

    setIsUploadingStoreCsv(true);

    try {
      const text = await storeCsvFile.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      const startIndex = lines[0].toLowerCase().includes("location") ? 1 : 0;
      
      const stores: Array<{ hq_id: string; location: string; store_owner_id: null }> = [];
      const validationErrors: string[] = [];
      
      lines.slice(startIndex).forEach((line, idx) => {
        const location = line.trim();
        if (!location) {
          validationErrors.push(`Line ${startIndex + idx + 1}: Missing location`);
          return;
        }
        
        const result = storeSchema.safeParse({ hq_id: csvSelectedHq, location, store_owner_id: null });
        if (!result.success) {
          validationErrors.push(`Line ${startIndex + idx + 1}: ${result.error.issues[0].message}`);
          return;
        }
        stores.push({ hq_id: csvSelectedHq, location: result.data.location, store_owner_id: null });
      });

      if (validationErrors.length > 0) {
        toast({
          title: "Validation Errors",
          description: validationErrors.join("; "),
          variant: "destructive",
        });
        setIsUploadingStoreCsv(false);
        return;
      }

      if (stores.length === 0) {
        toast({
          title: "Error",
          description: "No valid stores found. Format: One location per line",
          variant: "destructive",
        });
        setIsUploadingStoreCsv(false);
        return;
      }

      const { error } = await supabase.from("stores").insert(stores);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `${stores.length} stores imported successfully` });
        setStoreCsvFile(null);
        setCsvSelectedHq("");
        const fileInput = document.getElementById("store-csv-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        loadStores();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to parse CSV file", variant: "destructive" });
    }

    setIsUploadingStoreCsv(false);
  };

  const downloadStoreTemplate = () => {
    const template = `Location
Downtown Branch
North Side Store
Eastside Location
Westside Mall
Central Plaza
Southside Shopping Center`;
    
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "store_locations_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Success", description: "Template downloaded successfully" });
  };

  const openEditDialog = (store: any) => {
    setEditingStoreData(store);
    setEditFormData({
      location: store.location || "",
      address: store.address || "",
      contact: store.contact || "",
      whatsapp: store.whatsapp || "",
      email: store.email || "",
      latitude: store.latitude?.toString() || "",
      longitude: store.longitude?.toString() || "",
      city: store.city || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleEditStore = async () => {
    if (!editingStoreData) return;

    const updateData: any = {
      location: editFormData.location.trim(),
      address: editFormData.address.trim() || null,
      contact: editFormData.contact.trim() || null,
      whatsapp: editFormData.whatsapp.trim() || null,
      email: editFormData.email.trim() || null,
      city: editFormData.city.trim() || null,
      latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : null,
      longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : null,
    };

    if (!updateData.location) {
      toast({ title: "Error", description: "Location name is required", variant: "destructive" });
      return;
    }

    if (editFormData.latitude && isNaN(parseFloat(editFormData.latitude))) {
      toast({ title: "Error", description: "Invalid latitude value", variant: "destructive" });
      return;
    }

    if (editFormData.longitude && isNaN(parseFloat(editFormData.longitude))) {
      toast({ title: "Error", description: "Invalid longitude value", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("stores")
      .update(updateData)
      .eq("id", editingStoreData.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Store updated successfully" });
      setIsEditDialogOpen(false);
      setEditingStoreData(null);
      loadStores();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Store HQ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="HQ Name (e.g., Walmart, Target)"
            value={hqName}
            onChange={(e) => setHqName(e.target.value)}
          />
          <Button onClick={createHQ}>Create HQ</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Single Store</h3>
              <Select value={selectedHq} onValueChange={setSelectedHq}>
                <SelectTrigger>
                  <SelectValue placeholder="Select HQ" />
                </SelectTrigger>
                <SelectContent>
                  {hqs.map((hq) => (
                    <SelectItem key={hq.id} value={hq.id}>{hq.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Location (e.g., Downtown, North Side)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-2"
              />
              <Button onClick={createStore} className="mt-2">Create Store</Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Bulk Import (CSV)</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a CSV file with one location per line. Optional header: "Location"
              </p>
              <Button 
                onClick={downloadStoreTemplate}
                variant="outline"
                size="sm"
                className="mb-2"
              >
                Download CSV Template
              </Button>
              <Select value={csvSelectedHq} onValueChange={setCsvSelectedHq}>
                <SelectTrigger>
                  <SelectValue placeholder="Select HQ for CSV import" />
                </SelectTrigger>
                <SelectContent>
                  {hqs.map((hq) => (
                    <SelectItem key={hq.id} value={hq.id}>{hq.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="store-csv-upload"
                type="file"
                accept=".csv"
                onChange={(e) => setStoreCsvFile(e.target.files?.[0] || null)}
                className="mt-2"
              />
              <Button 
                onClick={handleStoreCsvUpload} 
                disabled={isUploadingStoreCsv}
                className="mt-2"
              >
                {isUploadingStoreCsv ? "Uploading..." : "Upload Stores CSV"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Stores</CardTitle>
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Search by store name, location, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterHqId} onValueChange={setFilterHqId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by HQ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All HQs</SelectItem>
                {hqs.map((hq) => (
                  <SelectItem key={hq.id} value={hq.id}>{hq.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStores.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No stores found</p>
          ) : (
            <div className="space-y-3">
              {filteredStores.map((store) => (
                <div key={store.id} className="border rounded p-4 bg-green-50 dark:bg-green-950/20">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{store.store_hq?.name}</p>
                      <p className="text-muted-foreground mt-1">{store.location}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manager: {store.profiles?.display_name || "Unassigned"}
                        {store.store_owner_id && (
                          <span className="text-xs ml-2">({store.store_owner_id})</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                        onClick={() => openEditDialog(store)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteStore(store.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    {!store.store_owner_id ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="User ID (UUID)"
                          id={`manager-${store.id}`}
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById(`manager-${store.id}`) as HTMLInputElement;
                            assignStoreManager(store.id, input.value);
                          }}
                        >
                          Assign Owner
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => unassignStoreManager(store.id)}
                      >
                        Unassign Owner
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Store Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-location">Location Name / Branch *</Label>
              <Input
                id="edit-location"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                placeholder="e.g., Downtown Branch, North Side Store"
              />
            </div>

            <div>
              <Label htmlFor="edit-address">Full Address</Label>
              <Input
                id="edit-address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                placeholder="e.g., 123 Main Street, Suite 100"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-city">City</Label>
              <Input
                id="edit-city"
                value={editFormData.city}
                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                placeholder="e.g., New York"
              />
            </div>

            <div>
              <Label htmlFor="edit-contact">Contact Number</Label>
              <Input
                id="edit-contact"
                value={editFormData.contact}
                onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })}
                placeholder="e.g., +1234567890"
              />
            </div>

            <div>
              <Label htmlFor="edit-whatsapp">WhatsApp</Label>
              <Input
                id="edit-whatsapp"
                value={editFormData.whatsapp}
                onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                placeholder="e.g., +1234567890"
              />
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="e.g., store@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input
                  id="edit-latitude"
                  value={editFormData.latitude}
                  onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                  placeholder="e.g., 40.7128"
                  type="number"
                  step="any"
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input
                  id="edit-longitude"
                  value={editFormData.longitude}
                  onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                  placeholder="e.g., -74.0060"
                  type="number"
                  step="any"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStore}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
