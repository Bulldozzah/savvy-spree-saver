import { useEffect, useState, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import StoreLocator from "./pages/StoreLocator";
import AdminDashboard from "./pages/AdminDashboard";
import StoreOwnerDashboard from "./pages/StoreOwnerDashboard";
import ShopperDashboard from "./pages/ShopperDashboard";
import ShopperLanding from "./pages/ShopperLanding";
import SidebarDemo from "./pages/SidebarDemo";
import ExpandableTabsDemo from "./pages/ExpandableTabsDemo";
import HoverGradientNavBarDemo from "./pages/HoverGradientNavBarDemo";
import FallingPatternDemo from "./pages/FallingPatternDemo";
import FluidDropdownDemo from "./pages/FluidDropdownDemo";
import NotFound from "./pages/NotFound";

const AppContent = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const roleLoadedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth event:', event, 'User:', session?.user?.email);
        
        // Always update session state when we have a valid session
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          // Load role if not already loaded
          if (!roleLoadedRef.current) {
            roleLoadedRef.current = true;
            // Use setTimeout to avoid Supabase deadlock warning
            setTimeout(() => {
              if (isMounted) {
                loadUserRole(session.user.id);
              }
            }, 0);
          } else {
            setLoading(false);
          }
        } 
        // Only clear state on explicit SIGNED_OUT event
        else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          roleLoadedRef.current = false;
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
        // Handle INITIAL_SESSION with no session (user not logged in)
        else if (event === 'INITIAL_SESSION' && !session) {
          console.log('No initial session');
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      console.log('Initial getSession:', session?.user?.email);
      
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        if (!roleLoadedRef.current) {
          roleLoadedRef.current = true;
          loadUserRole(session.user.id);
        }
      } else {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error loading user role:", error);
      }

      // Default to shopper if no role found
      setUserRole(data?.role || "shopper");
    } catch (err) {
      console.error("Unexpected error loading user role:", err);
      // Do not force sign-out here; let auth state listener handle invalid sessions
      setUserRole("shopper");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route
              path="/"
              element={
                !user ? (
                  <Index />
                ) : userRole === "admin" || userRole === "super_admin" ? (
                  <Navigate to="/admin" replace />
                ) : userRole === "store_owner" ? (
                  <Navigate to="/store" replace />
                ) : (
                  <Navigate to="/shop" replace />
                )
              }
            />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/stores" element={<StoreLocator />} />
            <Route path="/shopper-landing" element={<ShopperLanding />} />
            <Route path="/sidebar-demo/*" element={<SidebarDemo />} />
            <Route path="/expandable-tabs-demo" element={<ExpandableTabsDemo />} />
            <Route path="/hover-gradient-navbar-demo" element={<HoverGradientNavBarDemo />} />
            <Route path="/falling-pattern-demo" element={<FallingPatternDemo />} />
            <Route path="/fluid-dropdown-demo" element={<FluidDropdownDemo />} />
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" replace />} />
            <Route
              path="/admin"
              element={user && (userRole === "admin" || userRole === "super_admin") ? <AdminDashboard /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/store"
              element={user && userRole === "store_owner" ? <StoreOwnerDashboard /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/shop"
              element={user && (userRole === "shopper" || !userRole) ? <ShopperDashboard /> : <Navigate to="/auth" replace />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </ThemeProvider>
    </>
  );
};

const App = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
