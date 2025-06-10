
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface EditTableDialogProps {
  table: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTableDialog = ({ table, open, onOpenChange }: EditTableDialogProps) => {
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [positionX, setPositionX] = useState("");
  const [positionY, setPositionY] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (table) {
      setTableNumber(table.table_number?.toString() || "");
      setCapacity(table.capacity?.toString() || "");
      setPositionX(table.position_x?.toString() || "0");
      setPositionY(table.position_y?.toString() || "0");
    }
  }, [table]);

  const updateTable = useMutation({
    mutationFn: async (updatedTable: {
      table_number: number;
      capacity: number;
      position_x: number;
      position_y: number;
    }) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .update(updatedTable)
        .eq('id', table.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast({
        title: "Table modifiée",
        description: "Les informations de la table ont été mises à jour avec succès.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la table.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber || !capacity) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    updateTable.mutate({
      table_number: parseInt(tableNumber),
      capacity: parseInt(capacity),
      position_x: parseInt(positionX),
      position_y: parseInt(positionY),
    });
  };

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier la table {table.table_number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tableNumber">Numéro de table *</Label>
              <Input
                id="tableNumber"
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacité *</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="positionX">Position X</Label>
              <Input
                id="positionX"
                type="number"
                value={positionX}
                onChange={(e) => setPositionX(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="positionY">Position Y</Label>
              <Input
                id="positionY"
                type="number"
                value={positionY}
                onChange={(e) => setPositionY(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateTable.isPending}>
              {updateTable.isPending ? "Modification..." : "Modifier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
