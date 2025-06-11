
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditStaffDialogProps {
  staff: any;
}

export const EditStaffDialog = ({ staff }: EditStaffDialogProps) => {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState(staff.first_name);
  const [lastName, setLastName] = useState(staff.last_name);
  const [email, setEmail] = useState(staff.email || "");
  const [phone, setPhone] = useState(staff.phone || "");
  const [role, setRole] = useState(staff.role);
  const [isActive, setIsActive] = useState(staff.is_active);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStaff = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('staff')
        .update({
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          phone: phone || null,
          role: role,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', staff.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Personnel modifié",
        description: "Les informations du personnel ont été mises à jour.",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le personnel.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !role) {
      toast({
        title: "Erreur",
        description: "Le prénom, nom et rôle sont obligatoires.",
        variant: "destructive",
      });
      return;
    }
    updateStaff.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le personnel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prénom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nom"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0123456789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cuisinier">Cuisinier</SelectItem>
                <SelectItem value="gerant">Gérant</SelectItem>
                <SelectItem value="serveur">Serveur</SelectItem>
                <SelectItem value="superviseur">Superviseur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Personnel actif</Label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateStaff.isPending}>
              {updateStaff.isPending ? "Modification..." : "Modifier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
