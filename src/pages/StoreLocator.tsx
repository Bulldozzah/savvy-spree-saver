import { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Phone, Mail, MessageCircle, X, Search, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/wise-up-shop-logo.png";

interface Store {
  id: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  email: string | null;
  contact: string | null;
  whatsapp: string | null;
  city: string | null;
  hq_id: string;
  store_hq?: {
    name: string;
  };
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 0,
  lng: 0
};

const StoreLocator = () => {
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(2);
  const [hoveredStore, setHoveredStore] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    // Fit map bounds when stores change
    if (mapInstance && filteredStores.length > 0 && !userLocation) {
      const bounds = new google.maps.LatLngBounds();
      filteredStores.forEach(store => {
        if (store.latitude && store.longitude) {
          bounds.extend({ lat: store.latitude, lng: store.longitude });
        }
      });
      mapInstance.fitBounds(bounds);
    }
  }, [mapInstance, filteredStores, userLocation]);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select(`
          *,
          store_hq:store_hq(name)
        `)
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (error) throw error;

      setStores(data || []);
      setFilteredStores(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading stores",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
  };

  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredStores(stores);
      return;
    }

    const filtered = stores.filter((store) => {
      const storeName = store.store_hq?.name?.toLowerCase() || "";
      const location = store.location?.toLowerCase() || "";
      const city = store.city?.toLowerCase() || "";
      
      return storeName.includes(query) || location.includes(query) || city.includes(query);
    });

    setFilteredStores(filtered);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Calculate distance between two coordinates using Haversine formula (in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setMapCenter(location);
        setMapZoom(12);
        
        // Sort stores by distance from user
        const storesWithDistance = filteredStores.map(store => ({
          ...store,
          distance: store.latitude && store.longitude 
            ? calculateDistance(location.lat, location.lng, Number(store.latitude), Number(store.longitude))
            : Infinity,
        })).sort((a, b) => a.distance - b.distance);
        
        setFilteredStores(storesWithDistance);
        setIsGettingLocation(false);
        
        toast({
          title: "Location found",
          description: "Stores are now sorted by distance from you.",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Unable to get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please enable location access in your browser.";
        }
        toast({
          title: "Location error",
          description: message,
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Wise-Up Shop" className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Store Locator</h1>
          <p className="text-muted-foreground">
            Find stores near you. Click on a marker or store card to view details.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[600px]">
            <p>Loading stores...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="flex items-center justify-center h-[600px]">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>No Stores Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  There are currently no stores with location data available.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "map")} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="list">Store List</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Search by store name, location, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="pr-8"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setFilteredStores(stores);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={handleUseMyLocation} 
                  variant="outline"
                  disabled={isGettingLocation}
                  className="gap-2"
                >
                  <Navigation className="h-4 w-4" />
                  {isGettingLocation ? "Getting location..." : "Use my location"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStores.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No stores found matching your search.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredStores.map((store) => (
                <Card
                  key={store.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedStore?.id === store.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleStoreSelect(store)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span>{store.store_hq?.name || "Store"}</span>
                      <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{store.location}</p>
                    {store.city && (
                      <p className="text-sm text-muted-foreground">City: {store.city}</p>
                    )}
                    {userLocation && store.latitude && store.longitude && (
                      <p className="text-sm font-medium text-primary">
                        {calculateDistance(userLocation.lat, userLocation.lng, Number(store.latitude), Number(store.longitude)).toFixed(1)} km away
                      </p>
                    )}
                    {store.contact && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4" />
                        <span>{store.contact}</span>
                      </div>
                    )}
                    {store.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        <span>{store.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="map" className="h-[600px]">
              <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={mapZoom}
                  onLoad={(map) => setMapInstance(map)}
                  options={{
                    mapTypeId: 'roadmap',
                    mapTypeControl: true,
                    mapTypeControlOptions: {
                      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                      position: google.maps.ControlPosition.TOP_RIGHT,
                      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
                    },
                    streetViewControl: true,
                    fullscreenControl: true,
                  }}
                >
                  {userLocation && (
                    <Marker
                      position={userLocation}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                        scaledSize: new google.maps.Size(40, 40),
                      }}
                    />
                  )}
                  
                  {filteredStores.map((store) => {
                    if (store.latitude && store.longitude) {
                      return (
                        <Marker
                          key={store.id}
                          position={{ lat: store.latitude, lng: store.longitude }}
                          onClick={() => setSelectedStore(store)}
                          onMouseOver={() => setHoveredStore(store.id)}
                          onMouseOut={() => setHoveredStore(null)}
                        >
                          {hoveredStore === store.id && (
                            <InfoWindow
                              position={{ lat: store.latitude, lng: store.longitude }}
                              onCloseClick={() => setHoveredStore(null)}
                            >
                              <div className="p-2">
                                <h3 className="font-semibold text-base mb-2">
                                  {store.store_hq?.name || "Store"}
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">
                                  <strong>Location:</strong> {store.location}
                                </p>
                                {store.city && (
                                  <p className="text-sm text-gray-600">
                                    <strong>City:</strong> {store.city}
                                  </p>
                                )}
                              </div>
                            </InfoWindow>
                          )}
                        </Marker>
                      );
                    }
                    return null;
                  })}
                </GoogleMap>
              </LoadScript>
            </TabsContent>
          </Tabs>
        )}

        {/* Selected Store Details Modal */}
        {selectedStore && (
          <Card className="fixed bottom-4 right-4 w-96 shadow-2xl z-50 max-h-[400px] overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between">
              <CardTitle>{selectedStore.store_hq?.name || "Store Details"}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStore(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{selectedStore.location}</p>
              </div>
              {selectedStore.city && (
                <div>
                  <p className="text-sm font-medium">City</p>
                  <p className="text-sm text-muted-foreground">{selectedStore.city}</p>
                </div>
              )}
              {selectedStore.contact && (
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a
                    href={`tel:${selectedStore.contact}`}
                    className="text-sm text-primary hover:underline flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    {selectedStore.contact}
                  </a>
                </div>
              )}
              {selectedStore.whatsapp && (
                <div>
                  <p className="text-sm font-medium">WhatsApp</p>
                  <a
                    href={`https://wa.me/${selectedStore.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {selectedStore.whatsapp}
                  </a>
                </div>
              )}
              {selectedStore.email && (
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a
                    href={`mailto:${selectedStore.email}`}
                    className="text-sm text-primary hover:underline flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    {selectedStore.email}
                  </a>
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => {
                  if (selectedStore.latitude && selectedStore.longitude) {
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${selectedStore.latitude},${selectedStore.longitude}`,
                      '_blank'
                    );
                  }
                }}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Open in Google Maps
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default StoreLocator;
