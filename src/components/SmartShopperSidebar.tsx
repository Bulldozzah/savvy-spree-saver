import React from 'react';
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
  Star
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
  { icon: GitCompare, label: 'Compare Prices', view: 'compare', roles: ['shopper', 'super_admin'] },
  { icon: ListChecks, label: 'Shopping Lists', view: 'lists', roles: ['shopper', 'super_admin'] },
  { icon: MessageSquare, label: 'My Feedback', view: 'my-feedback', roles: ['shopper', 'super_admin'] },
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
  currencySymbol = '$',
  selectedListName,
  assignedStoreName,
  selectedListTotal,
}: { 
  trustScore?: number; 
  totalSavings?: number; 
  currencySymbol?: string;
  selectedListName?: string;
  assignedStoreName?: string | null;
  selectedListTotal?: number | null;
}) {
  return (
    <div className="mx-3 mb-3 p-4 bg-green-50 rounded-xl border border-green-100">
      <p className="text-[11px] uppercase text-gray-500 font-semibold tracking-wider mb-3">Quick Stats</p>
      <div className="space-y-3">
        {/* Selected Shopping List */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Selected List</span>
          <span className="font-semibold text-gray-800 text-sm truncate">
            {selectedListName || "None selected"}
          </span>
        </div>
        
        {/* Assigned Store */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Assigned Store</span>
          <span className={cn(
            "font-semibold text-sm truncate",
            assignedStoreName ? "text-blue-700" : "text-gray-400"
          )}>
            {assignedStoreName || "Unassigned"}
          </span>
        </div>
        
        {/* List Total */}
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
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
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
  );
}

export default SmartShopperSidebar;
