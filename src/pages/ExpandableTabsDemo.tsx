import { useState } from "react";
import { Bell, Home, HelpCircle, Settings, Shield, Mail, User, FileText, Lock, ShoppingCart, TrendingUp } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TabItem = 
  | { title: string; icon: any; type?: never }
  | { type: "separator"; title?: never; icon?: never };

const ExpandableTabsDemo = () => {
  const [selectedTab, setSelectedTab] = useState<number | null>(null);

  const mainTabs: TabItem[] = [
    { title: "Dashboard", icon: Home },
    { title: "Notifications", icon: Bell },
    { type: "separator" },
    { title: "Settings", icon: Settings },
    { title: "Support", icon: HelpCircle },
    { title: "Security", icon: Shield },
  ];

  const secondaryTabs: TabItem[] = [
    { title: "Profile", icon: User },
    { title: "Messages", icon: Mail },
    { type: "separator" },
    { title: "Documents", icon: FileText },
    { title: "Privacy", icon: Lock },
  ];

  const shopperTabs: TabItem[] = [
    { title: "Shopping", icon: ShoppingCart },
    { title: "Analytics", icon: TrendingUp },
    { type: "separator" },
    { title: "Account", icon: User },
    { title: "Help", icon: HelpCircle },
  ];

  const getTabContent = (index: number | null) => {
    if (index === null) return "Click a tab to see its content";
    
    const tabNames = ["Dashboard", "Notifications", undefined, "Settings", "Support", "Security"];
    const tabName = tabNames[index];
    
    if (!tabName) return "Separator selected";
    
    switch (tabName) {
      case "Dashboard":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Dashboard Overview</h3>
            <p className="text-muted-foreground">Welcome to your dashboard. Here you can view all your important metrics and activities.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">567</div>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">89%</div>
                  <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case "Notifications":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Notifications</h3>
            <div className="space-y-3">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <p className="font-medium">New message received</p>
                  <p className="text-sm text-muted-foreground">You have 3 unread messages</p>
                  <p className="text-xs text-muted-foreground mt-2">2 hours ago</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <p className="font-medium">Account verified</p>
                  <p className="text-sm text-muted-foreground">Your account has been successfully verified</p>
                  <p className="text-xs text-muted-foreground mt-2">1 day ago</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="pt-6">
                  <p className="font-medium">Update available</p>
                  <p className="text-sm text-muted-foreground">A new version of the app is available</p>
                  <p className="text-xs text-muted-foreground mt-2">3 days ago</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case "Settings":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Settings</h3>
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive email updates</p>
                  </div>
                  <Button variant="outline" size="sm">Toggle</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Language</p>
                    <p className="text-sm text-muted-foreground">Select your preferred language</p>
                  </div>
                  <Button variant="outline" size="sm">English</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "Support":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Support Center</h3>
            <p className="text-muted-foreground">Get help with your account and app features</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="pt-6">
                  <HelpCircle className="h-8 w-8 mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">FAQ</h4>
                  <p className="text-sm text-muted-foreground">Find answers to common questions</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="pt-6">
                  <Mail className="h-8 w-8 mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">Contact Us</h4>
                  <p className="text-sm text-muted-foreground">Send us a message for help</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="pt-6">
                  <FileText className="h-8 w-8 mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">Documentation</h4>
                  <p className="text-sm text-muted-foreground">Browse our guides and tutorials</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="pt-6">
                  <User className="h-8 w-8 mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">Community</h4>
                  <p className="text-sm text-muted-foreground">Join our user community</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case "Security":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Security Settings</h3>
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-l-green-500 pl-4 py-2">
                  <p className="font-medium text-green-600">Password Protected</p>
                  <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                  <Button variant="outline" size="sm" className="mt-2">Change Password</Button>
                </div>
                <div className="border-l-4 border-l-yellow-500 pl-4 py-2">
                  <p className="font-medium text-yellow-600">Two-Factor Authentication Not Enabled</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  <Button variant="outline" size="sm" className="mt-2">Enable 2FA</Button>
                </div>
                <div className="border-l-4 border-l-blue-500 pl-4 py-2">
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-muted-foreground">2 devices currently logged in</p>
                  <Button variant="outline" size="sm" className="mt-2">Manage Sessions</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return `Content for ${tabName}`;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Expandable Tabs Demo</h1>
          <p className="text-muted-foreground">Click on the tabs to see how they expand and reveal their labels</p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Default Style</h2>
            <ExpandableTabs tabs={mainTabs} onChange={setSelectedTab} />
            
            <Card className="mt-6">
              <CardContent className="pt-6">
                {getTabContent(selectedTab)}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Custom Color - Blue</h2>
            <ExpandableTabs 
              tabs={secondaryTabs}
              activeColor="text-blue-500"
              className="border-blue-200 dark:border-blue-800"
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Custom Color - Green (Shopper Theme)</h2>
            <ExpandableTabs 
              tabs={shopperTabs}
              activeColor="text-green-600"
              className="border-green-200 dark:border-green-800"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Hover to expand:</strong> Icons expand to show labels on hover</li>
              <li>• <strong>Click to select:</strong> Click any tab to keep it expanded</li>
              <li>• <strong>Click outside to collapse:</strong> Click anywhere outside to reset</li>
              <li>• <strong>Separators:</strong> Visual dividers between tab groups</li>
              <li>• <strong>Custom colors:</strong> Easily customize the active tab color</li>
              <li>• <strong>Smooth animations:</strong> Spring-based motion for natural feel</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpandableTabsDemo;
