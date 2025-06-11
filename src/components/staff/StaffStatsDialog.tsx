
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface StaffStatsDialogProps {
  staffId: string;
  staffName: string;
}

export const StaffStatsDialog = ({ staffId, staffName }: StaffStatsDialogProps) => {
  const [open, setOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['staff-stats', staffId],
    queryFn: async () => {
      // Récupérer les statistiques des commandes pour ce serveur
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('staff_id', staffId)
        .eq('status', 'payee');
      
      if (error) throw error;
      
      const totalOrders = orders?.length || 0;
      const totalSales = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      
      return {
        totalOrders,
        totalSales,
        averageOrderValue
      };
    },
    enabled: open
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Statistiques de {staffName}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Commandes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ventes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSales?.toFixed(2) || 0}€</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageOrderValue?.toFixed(2) || 0}€</div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
