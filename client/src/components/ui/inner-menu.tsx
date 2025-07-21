import { useState } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface InnerMenuTab {
  id: string;
  label: string;
  content: React.ReactNode;
  badge?: number;
  icon?: LucideIcon;
}

interface InnerMenuProps {
  tabs: InnerMenuTab[];
  defaultTab?: string;
  className?: string;
}

export function InnerMenu({ tabs, defaultTab, className }: InnerMenuProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={cn("w-full", className)}>
      {/* Top Navigation Menu */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="px-8 pt-6">
          <div className="flex space-x-0 border-b border-gray-300">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-6 py-3 text-sm font-semibold border-b-2 transition-all duration-200",
                  "flex items-center gap-2 min-w-0 uppercase tracking-wide",
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-700 bg-white -mb-px"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                )}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                <span className="truncate">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold rounded-full",
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-500 text-white"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white min-h-screen">
        {activeTabContent}
      </div>
    </div>
  );
}