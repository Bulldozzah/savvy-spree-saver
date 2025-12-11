import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

export const AdGeneralManager = () => {
  const { toast } = useToast();
  const [ads, setAds] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    const { data } = await supabase
      .from("ad_general")
      .select("*")
      .order("display_order", { ascending: true });
    setAds(data || []);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `general/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("advertisements")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Error", description: uploadError.message, variant: "destructive" });
      return null;
    }

    const { data } = supabase.storage.from("advertisements").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const createAd = async () => {
    if (!title.trim() || !imageFile) {
      toast({ title: "Error", description: "Please fill title and select an image", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const imageUrl = await uploadImage(imageFile);
    
    if (!imageUrl) {
      setIsUploading(false);
      return;
    }

    const { error } = await supabase.from("ad_general").insert({
      title,
      description,
      link_url: linkUrl || null,
      image_url: imageUrl,
      display_order: displayOrder,
      is_active: true,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "General ad created" });
      setTitle("");
      setDescription("");
      setLinkUrl("");
      setImageFile(null);
      setDisplayOrder(0);
      loadAds();
    }
    setIsUploading(false);
  };

  const toggleAd = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("ad_general")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Ad ${!isActive ? "activated" : "deactivated"}` });
      loadAds();
    }
  };

  const deleteAd = async (id: string) => {
    const { error } = await supabase.from("ad_general").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Ad deleted" });
      loadAds();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create General Ad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              placeholder="Ad title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>Description (Optional)</Label>
            <Input
              placeholder="Brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label>Link URL (Optional)</Label>
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
          <div>
            <Label>Display Order</Label>
            <Input
              type="number"
              placeholder="0"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Ad Image</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Recommended size: 2000x300px (20:3 ratio) for optimal display
            </p>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button onClick={createAd} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Create Ad"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage General Ads</CardTitle>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No ads found</p>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div key={ad.id} className="border rounded p-4 flex items-center gap-4">
                  <img src={ad.image_url} alt={ad.title} className="w-32 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-semibold">{ad.title}</p>
                    {ad.description && (
                      <p className="text-sm text-muted-foreground">{ad.description}</p>
                    )}
                    {ad.link_url && (
                      <p className="text-sm text-muted-foreground">{ad.link_url}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Order: {ad.display_order}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ad.is_active}
                      onCheckedChange={() => toggleAd(ad.id, ad.is_active)}
                    />
                    <Label>{ad.is_active ? "Active" : "Inactive"}</Label>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteAd(ad.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
