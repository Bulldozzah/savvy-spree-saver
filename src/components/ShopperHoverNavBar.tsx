'use client'
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ShoppingCart, Search, TrendingDown, User, MessageSquare, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

interface ShopperHoverNavBarProps {
  activeSection: number;
  onNavigate: (section: number) => void;
}

interface HoverGradientMenuItem {
  icon: React.ReactNode;
  label: string;
  index: number;
  gradient: string;
  iconColor: string;
}

// Animation variants
const itemVariants: Variants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants: Variants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
};

const glowVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
};

const sharedTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

function ShopperHoverNavBar({ activeSection, onNavigate }: ShopperHoverNavBarProps): React.JSX.Element {
  const { theme, setTheme } = useTheme();

  const menuItems: HoverGradientMenuItem[] = [
    { icon: <ShoppingCart className="h-5 w-5" />, label: "My Lists", index: 0, gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)", iconColor: "group-hover:text-green-500 dark:group-hover:text-green-400" },
    { icon: <Search className="h-5 w-5" />, label: "Search", index: 1, gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)", iconColor: "group-hover:text-blue-500 dark:group-hover:text-blue-400" },
    { icon: <TrendingDown className="h-5 w-5" />, label: "Prices", index: 2, gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)", iconColor: "group-hover:text-orange-500 dark:group-hover:text-orange-400" },
    { icon: <User className="h-5 w-5" />, label: "Profile", index: 3, gradient: "radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(126,34,206,0.06) 50%, rgba(88,28,135,0) 100%)", iconColor: "group-hover:text-purple-500 dark:group-hover:text-purple-400" },
    { icon: <MessageSquare className="h-5 w-5" />, label: "Feedback", index: 4, gradient: "radial-gradient(circle, rgba(20,184,166,0.15) 0%, rgba(13,148,136,0.06) 50%, rgba(15,118,110,0) 100%)", iconColor: "group-hover:text-teal-500 dark:group-hover:text-teal-400" },
  ];

  const handleItemClick = (index: number) => {
    onNavigate(index);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="fixed top-[73px] left-0 right-0 z-40">
      <motion.nav
        className="w-full px-2 md:px-4 py-2 md:py-3 
        backdrop-blur-lg 
        border-b border-gray-200/80 dark:border-gray-800/80 
        shadow-sm relative"
        style={{ backgroundColor: '#e1e5f3' }}
        initial="initial"
        whileHover="hover"
      >
        <ul className="flex items-center justify-around md:justify-center gap-1 md:gap-3 relative z-10">
          {menuItems.map((item: HoverGradientMenuItem) => (
            <motion.li key={item.label} className="relative flex-1 md:flex-none">
              <motion.div
                className="block rounded-xl md:rounded-2xl overflow-visible group relative cursor-pointer"
                style={{ perspective: "600px" }}
                whileHover="hover"
                initial="initial"
                onClick={() => handleItemClick(item.index)}
              >
                {/* Per-item glow */}
                <motion.div
                  className="absolute inset-0 z-0 pointer-events-none rounded-xl md:rounded-2xl"
                  variants={glowVariants}
                  style={{
                    background: item.gradient,
                    opacity: 0,
                  }}
                />
                {/* Active indicator */}
                {activeSection === item.index && (
                  <motion.div
                    className="absolute inset-0 z-0 rounded-xl md:rounded-2xl bg-primary/10"
                    layoutId="activeSection"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {/* Front-facing */}
                <motion.div
                  className={`flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 
                  px-2 py-1.5 md:px-4 md:py-2 relative z-10 
                  bg-transparent 
                  ${activeSection === item.index ? 'text-primary' : 'text-gray-600 dark:text-gray-300'}
                  group-hover:text-gray-900 dark:group-hover:text-white 
                  transition-colors rounded-xl md:rounded-2xl text-xs md:text-sm`}
                  variants={itemVariants}
                  transition={sharedTransition}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center bottom"
                  }}
                >
                  <span className={`transition-colors duration-300 ${activeSection === item.index ? 'text-primary' : item.iconColor}`}>
                    {item.icon}
                  </span>
                  <span className="hidden md:inline font-medium">{item.label}</span>
                </motion.div>
                {/* Back-facing */}
                <motion.div
                  className={`flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 
                  px-2 py-1.5 md:px-4 md:py-2 absolute inset-0 z-10 
                  bg-transparent 
                  ${activeSection === item.index ? 'text-primary' : 'text-gray-600 dark:text-gray-300'}
                  group-hover:text-gray-900 dark:group-hover:text-white 
                  transition-colors rounded-xl md:rounded-2xl text-xs md:text-sm`}
                  variants={backVariants}
                  transition={sharedTransition}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center top",
                    transform: "rotateX(90deg)"
                  }}
                >
                  <span className={`transition-colors duration-300 ${activeSection === item.index ? 'text-primary' : item.iconColor}`}>
                    {item.icon}
                  </span>
                  <span className="hidden md:inline font-medium">{item.label}</span>
                </motion.div>
              </motion.div>
            </motion.li>
          ))}
          
          {/* Theme Toggle */}
          <motion.li className="relative flex-1 md:flex-none">
            <motion.div
              className="block rounded-xl md:rounded-2xl overflow-visible group relative cursor-pointer"
              style={{ perspective: "600px" }}
              whileHover="hover"
              initial="initial"
              onClick={toggleTheme}
            >
              <motion.div
                className="absolute inset-0 z-0 pointer-events-none rounded-xl md:rounded-2xl"
                variants={glowVariants}
                style={{
                  background: "radial-gradient(circle, rgba(234,179,8,0.15) 0%, rgba(202,138,4,0.06) 50%, rgba(161,98,7,0) 100%)",
                  opacity: 0,
                }}
              />
              <motion.div
                className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 
                px-2 py-1.5 md:px-4 md:py-2 relative z-10 
                bg-transparent text-gray-600 dark:text-gray-300 
                group-hover:text-gray-900 dark:group-hover:text-white 
                transition-colors rounded-xl md:rounded-2xl text-xs md:text-sm"
                variants={itemVariants}
                transition={sharedTransition}
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "center bottom"
                }}
              >
                <span className="transition-colors duration-300 group-hover:text-yellow-500 dark:group-hover:text-yellow-400">
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </span>
                <span className="hidden md:inline font-medium">{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </motion.div>
              <motion.div
                className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 
                px-2 py-1.5 md:px-4 md:py-2 absolute inset-0 z-10 
                bg-transparent text-gray-600 dark:text-gray-300 
                group-hover:text-gray-900 dark:group-hover:text-white 
                transition-colors rounded-xl md:rounded-2xl text-xs md:text-sm"
                variants={backVariants}
                transition={sharedTransition}
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "center top",
                  transform: "rotateX(90deg)"
                }}
              >
                <span className="transition-colors duration-300 group-hover:text-yellow-500 dark:group-hover:text-yellow-400">
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </span>
                <span className="hidden md:inline font-medium">{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </motion.div>
            </motion.div>
          </motion.li>

        </ul>
      </motion.nav>
    </div>
  );
}

export default ShopperHoverNavBar;
