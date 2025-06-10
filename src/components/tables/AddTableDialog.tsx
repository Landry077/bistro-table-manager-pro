
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export const AddTableDialog = () => {
  const [open, setOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [positionX, setPositionX] = useState("");
  const [positionY, setPositionY] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addTable = useMutation({
    mutationFn: async (newTable: {
      table_number: number;
      capacity: number;
      position_x: number;
      position_y: number;
    }) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .insert([newTable]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast({
        title: "Table ajoutée",
        description: "La nouvelle table a été ajoutée avec succès.",
      });
      setOpen(false);
      setTableNumber("");
      setCapacity("");
      setPositionX("");
      setPositionY("");
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la table. Vérifiez que le numéro de table n'existe pas déjà.",
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

    addTable.mutate({
      table_number: parseInt(tableNumber),
      capacity: parseInt(capacity),
      position_x: positionX ? parseInt(positionX) : Math.floor(Math.random() * 400) + 50,
      position_y: positionY ? parseInt(positionY) : Math.floor(Math.random() * 300) + 50,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Table
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter une nouvelle table</DialogTitle>
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
                placeholder="Ex: 9"
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
                placeholder="Ex: 4"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="positionX">Position X (optionnel)</Label>
              <Input
                id="positionX"
                type="number"
                value={positionX}
                onChange={(e) => setPositionX(e.target.value)}
                placeholder="Auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="positionY">Position Y (optionnel)</Label>
              <Input
                id="positionY"
                type="number"
                value={positionY}
                onChange={(e) => setPositionY(e.target.value)}
                placeholder="Auto"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={addTable.isPending}>
              {addTable.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
