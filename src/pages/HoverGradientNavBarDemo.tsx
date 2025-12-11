import HoverGradientNavBar from "@/components/ui/hover-gradient-nav-bar";

export default function HoverGradientNavBarDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-center mb-4 text-foreground">
          Hover Gradient NavBar Demo
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Hover over the navigation items at the bottom to see the 3D flip animation with gradient glow effects.
        </p>
        <div className="max-w-2xl mx-auto bg-card rounded-xl p-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• 3D flip animation on hover</li>
            <li>• Unique gradient glow per item</li>
            <li>• Responsive design (icons on mobile, labels on desktop)</li>
            <li>• Dark mode support</li>
            <li>• Smooth spring animations</li>
          </ul>
        </div>
      </div>
      <HoverGradientNavBar />
    </div>
  );
}
