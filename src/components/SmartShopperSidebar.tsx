<<<<<<< HEAD
import React, { useState } from 'react';
import { motion } from 'framer-motion';
=======
import React from 'react';
>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
import { 
  TrendingDown, 
  LayoutDashboard, 
  DollarSign, 
  GitCompare, 
  ListChecks, 
  Store, 
  MessageSquare,
  Shield,
  Megaphone,
  Package,
  User,
  LogOut,
  Star,
<<<<<<< HEAD
  Camera,
  ChevronsUpDown,
  Settings,
  PanelLeft,
} from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
=======
  Camera
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
import { cn } from "@/lib/utils";

export type UserRole = 'shopper' | 'store_owner' | 'admin' | 'super_admin';

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: string;
  roles: UserRole[];
}

// Shopper navigation items
const shopperNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard', roles: ['shopper', 'super_admin'] },
  { icon: DollarSign, label: 'Search & Add Products', view: 'search-add-products', roles: ['shopper', 'super_admin'] },
  { icon: Camera, label: 'Scan & Update Price', view: 'scan-price', roles: ['shopper', 'super_admin'] },
  { icon: Store, label: 'Browse Store', view: 'browse-store', roles: ['shopper', 'super_admin'] },
  { icon: GitCompare, label: 'Compare Prices', view: 'compare', roles: ['shopper', 'super_admin'] },
  { icon: ListChecks, label: 'Shopping Lists', view: 'lists', roles: ['shopper', 'super_admin'] },
  { icon: MessageSquare, label: 'Store Feedback', view: 'my-feedback', roles: ['shopper', 'super_admin'] },
];

// Store Owner navigation items
const storeOwnerNavItems: NavItem[] = [
  { icon: Store, label: 'Store Admin', view: 'store-admin', roles: ['store_owner', 'super_admin'] },
  { icon: DollarSign, label: 'Store Prices', view: 'store-prices', roles: ['store_owner', 'super_admin'] },
  { icon: MessageSquare, label: 'Our Customer Feedback', view: 'customer-feedback', roles: ['store_owner', 'super_admin'] },
  { icon: MessageSquare, label: 'Feedback', view: 'feedback', roles: ['store_owner'] },
];

// Admin navigation items
const adminNavItems: NavItem[] = [
  { icon: Shield, label: 'Admin', view: 'admin', roles: ['admin', 'super_admin'] },
  { icon: Megaphone, label: 'Ads Management', view: 'ads', roles: ['admin', 'super_admin'] },
  { icon: Package, label: 'Items Catalog', view: 'catalog', roles: ['admin', 'super_admin'] },
];

function getNavigationItems(userRole: UserRole): NavItem[] {
  switch (userRole) {
    case 'shopper':
      return shopperNavItems.filter(item => item.roles.includes('shopper'));
    case 'store_owner':
      return storeOwnerNavItems.filter(item => item.roles.includes('store_owner'));
    case 'admin':
      return adminNavItems.filter(item => item.roles.includes('admin'));
    case 'super_admin':
      return [
        ...shopperNavItems.filter(item => item.roles.includes('super_admin')),
        ...storeOwnerNavItems.filter(item => item.roles.includes('super_admin')),
        ...adminNavItems.filter(item => item.roles.includes('super_admin')),
      ];
    default:
      return [];
  }
}

<<<<<<< HEAD
function getRoleBadge(userRole: UserRole) {
  const badges: Record<UserRole, { label: string; className: string }> = {
    super_admin: { label: 'Super Admin', className: 'bg-red-100 text-red-700' },
    admin: { label: 'Admin', className: 'bg-orange-100 text-orange-700' },
    store_owner: { label: 'Store Owner', className: 'bg-blue-100 text-blue-700' },
    shopper: { label: 'Shopper', className: 'bg-green-100 text-green-700' },
  };
  return badges[userRole];
}

