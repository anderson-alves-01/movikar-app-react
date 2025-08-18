import React from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface AnimatedNavItemProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

export function AnimatedNavItem({ 
  href, 
  children, 
  className = "", 
  activeClassName = "text-primary" 
}: AnimatedNavItemProps) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link href={href}>
        <div className={cn(
          "nav-item px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
          isActive ? activeClassName : "text-gray-600 hover:text-gray-900",
          className
        )}>
          {children}
        </div>
      </Link>
      
      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-current"
          layoutId="activeIndicator"
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30
          }}
        />
      )}
    </motion.div>
  );
}

interface AnimatedNavProps {
  items: Array<{
    href: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export function AnimatedNav({ items, className }: AnimatedNavProps) {
  return (
    <nav className={cn("flex space-x-1", className)}>
      {items.map((item, index) => (
        <motion.div
          key={item.href}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.1,
            ease: "easeOut"
          }}
        >
          <AnimatedNavItem href={item.href}>
            <div className="flex items-center space-x-2">
              {item.icon}
              <span>{item.label}</span>
            </div>
          </AnimatedNavItem>
        </motion.div>
      ))}
    </nav>
  );
}