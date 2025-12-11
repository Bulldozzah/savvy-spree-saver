import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { SmartShopperLayout } from "@/components/SmartShopperSidebar";
import { StoresView } from "@/components/admin/StoresView";
import { StoreAssignmentsView } from "@/components/admin/StoreAssignmentsView";
import { ProductsView } from "@/components/admin/ProductsView";
import { UsersView } from "@/components/admin/UsersView";
import { RolesView } from "@/components/admin/RolesView";
import { AdsView } from "@/components/admin/AdsView";
import { AnalyticsView } from "@/components/admin/AnalyticsView";

const viewTitles: Record<string, string> = {
  'admin': 'Admin Dashboard',
  'ads': 'Ads Management',
  'catalog': 'Items Catalog',
  'stores': 'Stores',
  'assignments': 'Store Assignments',
  'products': 'Products',
  'users': 'Users',
  'roles': 'Role Management',
  'analytics': 'Analytics',
};

function DashboardContent({ selectedView }: { selectedView: string }) {
  return (
    <motion.div
      key={selectedView}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-bold mb-6">
        {viewTitles[selectedView] || "Admin Dashboard"}
      </h1>

      {selectedView === "admin" && <StoresView />}
      {selectedView === "ads" && <AdsView />}
      {selectedView === "catalog" && <ProductsView />}
      {selectedView === "stores" && <StoresView />}
      {selectedView === "assignments" && <StoreAssignmentsView />}
      {selectedView === "products" && <ProductsView />}
      {selectedView === "users" && <UsersView />}
      {selectedView === "roles" && <RolesView />}
      {selectedView === "analytics" && <AnalyticsView />}
    </motion.div>
  );
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState("admin");

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Logged out successfully" });
      navigate("/");
    }
  };

  return (
    <SmartShopperLayout
      userRole="super_admin"
      activeView={selectedView}
      onNavigate={setSelectedView}
      onLogout={handleLogout}
      trustScore={4.9}
      totalSavings={12500}
      currencySymbol="$"
    >
      <DashboardContent selectedView={selectedView} />
    </SmartShopperLayout>
  );
};

export default AdminDashboard;
