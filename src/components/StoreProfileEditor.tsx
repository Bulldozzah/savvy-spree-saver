import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/neon-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { countries } from "@/data/countries";
import { MapPin, Move, Locate } from "lucide-react";

// Type declarations for Google Maps API
declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_MAPS_API_KEY = "AIzaSyBEBm7NkYPyL89G-tKiQGFc5YHcBuEBKpk";

// Load Google Maps API with Places library
const loadGoogleMapsScript = () => {
  if (document.getElementById('google-maps-script')) {
    return Promise.resolve();
  }
  
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
};

interface StoreProfileEditorProps {
  onComplete?: () => void;
}

export const StoreProfileEditor = ({ onComplete }: StoreProfileEditorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [storeContact, setStoreContact] = useState({
    email: "",
    contact: "",
    whatsapp: "",
    country: "",
    currency: "",
    phone_area_code: "",
    location: "",
    address: "",
  });

  useEffect(() => {
    loadStoreProfile();
  }, []);

  useEffect(() => {
    // Initialize Google Places Autocomplete
    loadGoogleMapsScript().then(() => {
      if (!locationInputRef.current || !window.google) return;

      const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'geometry', 'name'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          toast({
            title: "Invalid location",
            description: "Please select a valid address from the suggestions.",
            variant: "destructive",
          });
          return;
        }

        // Update address field (not location)
        const address = place.formatted_address || place.name || '';
        setStoreContact(prev => ({ ...prev, address: address }));

        // Automatically set coordinates
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setCoordinates([lat, lng]);
        setLocationError(""); // Clear error when location is selected

        toast({
          title: "Location selected",
          description: "Address and map updated successfully.",
        });
      });
    }).catch((error) => {
      console.error('Failed to load Google Maps:', error);
      toast({
        title: "Google Maps failed to load",
        description: "Please verify the API key and that Maps JavaScript and Places APIs are enabled.",
        variant: "destructive",
      });
    });
  }, [toast]);

  // Initialize Google Map once
  useEffect(() => {
    const init = async () => {
      try {
        await loadGoogleMapsScript();
        if (!mapRef.current || !window.google) return;
        const map = new window.google.maps.Map(mapRef.current, {
          center: coordinates ? { lat: coordinates[0], lng: coordinates[1] } : { lat: 0, lng: 0 },
          zoom: coordinates ? 15 : 2,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });
        mapInstanceRef.current = map;
      } catch (e) {
        console.error('Map init failed', e);
      }
    };
    init();

    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker and center when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    const map = mapInstanceRef.current;

    if (!coordinates) return;

    const pos = { lat: coordinates[0], lng: coordinates[1] };

    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        position: pos,
        map,
        draggable: true,
        title: 'Drag to adjust location',
      });
      markerRef.current.addListener('dragend', () => {
        const position = markerRef.current.getPosition();
        if (position) {
          setCoordinates([position.lat(), position.lng()]);
          toast({
            title: 'Location updated',
            description: "Marker moved. Click 'Save Store Profile' to persist.",
          });
        }
      });
    } else {
      markerRef.current.setPosition(pos);
    }

    map.panTo(pos);
    map.setZoom(15);
  }, [coordinates, toast]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates([latitude, longitude]);
        setLocationError(""); // Clear error when location is detected
        
        // Reverse geocode to get address
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                setStoreContact(prev => ({ ...prev, address: results[0].formatted_address }));
              }
            }
          );
        }
        
        toast({
          title: "Location detected",
          description: "Your current location has been set on the map.",
        });
        setLoading(false);
      },
      (error) => {
        let message = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please enable location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out.";
        }
        
        toast({
          title: "Location error",
          description: message,
          variant: "destructive",
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const loadStoreProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: store, error } = await supabase
      .from("stores")
      .select("*")
      .eq("store_owner_id", user.id)
      .maybeSingle();

    if (store) {
      setHasStore(true);
      setStoreId(store.id);
      setStoreContact({
        email: store.email || "",
        contact: store.contact || "",
        whatsapp: store.whatsapp || "",
        country: store.city || "",
        currency: "",
        phone_area_code: "",
        location: store.location || "",
        address: store.address || "",
      });
      
      // Load saved coordinates if available
      if (store.latitude && store.longitude) {
        setCoordinates([Number(store.latitude), Number(store.longitude)]);
      }
    } else {
      setHasStore(false);
    }
  };

  const handleCountryChange = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    if (country) {
      setStoreContact(prev => ({
        ...prev,
        country: countryName,
        currency: country.currencyCode,
        phone_area_code: country.phoneCode,
      }));
    }
  };


  const handleSave = async () => {
    if (!storeId) {
      toast({
        title: "Error",
        description: "You don't own a store",
        variant: "destructive",
      });
      return;
    }

    // Validate location and coordinates
    if (!storeContact.location || !storeContact.location.trim()) {
      setLocationError("Store location name is required");
      toast({
        title: "Validation Error",
        description: "Please enter a store location name (e.g., Downtown Branch)",
        variant: "destructive",
      });
      return;
    }

    if (!storeContact.address || !storeContact.address.trim()) {
      setLocationError("Store address is required");
      toast({
        title: "Validation Error",
        description: "Please enter a store address",
        variant: "destructive",
      });
      return;
    }

    if (!coordinates) {
      setLocationError("Please select a location from the map suggestions to set coordinates");
      toast({
        title: "Validation Error",
        description: "Please select your location from the address suggestions or use current location",
        variant: "destructive",
      });
      return;
    }

    setLocationError(""); // Clear any previous errors
    setLoading(true);

    const { error } = await supabase
      .from("stores")
      .update({
        email: storeContact.email,
        contact: storeContact.contact,
        whatsapp: storeContact.whatsapp,
        location: storeContact.location,
        address: storeContact.address,
        latitude: coordinates ? coordinates[0] : null,
        longitude: coordinates ? coordinates[1] : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Store profile updated successfully",
      });
      onComplete?.();
    }
    setLoading(false);
  };

  if (!hasStore) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't own a store yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select value={storeContact.country} onValueChange={handleCountryChange}>
          <SelectTrigger id="country">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.name} value={country.name}>
                {country.name} ({country.currencySymbol} {country.currencyCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {storeContact.country && (
        <>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input value={`${storeContact.currency}`} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Phone Code</Label>
            <Input value={storeContact.phone_area_code} disabled className="bg-muted" />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="store_email">Store Email</Label>
        <Input
          id="store_email"
          type="email"
          value={storeContact.email}
          onChange={(e) => setStoreContact({ ...storeContact, email: e.target.value })}
          placeholder="store@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store_contact">Store Contact Number</Label>
        <div className="flex gap-2">
          <Input
            value={storeContact.phone_area_code}
            disabled
            className="w-24 bg-muted"
          />
          <Input
            id="store_contact"
            value={storeContact.contact}
            onChange={(e) => setStoreContact({ ...storeContact, contact: e.target.value })}
            placeholder="Contact number"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="store_whatsapp">Store WhatsApp</Label>
        <div className="flex gap-2">
          <Input
            value={storeContact.phone_area_code}
            disabled
            className="w-24 bg-muted"
          />
          <Input
            id="store_whatsapp"
            value={storeContact.whatsapp}
            onChange={(e) => setStoreContact({ ...storeContact, whatsapp: e.target.value })}
            placeholder="WhatsApp number"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="store_location">Store Location / Branch Name *</Label>
        <Input
          id="store_location"
          type="text"
          value={storeContact.location}
          onChange={(e) => setStoreContact({ ...storeContact, location: e.target.value })}
          placeholder="e.g., Downtown Branch, North Side Store"
        />
        <p className="text-xs text-muted-foreground">
          Enter a name for this store location (e.g., "Downtown Branch")
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="store_address">Store Address *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={loading}
          >
            <Locate className="h-4 w-4 mr-2" />
            Use Current Location
          </Button>
        </div>
        <Input
          ref={locationInputRef}
          id="store_address"
          type="text"
          autoComplete="off"
          value={storeContact.address}
          onChange={(e) => {
            setStoreContact({ ...storeContact, address: e.target.value });
            if (locationError) setLocationError(""); // Clear error on change
          }}
          placeholder="Start typing your store address..."
          className={`w-full ${locationError ? "border-destructive" : ""}`}
        />
        {locationError ? (
          <p className="text-xs text-destructive font-medium">{locationError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Start typing to search for your store's address and select from suggestions
          </p>
        )}
        
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Move className="h-4 w-4" />
              <span>
                {coordinates ? 'Drag the marker to fine-tune your exact location' : 'Search an address, then drag the marker to fine-tune.'}
              </span>
            </div>
            <div
              ref={mapRef}
              className="h-[400px] rounded-lg overflow-hidden border"
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {coordinates ? (
                  <>Coordinates: {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}</>
                ) : (
                  <span>No location selected yet</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!coordinates}
                onClick={() => {
                  if (!coordinates) return;
                  const url = `https://www.google.com/maps/search/?api=1&query=${coordinates[0]},${coordinates[1]}`;
                  window.open(url, '_blank');
                }}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Open in Google Maps
              </Button>
            </div>
          </div>
      </div>

      <Button variant="solid" onClick={handleSave} disabled={loading} className="w-full">
        {loading ? "Saving..." : "Save Store Profile"}
      </Button>
    </div>
  );
};
