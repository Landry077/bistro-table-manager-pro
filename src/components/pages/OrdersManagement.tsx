
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye, Edit, Clock, DollarSign, Receipt } from "lucide-react";
import { AddOrderDialog } from "@/components/orders/AddOrderDialog";
import { useToast } from "@/hooks/use-toast";

export const OrdersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ['orders', statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          restaurant_tables(table_number),
          customers(first_name, last_name, email),
          order_items(
            id,
            quantity,
            unit_price,
            products(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.ilike('order_number', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status, tableId }: { orderId: string; status: string; tableId?: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      if (error) throw error;

      // Si la commande est terminée (payée), libérer la table
      if (status === 'paid' && tableId) {
        const { error: tableError } = await supabase
          .from('restaurant_tables')
          .update({ status: 'cleaning' })
          .eq('id', tableId);
        
        if (tableError) throw tableError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été modifié avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la commande.",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'preparing': return 'bg-blue-500';
      case 'ready': return 'bg-green-500';
      case 'served': return 'bg-purple-500';
      case 'paid': return 'bg-emerald-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prêt';
      case 'served': return 'Servi';
      case 'paid': return 'Payé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const statusOptions = [
    { value: "all", label: "Toutes" },
    { value: "pending", label: "En attente" },
    { value: "preparing", label: "En préparation" },
    { value: "ready", label: "Prêt" },
    { value: "served", label: "Servi" },
    { value: "paid", label: "Payé" },
    { value: "cancelled", label: "Annulé" },
  ];

  const handleStatusChange = (orderId: string, newStatus: string, tableId?: string) => {
    updateOrderStatus.mutate({ orderId, status: newStatus, tableId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="text-gray-600 mt-1">Suivez et gérez toutes vos commandes</p>
        </div>
        <AddOrderDialog />
      </div>

      {/* Filtres et recherche */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par numéro de commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? "default" : "outline"}
                  onClick={() => setStatusFilter(option.value)}
                  className={statusFilter === option.value ? "bg-amber-600 hover:bg-amber-700" : ""}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <div className="space-y-4">
        {orders?.map((order) => (
          <Card key={order.id} className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">#{order.order_number}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Table {order.restaurant_tables?.table_number || 'N/A'}</span>
                        {order.customers && (
                          <span>• {order.customers.first_name} {order.customers.last_name}</span>
                        )}
                        <span>• {new Date(order.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Articles commandés</h4>
                      <div className="space-y-1">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.products?.name}</span>
                            <span>{(item.quantity * item.unit_price).toFixed(2)}€</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {order.notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {order.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions rapides */}
                  <div className="flex flex-wrap gap-2">
                    {order.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusChange(order.id, 'preparing')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Démarrer préparation
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusChange(order.id, 'ready')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Marquer prêt
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusChange(order.id, 'served')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Marquer servi
                      </Button>
                    )}
                    {order.status === 'served' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusChange(order.id, 'paid', order.table_id)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Receipt className="h-4 w-4 mr-1" />
                        Générer reçu
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-3 ml-6">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-2xl font-bold text-gray-900">
                      <DollarSign className="h-6 w-6 text-amber-600" />
                      <span>{order.total_amount?.toFixed(2) || '0.00'}€</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>
                        {Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60))} min
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!orders || orders.length === 0) && (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <p className="text-lg mb-2">Aucune commande trouvée</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== "all" 
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Aucune commande n'a encore été passée"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
