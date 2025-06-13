
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/pages/Dashboard";
import { TablesManagement } from "@/components/pages/TablesManagement";
import { MenuManagement } from "@/components/pages/MenuManagement";
import { MenusManagement } from "@/components/pages/MenusManagement";
import { StockManagement } from "@/components/pages/StockManagement";
import { OrdersManagement } from "@/components/pages/OrdersManagement";
import { CustomersManagement } from "@/components/pages/CustomersManagement";
import { StaffManagement } from "@/components/pages/StaffManagement";
import { Settings } from "@/components/pages/Settings";
import { Reports } from "@/components/pages/Reports";
import { Login } from "@/components/pages/Login";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const currentUserData = localStorage.getItem('currentUser');
    if (currentUserData) {
      const user = JSON.parse(currentUserData);
      console.log("Utilisateur trouvé dans localStorage:", user);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    const currentUserData = localStorage.getItem('currentUser');
    if (currentUserData) {
      const user = JSON.parse(currentUserData);
      console.log("Connexion réussie, utilisateur:", user);
      setCurrentUser(user);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab("dashboard");
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

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
      case "staff":
        return <StaffManagement />;
      case "settings":
        return <Settings />;
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
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="text-lg font-semibold text-gray-800">
                  Bonjour, <span className="text-amber-600">{currentUser.username}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Déconnexion
            </button>
          </div>
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
