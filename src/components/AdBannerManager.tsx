import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

export const AdBannerManager = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    const { data } = await supabase
      .from("ad_banners")
      .select("*")
      .order("display_order", { ascending: true });
    setBanners(data || []);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

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

  const createBanner = async () => {
    if (!title.trim() || !linkUrl.trim() || !imageFile) {
      toast({ title: "Error", description: "Please fill all fields and select an image", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const imageUrl = await uploadImage(imageFile);
    
    if (!imageUrl) {
      setIsUploading(false);
      return;
    }

    const { error } = await supabase.from("ad_banners").insert({
      title,
      description,
      link_url: linkUrl,
      image_url: imageUrl,
      display_order: displayOrder,
      is_active: true,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Banner created" });
      setTitle("");
      setDescription("");
      setLinkUrl("");
      setImageFile(null);
      setDisplayOrder(0);
      loadBanners();
    }
    setIsUploading(false);
  };

  const toggleBanner = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("ad_banners")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Banner ${!isActive ? "activated" : "deactivated"}` });
      loadBanners();
    }
  };

  const deleteBanner = async (id: string) => {
    const { error } = await supabase.from("ad_banners").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Banner deleted" });
      loadBanners();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Banner Ad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              placeholder="Banner title"
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
            <Label>Link URL</Label>
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
            <Label>Banner Image</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Recommended size: 1920x500px (16:5 ratio) for optimal display
            </p>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button onClick={createBanner} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Create Banner"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Banners</CardTitle>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No banners found</p>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="border rounded p-4 flex items-center gap-4">
                  <img src={banner.image_url} alt={banner.title} className="w-32 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-semibold">{banner.title}</p>
                    {banner.description && (
                      <p className="text-sm text-muted-foreground">{banner.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{banner.link_url}</p>
                    <p className="text-xs text-muted-foreground">Order: {banner.display_order}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={() => toggleBanner(banner.id, banner.is_active)}
                    />
                    <Label>{banner.is_active ? "Active" : "Inactive"}</Label>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteBanner(banner.id)}
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
