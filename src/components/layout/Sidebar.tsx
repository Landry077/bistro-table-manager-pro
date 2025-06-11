import { useState } from "react";
import { 
  BarChart3, 
  Table, 
  Menu, 
  ShoppingCart, 
  Users, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Coffee,
  Package,
  UserCog,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { id: "tables", label: "Gestion des tables", icon: Table },
    { id: "menu", label: "Menu & Produits", icon: Menu },
    { id: "menus", label: "Gestion des Menus", icon: Coffee },
    { id: "stock", label: "Gestion du Stock", icon: Package },
    { id: "orders", label: "Commandes", icon: ShoppingCart },
    { id: "customers", label: "Clients", icon: Users },
    { id: "staff", label: "Personnel", icon: UserCog },
    { id: "settings", label: "Paramètres", icon: Settings },
    { id: "reports", label: "Rapports", icon: FileText },
  ];

  return (
    <div className={cn(
      "bg-gradient-to-b from-amber-900 to-amber-800 text-white transition-all duration-300 shadow-2xl",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-amber-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-amber-300" />
              <div>
                <h1 className="font-bold text-lg text-amber-100">RestauPOS</h1>
                <p className="text-xs text-amber-300">Gestion Restaurant</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-amber-700 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <nav className="mt-4 space-y-2 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                activeTab === item.id
                  ? "bg-amber-600 text-white shadow-lg transform scale-105"
                  : "hover:bg-amber-700 text-amber-100 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-amber-700/50 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-200">Version 1.0</p>
            <p className="text-xs text-amber-300 mt-1">© 2024 RestauPOS</p>
          </div>
        </div>
      )}
    </div>
  );
};
