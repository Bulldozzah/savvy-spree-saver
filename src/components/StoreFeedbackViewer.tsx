import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface Feedback {
  id: string;
  rating: number;
  feedback_type: string;
  title: string | null;
  body: string;
  created_at: string;
  stores: {
    location: string;
    store_hq: {
      name: string;
    };
  };
  profiles: {
    display_name: string | null;
  };
}

export const StoreFeedbackViewer = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFeedback = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({ title: "Error", description: "Please log in", variant: "destructive" });
        return;
      }

      // Get stores owned by this user
      const { data: stores, error: storesError } = await supabase
        .from("stores")
        .select("id")
        .eq("store_owner_id", user.id);

      if (storesError) throw storesError;

      if (!stores || stores.length === 0) {
        setFeedback([]);
        return;
      }

      const storeIds = stores.map(s => s.id);

      // Get feedback for these stores
      const { data, error } = await supabase
        .from("store_feedback")
        .select(`
          id,
          rating,
          feedback_type,
          title,
          body,
          created_at,
          user_id,
          stores!inner (
            location,
            store_hq (
              name
            )
          )
        `)
        .in("store_id", storeIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Normalize nested arrays (stores and store_hq) to single objects
      const feedbackWithProfiles: Feedback[] = await Promise.all(
        (data || []).map(async (item: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", item.user_id)
            .maybeSingle();

          // Handle stores as array or object
          const storesEntry = Array.isArray(item.stores) ? item.stores[0] : item.stores;
          const storeHqEntry = Array.isArray(storesEntry?.store_hq)
            ? storesEntry.store_hq[0]
            : storesEntry?.store_hq;

          const normalized: Feedback = {
            id: item.id,
            rating: item.rating,
            feedback_type: item.feedback_type,
            title: item.title ?? null,
            body: item.body,
            created_at: item.created_at,
            stores: {
              location: storesEntry?.location ?? "",
              store_hq: {
                name: storeHqEntry?.name ?? "",
              },
            },
            profiles: {
              display_name: profile?.display_name || null,
            },
          };

          return normalized;
        })
      );

      setFeedback(feedbackWithProfiles);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Customer Feedback</h2>
        <p className="text-muted-foreground">View feedback from your customers</p>
      </div>

      {isLoading ? (
        <p className="text-center py-8">Loading feedback...</p>
      ) : feedback.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">No feedback yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= item.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`font-semibold ${getRatingColor(item.rating)}`}>
                        {item.rating}/5
                      </span>
                    </div>
                    {item.title && (
                      <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{item.feedback_type}</Badge>
                      <span>
                        {item.stores.store_hq.name} - {item.stores.location}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(item.created_at), "MMM d, yyyy")}
                      </span>
                      {item.profiles.display_name && (
                        <>
                          <span>•</span>
                          <span>By {item.profiles.display_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