// --- Animation variants (from theme) ---
const sidebarVariants = {
  open: { width: "16rem" },
  closed: { width: "3.5rem" },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const labelVariants = {
  open: {
    x: 0,
    opacity: 1,
    transition: { x: { stiffness: 1000, velocity: -100 } },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: { x: { stiffness: 100 } },
  },
};

const transitionProps = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

// --- Interfaces (preserved) ---
=======
>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
interface SmartShopperSidebarProps {
  userRole: UserRole;
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onProfileClick?: () => void;
  trustScore?: number;
  totalSavings?: number;
  currencySymbol?: string;
  displayName?: string;
  selectedListName?: string;
  assignedStoreName?: string | null;
  selectedListTotal?: number | null;
}

<<<<<<< HEAD
// --- QuickStatsPanel (preserved logic, adapts to collapsed) ---
function QuickStatsPanel({ 
  isCollapsed,
=======
function SidebarHeaderSection({ userRole }: { userRole: UserRole }) {
  return (
    <SidebarHeader className="border-b border-green-100 p-4 pb-4">
      <div className="flex items-center gap-3">
        {/* Logo - 10x10 rounded square with gradient */}
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
          <TrendingDown className="h-6 w-6 text-white" />
        </div>
        
        {/* App Name & Tagline */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">Smart Shopper</h1>
          <p className="text-xs text-green-600 font-medium">Save Smart, Shop Better</p>
        </div>
      </div>
      
      {/* Role Badge */}
      <div className="mt-3">
        {userRole === 'super_admin' && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 uppercase tracking-wide">
            Super Admin
          </span>
        )}
        {userRole === 'admin' && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 uppercase tracking-wide">
            Admin
          </span>
        )}
        {userRole === 'store_owner' && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            Store Owner
          </span>
        )}
        {userRole === 'shopper' && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            Shopper
          </span>
        )}
      </div>
    </SidebarHeader>
  );
}

