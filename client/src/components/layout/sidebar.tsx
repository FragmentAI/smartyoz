import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  User, 
  Inbox, 
  Users, 
  DollarSign, 
  Building, 
  MessageSquare, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Jobs", href: "/jobs", icon: Building },
  { name: "Candidates", href: "/candidates", icon: User },
  { name: "Interviews", href: "/interviews", icon: Calendar },
  { name: "Bulk Hire", href: "/bulk-hire", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "SmartAssist", href: "/smart-assist", icon: Bot },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  
  const isExpanded = !collapsed || isHovered;

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
        "bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900",
        isExpanded ? "w-48" : "w-16"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex h-full flex-col">
        {/* Navigation */}
        <nav className="flex-1 px-1 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex flex-col items-center px-2 py-3 text-xs font-medium transition-all duration-200 relative",
                  "hover:bg-slate-600/50 rounded-lg",
                  isActive
                    ? "bg-slate-600/70 text-white"
                    : "text-slate-300 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "flex-shrink-0 h-5 w-5 transition-colors duration-200 mb-1",
                  isActive 
                    ? "text-white" 
                    : "text-slate-300 group-hover:text-white"
                )} />
                <span className={cn(
                  "text-center transition-all duration-300 leading-tight",
                  isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                )}>
                  {item.name}
                </span>
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}