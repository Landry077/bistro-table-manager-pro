
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Minus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AddOrderDialog = () => {
  const [open, setOpen] = useState(false);
  const [tableId, setTableId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: availableTables } = useQuery({
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

  const { data: customers } = useQuery({
    queryKey: ['customers-for-order'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('first_name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: products } = useQuery({
    queryKey: ['products-for-order'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const createOrder = useMutation({
    mutationFn: async () => {
      // Générer un numéro de commande unique
      const orderNumber = `CMD-${Date.now()}`;
      
      // Calculer le total
      const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          table_id: tableId,
          customer_id: customerId || null,
          total_amount: totalAmount,
          notes: notes || null,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Créer les éléments de la commande
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          orderItems.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        );

      if (itemsError) throw itemsError;

      // Mettre à jour le statut de la table
      const { error: tableError } = await supabase
        .from('restaurant_tables')
        .update({ status: 'occupied' })
        .eq('id', tableId);

      if (tableError) throw tableError;

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
    setTableId("");
    setCustomerId("");
    setNotes("");
    setOrderItems([]);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: 1, unit_price: 0 }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    
    if (field === "product_id") {
      const product = products?.find(p => p.id === value);
      if (product) {
        updated[index].unit_price = product.price;
      }
    }
    
    setOrderItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableId || orderItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une table et ajouter au moins un produit.",
        variant: "destructive",
      });
      return;
    }

    const hasIncompleteItems = orderItems.some(item => !item.product_id || item.quantity <= 0);
    if (hasIncompleteItems) {
      toast({
        title: "Erreur",
        description: "Veuillez compléter tous les produits de la commande.",
        variant: "destructive",
      });
      return;
    }

    createOrder.mutate();
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Commande
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle commande</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Table *</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables?.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.table_number} ({table.capacity} pers.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Client (optionnel)</Label>
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
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Produits de la commande</Label>
              <Button type="button" onClick={addOrderItem} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un produit
              </Button>
            </div>
            
            {orderItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                <div className="flex-1">
                  <Select 
                    value={item.product_id} 
                    onValueChange={(value) => updateOrderItem(index, "product_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.price}€
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => updateOrderItem(index, "quantity", Math.max(1, item.quantity - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => updateOrderItem(index, "quantity", item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="w-20 text-right font-medium">
                  {(item.quantity * item.unit_price).toFixed(2)}€
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => removeOrderItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes pour la commande..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-xl font-bold">
              Total: {totalAmount.toFixed(2)}€
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createOrder.isPending}>
                {createOrder.isPending ? "Création..." : "Créer la commande"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
