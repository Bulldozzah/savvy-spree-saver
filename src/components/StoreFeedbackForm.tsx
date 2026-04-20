import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Star } from "lucide-react";
import { StoreSelector } from "./StoreSelector";

export const StoreFeedbackForm = () => {
  const [open, setOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStore) {
      toast({ title: "Error", description: "Please select a store", variant: "destructive" });
      return;
    }
    
    if (rating === 0) {
      toast({ title: "Error", description: "Please select a rating", variant: "destructive" });
      return;
    }
    
    if (!feedbackType) {
      toast({ title: "Error", description: "Please select a feedback type", variant: "destructive" });
      return;
    }
    
    if (!body.trim()) {
      toast({ title: "Error", description: "Please provide feedback", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({ title: "Error", description: "Please log in to submit feedback", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("store_feedback").insert({
        user_id: user.id,
        store_id: selectedStore.id,
        rating,
        feedback_type: feedbackType as any,
        title: title.trim() || null,
        body: body.trim(),
      } as any);

      if (error) throw error;

      toast({ title: "Success", description: "Feedback submitted successfully" });
      
      // Reset form
      setSelectedStore(null);
      setRating(0);
      setFeedbackType("");
      setTitle("");
      setBody("");
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Give Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Store Feedback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Store</Label>
            <StoreSelector 
              onStoreSelected={setSelectedStore}
              selectedStore={selectedStore}
            />
          </div>

          <div>
            <Label>Rating</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Feedback Type</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger>
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Store Service & Experience">
                  Store Service & Experience
                </SelectItem>
                <SelectItem value="Product Quality & Experience">
                  Product Quality & Experience
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title (Optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your feedback"
              maxLength={100}
            />
          </div>

          <div>
            <Label>Feedback</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your experience..."
              rows={6}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {body.length}/1000 characters
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
