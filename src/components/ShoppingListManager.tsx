import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, MessageCircle, Phone, Share2, DollarSign, MapPin, ChevronDown, Check, ChevronsUpDown, Store, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ShoppingListManagerProps {
  list: any;
  items: any[];
  stores: any[];
  currencySymbol: string;
  selectedStore?: any;
  storePrices: Record<string, any>;
  userProfile?: any;
}

export const ShoppingListManager = ({
  list,
  items,
  stores,
  currencySymbol,
  selectedStore,
  storePrices,
  userProfile
}: ShoppingListManagerProps) => {
  const { toast } = useToast();
  const [assignedStoreId, setAssignedStoreId] = useState<string>(list.assigned_store_id || selectedStore?.id || "");
  const [storeContactInfo, setStoreContactInfo] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [recipientType, setRecipientType] = useState<"store" | "others">("store");
  const [localStorePrices, setLocalStorePrices] = useState<Record<string, any>>(storePrices);

  useEffect(() => {
    if (assignedStoreId) {
      loadStoreContactInfo(assignedStoreId);
      loadStorePrices(assignedStoreId);
    }
  }, [assignedStoreId]);

  useEffect(() => {
    setLocalStorePrices(storePrices);
  }, [storePrices]);

  const loadStoreContactInfo = async (storeId: string) => {
    const { data, error } = await supabase
      .from("stores")
      .select("email, contact, whatsapp, address, latitude, longitude, location")
      .eq("id", storeId)
      .maybeSingle();
    
    if (error) {
      console.error("Error loading store contact info:", error);
    }
    setStoreContactInfo(data);
  };

  const loadStorePrices = async (storeId: string) => {
    const productGtins = items.map(item => item.product_gtin);
    
    const { data, error } = await supabase
      .from("store_prices")
      .select("product_gtin, price, in_stock")
      .eq("store_id", storeId)
      .in("product_gtin", productGtins);
    
    if (error) {
      console.error("Error loading store prices:", error);
      return;
    }
    
    // Convert array to object keyed by product_gtin
    const pricesMap = (data || []).reduce((acc, item) => {
      acc[item.product_gtin] = item;
      return acc;
    }, {} as Record<string, any>);
    
    setLocalStorePrices(pricesMap);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const price = localStorePrices[item.product_gtin];
      if (price) {
        return sum + (Number(price.price) * item.quantity);
      }
      return sum;
    }, 0);
  };

  const handleAssignToStore = async () => {
    if (!assignedStoreId) {
      toast({ title: "Error", description: "Please select a store", variant: "destructive" });
      return;
    }

    // Update shopping list with assigned store
    const { error } = await supabase
      .from("shopping_lists")
      .update({ assigned_store_id: assignedStoreId } as any)
      .eq("id", list.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await loadStoreContactInfo(assignedStoreId);
      toast({ title: "Success", description: "List assigned to store" });
    }
  };

  const generateListText = (includeStoreInfo = true) => {
    let text = `Shopping List: ${list.name}\n`;
    
    if (includeStoreInfo && assignedStoreId) {
      const assignedStore = stores.find(s => s.id === assignedStoreId);
      if (assignedStore) {
        text += `Store: ${assignedStore.store_hq?.name || "Store"} - ${assignedStore.location}\n`;
      }
    }
    
    // Add shopper contact info
    if (userProfile) {
      text += `\nShopper Contact:\n`;
      if (userProfile.display_name) text += `Name: ${userProfile.display_name}\n`;
      if (userProfile.email) text += `Email: ${userProfile.email}\n`;
      if (userProfile.whatsapp) text += `WhatsApp: ${userProfile.whatsapp}\n`;
      if (userProfile.contact) text += `Contact: ${userProfile.contact}\n`;
    }
    
    text += `\nItems:\n`;

    items.forEach((item, index) => {
      const price = localStorePrices[item.product_gtin];
      text += `${index + 1}. ${item.products?.description || item.product_gtin}\n`;
      text += `   Quantity: ${item.quantity}`;
      if (price && includeStoreInfo) {
        text += ` | Price: ${currencySymbol}${price.price}`;
        text += ` | Subtotal: ${currencySymbol}${(Number(price.price) * item.quantity).toFixed(2)}`;
        text += ` | ${price.in_stock ? 'In Stock' : 'Out of Stock'}`;
      }
      text += `\n`;
    });

    // Calculate total (only if including store info)
    if (includeStoreInfo) {
      const total = items.reduce((sum, item) => {
        const price = localStorePrices[item.product_gtin];
        if (price) {
          return sum + (Number(price.price) * item.quantity);
        }
        return sum;
      }, 0);

      if (total > 0) {
        text += `\nTotal: ${currencySymbol}${total.toFixed(2)}`;
      }
    }

    return text;
  };

  const handleShareEmail = () => {
    if (!storeContactInfo?.email) {
      toast({ 
        title: "Missing Contact Info", 
        description: "This store doesn't have an email address on file", 
        variant: "destructive" 
      });
      return;
    }
    const subject = encodeURIComponent(`Shopping List: ${list.name}`);
    const body = encodeURIComponent(generateListText(!!assignedStoreId));
    window.open(`mailto:${storeContactInfo.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    if (!storeContactInfo?.whatsapp) {
      toast({ 
        title: "Missing Contact Info", 
        description: "This store doesn't have a WhatsApp number on file", 
        variant: "destructive" 
      });
      return;
    }
    const text = encodeURIComponent(generateListText(!!assignedStoreId));
    const phone = storeContactInfo.whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleShareSMS = () => {
    if (!storeContactInfo?.contact) {
      toast({ 
        title: "Missing Contact Info", 
        description: "This store doesn't have a contact number on file", 
        variant: "destructive" 
      });
      return;
    }
    const text = encodeURIComponent(generateListText(!!assignedStoreId));
    window.open(`sms:${storeContactInfo.contact}?body=${text}`, '_blank');
  };

  const handleShareGeneric = async () => {
    const text = generateListText(!!assignedStoreId);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Shopping List: ${list.name}`,
          text: text
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Shopping list copied to clipboard" });
    }
  };

  // Generic sharing functions for "others" mode
  const handleShareEmailGeneric = () => {
    const subject = encodeURIComponent(`Shopping List: ${list.name}`);
    const body = encodeURIComponent(generateListText(!!assignedStoreId));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleShareWhatsAppGeneric = () => {
    const text = encodeURIComponent(generateListText(!!assignedStoreId));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareSMSGeneric = () => {
    const text = encodeURIComponent(generateListText(!!assignedStoreId));
    window.open(`sms:?body=${text}`, '_blank');
  };

  const handleShareLocationWhatsApp = () => {
    if (!storeContactInfo) {
      toast({
        title: "Store Not Selected",
        description: "Please assign a store first",
        variant: "destructive"
      });
      return;
    }

    const address = storeContactInfo.address;
    const latitude = storeContactInfo.latitude;
    const longitude = storeContactInfo.longitude;
    
    if (!address && !latitude && !longitude) {
      toast({
        title: "Location Not Available",
        description: "This store doesn't have address or coordinates on file",
        variant: "destructive"
      });
      return;
    }

    let locationText = "Store Location:\n";
    
    // Add full address if available
    if (address) {
      locationText += `Address: ${address}\n`;
    }
    
    // Add coordinates and Google Maps link
    if (latitude && longitude) {
      locationText += `Coordinates: ${latitude}, ${longitude}\n`;
      locationText += `Map: https://www.google.com/maps?q=${latitude},${longitude}`;
    } else if (address) {
      // If no coordinates, create a search link with the address
      const encodedAddress = encodeURIComponent(address);
      locationText += `Map: https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }
    
    const text = encodeURIComponent(locationText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Shopping List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={recipientType} onValueChange={(value) => setRecipientType(value as "store" | "others")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="store" id="store" />
              <Label htmlFor="store" className="flex items-center cursor-pointer">
                <Store className="mr-2 h-4 w-4" />
                Send to Store
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="others" id="others" />
              <Label htmlFor="others" className="flex items-center cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                Send to Others (Courier/Contact)
              </Label>
            </div>
          </RadioGroup>

          {recipientType === "store" ? (
            <div className="space-y-4 pt-4 border-t">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {assignedStoreId
                  ? stores.find((store) => store.id === assignedStoreId)
                      ? `${stores.find((store) => store.id === assignedStoreId)?.store_hq?.name || "Store"} - ${stores.find((store) => store.id === assignedStoreId)?.location}`
                      : "Select a store"
                  : "Select a store"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search stores..." />
                <CommandList>
                  <CommandEmpty>No store found.</CommandEmpty>
                  <CommandGroup>
                    {stores.map((store) => (
                      <CommandItem
                        key={store.id}
                        value={`${store.store_hq?.name || "Store"} - ${store.location}`}
                        onSelect={() => {
                          setAssignedStoreId(store.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            assignedStoreId === store.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {store.store_hq?.name || "Store"} - {store.location}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
              <Button onClick={handleAssignToStore} className="w-full">
                Assign to Store
              </Button>
              
              {assignedStoreId && (
                <Alert className="bg-primary/5 border-primary/20">
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    <div className="font-semibold text-lg">
                      Total: {currencySymbol}{calculateTotal().toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {stores.find(s => s.id === assignedStoreId)?.store_hq?.name || "Store"} - {stores.find(s => s.id === assignedStoreId)?.location}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold">Share with Store</h3>
                {!assignedStoreId ? (
                  <Alert>
                    <AlertDescription>
                      Assign this list to a store to share directly with them
                    </AlertDescription>
                  </Alert>
                ) : assignedStoreId && (!storeContactInfo?.email && !storeContactInfo?.whatsapp && !storeContactInfo?.contact) ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      This store doesn't have contact information on file.
                    </AlertDescription>
                  </Alert>
                ) : null}
                
                <Button 
                  onClick={handleShareEmail} 
                  className="w-full" 
                  variant="outline"
                  disabled={!assignedStoreId}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {storeContactInfo?.email ? `Email ${storeContactInfo.email}` : 'Share via Email'}
                </Button>
                <Button 
                  onClick={handleShareWhatsApp} 
                  className="w-full" 
                  variant="outline"
                  disabled={!assignedStoreId}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {storeContactInfo?.whatsapp ? `WhatsApp ${storeContactInfo.whatsapp}` : 'Share via WhatsApp'}
                </Button>
                <Button 
                  onClick={handleShareSMS} 
                  className="w-full" 
                  variant="outline"
                  disabled={!assignedStoreId}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  {storeContactInfo?.contact ? `SMS ${storeContactInfo.contact}` : 'Share via SMS'}
                </Button>
                
                <Button 
                  onClick={handleShareLocationWhatsApp}
                  className="w-full" 
                  variant="outline"
                  disabled={!assignedStoreId}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Share Store Location via WhatsApp
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-4 border-t">
              <Alert>
                <AlertDescription>
                  Share your shopping list with courier services or any contact
                </AlertDescription>
              </Alert>
              
              <Button onClick={handleShareGeneric} className="w-full" variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share to Contact
              </Button>
              
              <div className="pt-2">
                <h3 className="font-semibold mb-2">Share via</h3>
                <div className="space-y-2">
                  <Button 
                    onClick={handleShareWhatsAppGeneric} 
                    className="w-full" 
                    variant="outline"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Share via WhatsApp
                  </Button>
                  <Button 
                    onClick={handleShareSMSGeneric} 
                    className="w-full" 
                    variant="outline"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Share via SMS
                  </Button>
                  <Button 
                    onClick={handleShareEmailGeneric} 
                    className="w-full" 
                    variant="outline"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Share via Email
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>List Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded">
            {generateListText(!!assignedStoreId)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