function NavigationMenu({ 
  userRole, 
  activeView, 
  onNavigate 
}: { 
  userRole: UserRole; 
  activeView: string; 
  onNavigate: (view: string) => void;
}) {
  const navItems = getNavigationItems(userRole);
  
  return (
    <SidebarGroup className="px-2 py-4">
      <SidebarGroupLabel className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider px-3 mb-2">
        Main Menu
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;
            
            return (
              <SidebarMenuItem key={item.view}>
                <SidebarMenuButton
                  onClick={() => onNavigate(item.view)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-green-100 to-blue-100 text-green-800 shadow-sm" 
                      : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-green-600" : "text-gray-500"
                  )} />
                  <span className="truncate">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function QuickStatsPanel({ 
  trustScore = 4.8, 
  totalSavings = 0, 
>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
  currencySymbol = '$',
  selectedListName,
  assignedStoreName,
  selectedListTotal,
}: { 
<<<<<<< HEAD
  isCollapsed: boolean;
=======
  trustScore?: number; 
  totalSavings?: number; 
>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
  currencySymbol?: string;
  selectedListName?: string;
  assignedStoreName?: string | null;
  selectedListTotal?: number | null;
}) {
<<<<<<< HEAD
  if (isCollapsed) return null;

  return (
    <motion.div variants={labelVariants} className="mx-2 mb-2 p-3 bg-green-50 rounded-xl border border-green-100">
      <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-3">Quick Stats</p>
      <div className="space-y-3">
=======
  return (
    <div className="mx-3 mb-3 p-4 bg-green-50 rounded-xl border border-green-100">
      <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-3">Quick Stats</p>
      <div className="space-y-3">
        {/* Selected Shopping List */}
>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Selected List</span>
          <span className="font-semibold text-gray-800 text-sm truncate">
            {selectedListName || "None selected"}
          </span>
        </div>
<<<<<<< HEAD
=======
        
        {/* Assigned Store */}
>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Assigned Store</span>
          <span className={cn(
            "font-semibold text-sm truncate",
            assignedStoreName ? "text-blue-700" : "text-gray-400"
          )}>
            {assignedStoreName || "Unassigned"}
          </span>
        </div>
<<<<<<< HEAD
=======
        
        {/* List Total */}
>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">List Total</span>
          <span className={cn(
            "font-semibold text-sm",
            selectedListTotal !== null && selectedListTotal !== undefined ? "text-green-700" : "text-gray-400"
          )}>
            {selectedListTotal !== null && selectedListTotal !== undefined 
              ? `${currencySymbol}${selectedListTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"
            }
          </span>
        </div>
      </div>
<<<<<<< HEAD
    </motion.div>
  );
}

// --- Sidebar content (shared between desktop motion sidebar and mobile sheet) ---
function SidebarInner({
  userRole,
  activeView,
  onNavigate,
  onLogout,
  onProfileClick,
  isCollapsed,
  showStats,
  currencySymbol,
  selectedListName,
  assignedStoreName,
  selectedListTotal,
}: SmartShopperSidebarProps & { isCollapsed: boolean; showStats: boolean }) {
  const navItems = getNavigationItems(userRole);
  const badge = getRoleBadge(userRole);

  return (
    <motion.div
      className="relative z-40 flex text-muted-foreground h-full shrink-0 flex-col bg-white dark:bg-black transition-all"
      variants={contentVariants}
    >
      <motion.ul variants={staggerVariants} className="flex h-full flex-col">
        <div className="flex grow flex-col items-center">
          {/* Header: Logo + App name + Role badge */}
          <div className="flex h-[54px] w-full shrink-0 border-b border-green-100 p-2">
            <div className="mt-[1.5px] flex w-full">
              <button
                className="flex w-fit items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors"
              >
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="h-3.5 w-3.5 text-white" />
                </div>
                <motion.li variants={labelVariants} className="flex w-fit items-center gap-2 list-none">
                  {!isCollapsed && (
                    <>
                      <p className="text-sm font-bold text-foreground whitespace-nowrap">Smart Shopper</p>
                      <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap",
                        badge.className
                      )}>
                        {badge.label}
                      </span>
                    </>
                  )}
                </motion.li>
              </button>
            </div>
          </div>

          {/* Navigation + Quick Stats */}
          <div className="flex h-full w-full flex-col">
            <div className="flex grow flex-col gap-2">
              <ScrollArea className="h-16 grow p-2">
                <div className="flex w-full flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.view;

                    return (
                      <button
                        key={item.view}
                        onClick={() => onNavigate(item.view)}
                        className={cn(
                          "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                          isActive && "bg-muted text-green-600"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <motion.li variants={labelVariants} className="list-none">
                          {!isCollapsed && (
                            <p className="ml-2 text-sm font-medium whitespace-nowrap">{item.label}</p>
                          )}
                        </motion.li>
                      </button>
                    );
                  })}

                  {/* Quick Stats below nav when expanded */}
                  {showStats && (
                    <>
                      <Separator className="w-full my-2" />
                      <QuickStatsPanel
                        isCollapsed={isCollapsed}
                        currencySymbol={currencySymbol}
                        selectedListName={selectedListName}
                        assignedStoreName={assignedStoreName}
                        selectedListTotal={selectedListTotal}
                      />
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Footer: Settings, Profile, Account dropdown */}
            <div className="flex flex-col p-2 border-t border-green-100">
              <button
                onClick={onProfileClick}
                className="flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary"
              >
                <Settings className="h-4 w-4 shrink-0" />
                <motion.li variants={labelVariants} className="list-none">
                  {!isCollapsed && (
                    <p className="ml-2 text-sm font-medium">Profile</p>
                  )}
                </motion.li>
              </button>

              <button
                onClick={onLogout}
                className="flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <motion.li variants={labelVariants} className="list-none">
                  {!isCollapsed && (
                    <p className="ml-2 text-sm font-medium">Logout</p>
                  )}
                </motion.li>
              </button>

              {/* Account avatar row */}
              <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 mt-1">
                <Avatar className="size-5">
                  <AvatarFallback className="text-[10px] bg-green-100 text-green-700">
                    {userRole === 'shopper' ? 'S' : userRole === 'store_owner' ? 'O' : 'A'}
                  </AvatarFallback>
                </Avatar>
                <motion.li variants={labelVariants} className="flex w-full items-center gap-2 list-none">
                  {!isCollapsed && (
                    <>
                      <p className="text-xs font-medium text-muted-foreground truncate">
                        {userRole.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                    </>
                  )}
                </motion.li>
              </div>
            </div>
          </div>
        </div>
      </motion.ul>
    </motion.div>
  );
}

// --- Main sidebar export (preserved interface) ---
=======
    </div>
  );
}

function SidebarFooterSection({ 
  onLogout, 
  onProfileClick 
}: { 
  onLogout: () => void;
  onProfileClick?: () => void;
}) {
  return (
    <SidebarFooter className="p-3 space-y-1 border-t border-green-100">
      <SidebarMenuButton
        onClick={onProfileClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200"
      >
        <User className="h-5 w-5 text-gray-500" />
        <span>Profile</span>
      </SidebarMenuButton>
      
      <SidebarMenuButton
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
      >
        <LogOut className="h-5 w-5" />
        <span>Logout</span>
      </SidebarMenuButton>
    </SidebarFooter>
  );
}

>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
export function SmartShopperSidebar({
  userRole,
  activeView,
  onNavigate,
  onLogout,
  onProfileClick,
  trustScore,
  totalSavings,
  currencySymbol,
  selectedListName,
  assignedStoreName,
  selectedListTotal,
}: SmartShopperSidebarProps) {
<<<<<<< HEAD
  const [isCollapsed, setIsCollapsed] = useState(true);
  const showStats = userRole === 'shopper' || userRole === 'super_admin';

  return (
    <motion.div
      className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r border-green-100 hidden md:block")}
      initial="closed"
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <SidebarInner
        userRole={userRole}
        activeView={activeView}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onProfileClick={onProfileClick}
        trustScore={trustScore}
        totalSavings={totalSavings}
        currencySymbol={currencySymbol}
        selectedListName={selectedListName}
        assignedStoreName={assignedStoreName}
        selectedListTotal={selectedListTotal}
        isCollapsed={isCollapsed}
        showStats={showStats}
      />
    </motion.div>
=======
  const showStats = userRole === 'shopper' || userRole === 'super_admin';
  
  return (
    <Sidebar className="border-r border-green-100 bg-white">
      <SidebarHeaderSection userRole={userRole} />
      
      <SidebarContent className="flex flex-col">
        <NavigationMenu 
          userRole={userRole} 
          activeView={activeView} 
          onNavigate={onNavigate} 
        />
        
        <div className="flex-1" />
        
        {showStats && (
          <QuickStatsPanel 
            trustScore={trustScore} 
            totalSavings={totalSavings} 
            currencySymbol={currencySymbol}
            selectedListName={selectedListName}
            assignedStoreName={assignedStoreName}
            selectedListTotal={selectedListTotal}
          />
        )}
      </SidebarContent>
      
      <SidebarFooterSection onLogout={onLogout} onProfileClick={onProfileClick} />
    </Sidebar>
>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
  );
}

// Layout wrapper component
interface SmartShopperLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onProfileClick?: () => void;
  trustScore?: number;
  totalSavings?: number;
  currencySymbol?: string;
  pageTitle?: string;
  selectedListName?: string;
  assignedStoreName?: string | null;
  selectedListTotal?: number | null;
}

export function SmartShopperLayout({
  children,
  userRole,
  activeView,
  onNavigate,
  onLogout,
  onProfileClick,
  trustScore,
  totalSavings,
  currencySymbol,
  pageTitle,
  selectedListName,
  assignedStoreName,
  selectedListTotal,
}: SmartShopperLayoutProps) {
<<<<<<< HEAD
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const showStats = userRole === 'shopper' || userRole === 'super_admin';

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop: animated collapsible sidebar */}
      {!isMobile && (
=======
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
        <SmartShopperSidebar
          userRole={userRole}
          activeView={activeView}
          onNavigate={onNavigate}
          onLogout={onLogout}
          onProfileClick={onProfileClick}
          trustScore={trustScore}
          totalSavings={totalSavings}
          currencySymbol={currencySymbol}
          selectedListName={selectedListName}
          assignedStoreName={assignedStoreName}
          selectedListTotal={selectedListTotal}
        />
<<<<<<< HEAD
      )}

      {/* Mobile: Sheet overlay sidebar */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-white">
            <SidebarInner
              userRole={userRole}
              activeView={activeView}
              onNavigate={(view) => {
                onNavigate(view);
                setMobileOpen(false);
              }}
              onLogout={onLogout}
              onProfileClick={() => {
                onProfileClick?.();
                setMobileOpen(false);
              }}
              trustScore={trustScore}
              totalSavings={totalSavings}
              currencySymbol={currencySymbol}
              selectedListName={selectedListName}
              assignedStoreName={assignedStoreName}
              selectedListTotal={selectedListTotal}
              isCollapsed={false}
              showStats={showStats}
            />
          </SheetContent>
        </Sheet>
      )}
      
      <main
        className="flex-1 flex flex-col min-w-0 transition-[margin] duration-200 ease-linear"
        style={{ marginLeft: isMobile ? 0 : '3.5rem' }}
      >
        {/* Mobile Header */}
        {isMobile && (
          <header className="sticky top-0 z-40 border-b border-green-100 bg-white/80 backdrop-blur-sm">
            <div className="flex h-14 items-center px-4 gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="hover:bg-green-100 rounded-lg p-2 transition-colors"
              >
                <PanelLeft className="h-5 w-5" />
              </button>
              <span className="font-bold text-lg text-gray-800">Smart Shopper</span>
            </div>
          </header>
        )}
        
        {/* Content Area with gradient background */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
=======
        
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header - shown on small screens only */}
          <header className="sticky top-0 z-40 border-b border-green-100 bg-white/80 backdrop-blur-sm lg:hidden">
            <div className="flex h-14 items-center px-4 gap-3">
              <SidebarTrigger className="hover:bg-green-100 rounded-lg p-2 transition-colors" />
              <span className="font-bold text-lg text-gray-800">Smart Shopper</span>
            </div>
          </header>
          
          {/* Content Area with gradient background */}
          <div className="flex-1 overflow-auto bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
>>>>>>> 1249b16a4da0425343761d5500a53771fdaff876
  );
}

export default SmartShopperSidebar;
