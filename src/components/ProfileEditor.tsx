import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/neon-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { countries } from "@/data/countries";

interface ProfileEditorProps {
  onComplete?: () => void;
}

export const ProfileEditor = ({ onComplete }: ProfileEditorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    phone: "",
    phone_area_code: "",
    country: "",
    currency: "",
    email: "",
    whatsapp: "",
    contact: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile({
        display_name: data.display_name || "",
        phone: data.phone || "",
        phone_area_code: data.phone_area_code || "",
        country: data.country || "",
        currency: data.currency || "",
        email: data.email || "",
        whatsapp: data.whatsapp || "",
        contact: data.contact || "",
      });
    }
  };

  const handleCountryChange = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    if (country) {
      setProfile(prev => ({
        ...prev,
        country: countryName,
        currency: country.currencyCode,
        phone_area_code: country.phoneCode,
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        display_name: profile.display_name,
        phone: profile.phone,
        phone_area_code: profile.phone_area_code,
        country: profile.country,
        currency: profile.currency,
        email: profile.email,
        whatsapp: profile.whatsapp,
        contact: profile.contact,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      onComplete?.();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          value={profile.display_name}
          onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
          placeholder="Enter your display name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select value={profile.country} onValueChange={handleCountryChange}>
          <SelectTrigger id="country">
            <SelectValue placeholder="Select your country" />
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

      {profile.country && (
        <>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input value={`${profile.currency}`} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Phone Code</Label>
            <Input value={profile.phone_area_code} disabled className="bg-muted" />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="flex gap-2">
          <Input
            value={profile.phone_area_code}
            disabled
            className="w-24 bg-muted"
          />
          <Input
            id="phone"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            placeholder="Phone number"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          placeholder="your.email@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp Number</Label>
        <Input
          id="whatsapp"
          value={profile.whatsapp}
          onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
          placeholder="WhatsApp number with country code"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact">Additional Contact</Label>
        <Input
          id="contact"
          value={profile.contact}
          onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
          placeholder="Alternative contact number"
        />
      </div>

      <Button variant="solid" onClick={handleSave} disabled={loading} className="w-full">
        {loading ? "Saving..." : "Save Profile"}
      </Button>
    </div>
  );
};
