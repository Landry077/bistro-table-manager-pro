
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/pages/Dashboard";
import { TablesManagement } from "@/components/pages/TablesManagement";
import { MenuManagement } from "@/components/pages/MenuManagement";
import { MenusManagement } from "@/components/pages/MenusManagement";
import { StockManagement } from "@/components/pages/StockManagement";
import { OrdersManagement } from "@/components/pages/OrdersManagement";
import { CustomersManagement } from "@/components/pages/CustomersManagement";
import { Reports } from "@/components/pages/Reports";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "tables":
        return <TablesManagement />;
      case "menu":
        return <MenuManagement />;
      case "menus":
        return <MenusManagement />;
      case "stock":
        return <StockManagement />;
      case "orders":
        return <OrdersManagement />;
      case "customers":
        return <CustomersManagement />;
      case "reports":
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
