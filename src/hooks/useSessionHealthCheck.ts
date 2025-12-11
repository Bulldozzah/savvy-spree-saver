import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export const useSessionHealthCheck = () => {
  const navigate = useNavigate();
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      if (cancelled) return;

      // Avoid redirect loops while on the auth page
      if (window.location.pathname === "/auth") return;

      // Debounce rapid focus events - increased to 3000ms to prevent rate limiting
      const now = Date.now();
      if (now - lastCheckRef.current < 3000) return;
      lastCheckRef.current = now;

      // Don't sign out if offline; let auto-refresh retry later
      if (typeof navigator !== "undefined" && (navigator as any).onLine === false) {
        toast.info("You're offline. We'll retry when you're back online.");
        return;
      }

      // Single session check - rely on Supabase's built-in auto-refresh
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        await supabase.auth.signOut();
        toast.error("Your session has expired. Please log in again.");
        navigate("/auth");
        return;
      }

      // Session is valid, no need for aggressive double-checking
      // Supabase's autoRefreshToken will handle token refresh automatically
    };

    const handleFocus = () => {
      checkSession();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
    };
  }, [navigate]);
};
