
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TableOrdersDialogProps {
  table: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TableOrdersDialog = ({ table, open, onOpenChange }: TableOrdersDialogProps) => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['table-orders', table?.id],
    queryFn: async () => {
      if (!table?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers(first_name, last_name),
          order_items(
            id,
            quantity,
            unit_price,
            products(name)
          )
        `)
        .eq('table_id', table.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!table?.id && open
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

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commandes de la table {table.table_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Chargement des commandes...</p>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Aucune commande pour cette table</p>
            </div>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">#{order.order_number}</CardTitle>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.customers && (
                      <span>{order.customers.first_name} {order.customers.last_name} • </span>
                    )}
                    <span>{new Date(order.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Articles commandés</h4>
                      <div className="space-y-1">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.products?.name}</span>
                            <span className="font-medium">
                              {(item.quantity * item.unit_price).toFixed(2)}€
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {order.notes && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {order.notes}
                          </p>
                        </div>
                      </>
                    )}
                    
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-bold text-amber-600">
                        {order.total_amount?.toFixed(2) || '0.00'}€
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
