import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/wise-up-shop-logo.png";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  user: User;
  userRole: string | null;
  onLogout?: () => void;
}

const Navigation = ({ user, userRole, onLogout }: NavigationProps) => {
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data?.display_name) {
        setDisplayName(data.display_name);
      }
    };
    
    loadProfile();
  }, [user.id]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Wise-Up Shop" className="h-12 w-auto" />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-right">
            <p className="font-medium">{displayName || user.email}</p>
            <p className="text-muted-foreground capitalize">{userRole || "shopper"}</p>
          </div>
          {onLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
