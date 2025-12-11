import React, { useState } from "react";
import { SidebarAnimated, SidebarBody, SidebarLink } from "@/components/ui/sidebar-animated";
import { LayoutDashboard, ShoppingCart, Search, MapPin, Package, BarChart3, Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function SidebarDemo() {
  const links = [
    {
      label: "Dashboard",
      href: "/sidebar-demo",
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "My Shopping Lists",
      href: "/sidebar-demo/lists",
      icon: (
        <ShoppingCart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Search & Add Products",
      href: "/sidebar-demo/search",
      icon: (
        <Search className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Find Store",
      href: "/sidebar-demo/stores",
      icon: (
        <MapPin className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "My Orders",
      href: "/sidebar-demo/orders",
      icon: (
        <Package className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Analytics",
      href: "/sidebar-demo/analytics",
      icon: (
        <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "/sidebar-demo/settings",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "/auth",
      icon: (
        <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];
  
  const [open, setOpen] = useState(false);
  
  return (
    <div className="flex flex-col md:flex-row bg-background w-full min-h-screen overflow-hidden">
      <SidebarAnimated open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "John Doe",
                href: "#",
                icon: (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                    JD
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </SidebarAnimated>
      <DashboardContent />
    </div>
  );
}

const Logo = () => {
  return (
    <Link
      to="/sidebar-demo"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-foreground whitespace-pre"
      >
        WiseUp Shop
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      to="/sidebar-demo"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};

const DashboardContent = () => {
  return (
    <div className="flex flex-1 flex-col">
      <div className="p-4 md:p-10 rounded-tl-2xl border-l border-border bg-background/50 backdrop-blur-sm flex flex-col gap-4 flex-1 w-full h-full overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Animated Sidebar Demo</h1>
          <p className="text-muted-foreground">Hover over the sidebar to see the expand animation</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Shopping Lists", value: "12", color: "bg-blue-500" },
            { label: "Products Added", value: "148", color: "bg-green-500" },
            { label: "Stores Found", value: "23", color: "bg-orange-500" },
            { label: "Total Savings", value: "$234", color: "bg-purple-500" },
          ].map((stat, i) => (
            <Card key={i} className="p-6 bg-card hover:shadow-lg transition-shadow">
              <div className={cn("h-2 w-12 rounded-full mb-4", stat.color)} />
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 bg-card">
              <div className="h-6 w-32 bg-muted rounded mb-4 animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
        
        <Card className="p-6 bg-card mt-4">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              "Added 5 items to Shopping List",
              "Compared prices across 3 stores",
              "Found new store near you",
              "Updated shopping preferences",
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm text-foreground">{activity}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
