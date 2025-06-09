
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, Users } from "lucide-react";

export const Reports = () => {
  const { data: salesData } = useQuery({
    queryKey: ['sales-reports'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('created_at, total_amount, status')
        .order('created_at', { ascending: false });

      // Traitement des données pour les graphiques
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
          sales: 0,
          orders: 0
        };
      }).reverse();

      data?.forEach(order => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        const dayData = last7Days.find(day => day.date === orderDate);
        if (dayData && order.status === 'paid') {
          dayData.sales += order.total_amount || 0;
          dayData.orders += 1;
        }
      });

      return last7Days;
    }
  });

  const { data: categoryData } = useQuery({
    queryKey: ['category-reports'],
    queryFn: async () => {
      const { data } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          products(
            name,
            categories(name, color)
          )
        `);

      const categoryStats: Record<string, { name: string; value: number; color: string }> = {};
      
      data?.forEach(item => {
        const categoryName = item.products?.categories?.name || 'Autre';
        const categoryColor = item.products?.categories?.color || '#8884d8';
        const revenue = item.quantity * item.unit_price;
        
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = { name: categoryName, value: 0, color: categoryColor };
        }
        categoryStats[categoryName].value += revenue;
      });

      return Object.values(categoryStats);
    }
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('order_items')
        .select(`
          quantity,
          products(name)
        `);

      const productStats: Record<string, { name: string; quantity: number }> = {};
      
      data?.forEach(item => {
        const productName = item.products?.name || 'Produit inconnu';
        if (!productStats[productName]) {
          productStats[productName] = { name: productName, quantity: 0 };
        }
        productStats[productName].quantity += item.quantity;
      });

      return Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    }
  });

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-gray-600 mt-1">Analysez les performances de votre restaurant</p>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Ventes (7 jours)</CardTitle>
            <DollarSign className="h-6 w-6 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesData?.reduce((sum, day) => sum + day.sales, 0).toFixed(2) || '0.00'}€
            </div>
            <p className="text-xs opacity-80 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Dernière semaine
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Commandes (7 jours)</CardTitle>
            <ShoppingCart className="h-6 w-6 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesData?.reduce((sum, day) => sum + day.orders, 0) || 0}
            </div>
            <p className="text-xs opacity-80">
              Dernière semaine
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Panier moyen</CardTitle>
            <DollarSign className="h-6 w-6 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesData && salesData.reduce((sum, day) => sum + day.orders, 0) > 0
                ? (salesData.reduce((sum, day) => sum + day.sales, 0) / salesData.reduce((sum, day) => sum + day.orders, 0)).toFixed(2)
                : '0.00'
              }€
            </div>
            <p className="text-xs opacity-80">
              Par commande
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Catégories</CardTitle>
            <Users className="h-6 w-6 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryData?.length || 0}</div>
            <p className="text-xs opacity-80">
              Catégories actives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Évolution des ventes (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)}€`, 'Ventes']}
                  labelFormatter={(label) => `Jour: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toFixed(2)}€`, 'Chiffre d\'affaires']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Nombre de commandes par jour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [value, 'Commandes']}
                  labelFormatter={(label) => `Jour: ${label}`}
                />
                <Bar dataKey="orders" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Top 5 des produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts?.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{product.quantity}</span>
                    <span className="text-sm text-gray-500 ml-1">vendus</span>
                  </div>
                </div>
              ))}
              {(!topProducts || topProducts.length === 0) && (
                <p className="text-gray-500 text-center py-4">Aucune donnée de vente disponible</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
