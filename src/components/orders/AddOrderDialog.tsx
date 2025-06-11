
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AddOrderDialog = () => {
  const [open, setOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [tableId, setTableId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Générer un numéro de commande automatique
  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `CMD${timestamp}`;
  };

  // Récupérer les tables disponibles
  const { data: tables } = useQuery({
    queryKey: ['available-tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('status', 'available')
        .order('table_number');
      
      if (error) throw error;
      return data;
    }
  });

  // Récupérer les clients
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('first_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Récupérer les serveurs
  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('role', 'serveur')
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      return data;
    }
  });

  const createOrder = useMutation({
    mutationFn: async () => {
      const finalOrderNumber = orderNumber || generateOrderNumber();
      
      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: finalOrderNumber,
          table_id: tableId || null,
          customer_id: customerId || null,
          staff_id: staffId || null,
          notes: notes || null,
          status: 'en_attente',
          total_amount: 0,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Mettre à jour le statut de la table si une table est sélectionnée
      if (tableId) {
        const { error: tableError } = await supabase
          .from('restaurant_tables')
          .update({ status: 'occupee' })
          .eq('id', tableId);
        
        if (tableError) throw tableError;
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      queryClient.invalidateQueries({ queryKey: ['available-tables'] });
      toast({
        title: "Commande créée",
        description: "La commande a été créée avec succès.",
      });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setOrderNumber("");
    setTableId("");
    setCustomerId("");
    setStaffId("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrder.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Commande
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle commande</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Numéro de commande</Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Auto-généré si vide"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table">Table</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une table" />
                </SelectTrigger>
                <SelectContent>
                  {tables?.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.table_number} ({table.capacity} places)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Client (optionnel)</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="server">Serveur</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un serveur" />
                </SelectTrigger>
                <SelectContent>
                  {servers?.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.first_name} {server.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur la commande..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createOrder.isPending}>
              {createOrder.isPending ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
