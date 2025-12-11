import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Menu, X, ChevronLeft, ListChecks, TrendingDown, Search, User, MessageSquare, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

interface ShopperAnimatedMenuProps {
  activeSection: number;
  onNavigate: (index: number) => void;
  onLogout: () => void;
}

export default function ShopperAnimatedMenu({ activeSection, onNavigate, onLogout }: ShopperAnimatedMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-200, 0], [0, 1]);
  const { theme, setTheme } = useTheme();

  const menuItems = [
    { icon: ListChecks, label: 'My Shopping Lists', index: 0 },
    { icon: TrendingDown, label: 'Check Prices', index: 1 },
    { icon: Search, label: 'Search & Add Products', index: 2 },
    { icon: User, label: 'Edit Profile', index: 3 },
    { icon: MessageSquare, label: 'Give Feedback', index: 4 },
    { icon: theme === 'dark' ? Sun : Moon, label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', index: -2 },
    { icon: LogOut, label: 'Logout', index: -1 },
  ];

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x < -100) {
      setIsOpen(false);
    }
    dragX.set(0);
  };

  const handleMenuItemClick = (index: number) => {
    if (index === -1) {
      onLogout();
    } else if (index === -2) {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    } else {
      onNavigate(index);
    }
    setIsOpen(false);
  };

  const menuVariants = {
    closed: {
      x: '-100%',
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 30,
        mass: 0.8,
      },
    },
    open: {
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 30,
        mass: 0.8,
      },
    },
  };

  const itemVariants = {
    closed: { x: -50, opacity: 0 },
    open: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: 0.1 + i * 0.08,
        type: 'spring' as const,
        stiffness: 250,
        damping: 25,
      },
    }),
  };

  const overlayVariants = {
    closed: { 
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
    open: { 
      opacity: 1,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <>
      {/* Menu Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-card text-foreground hover:bg-primary/10 shadow-lg transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Side Menu */}
      <motion.nav
        variants={menuVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        drag="x"
        dragConstraints={{ left: -320, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        className="fixed top-0 left-0 h-full w-80 z-50 shadow-2xl bg-card"
      >
        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 p-2 rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors"
        >
          <X size={24} />
        </motion.button>

        {/* Drag Indicator */}
        <motion.div
          style={{ opacity: dragOpacity }}
          className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none"
        >
          <ChevronLeft size={32} className="text-muted-foreground" />
        </motion.div>

        <div className="p-8 pt-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring' as const, stiffness: 200 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground">
              Navigation
            </h2>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
              className="h-1 mt-2 rounded bg-primary"
            />
          </motion.div>

          <ul className="space-y-4">
            {menuItems.map((item, i) => (
              <motion.li
                key={item.label}
                custom={i}
                variants={itemVariants}
                initial="closed"
                animate={isOpen ? 'open' : 'closed'}
              >
                <button
                  onClick={() => handleMenuItemClick(item.index)}
                  className={`w-full flex items-center justify-start space-x-3 p-3 rounded-lg transition-all ${
                    activeSection === item.index
                      ? 'bg-primary/20 shadow-[0_0_20px_rgba(34,197,94,0.25)]'
                      : 'hover:bg-primary/10'
                  } group`}
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 8 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-lg ${
                      activeSection === item.index
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted group-hover:bg-primary group-hover:text-primary-foreground'
                    } transition-all duration-300`}
                  >
                    <item.icon size={20} />
                  </motion.div>
                  <span className={`text-sm font-medium ${
                    activeSection === item.index ? 'text-primary' : 'text-foreground'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>

        </div>
      </motion.nav>
    </>
  );
}
