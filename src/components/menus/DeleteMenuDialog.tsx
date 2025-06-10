
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface DeleteMenuDialogProps {
  menu: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteMenuDialog = ({ menu, open, onOpenChange }: DeleteMenuDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMenu = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', menu.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast({
        title: "Menu supprimé",
        description: "Le menu a été supprimé avec succès.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le menu.",
        variant: "destructive",
      });
    }
  });

  const handleDelete = () => {
    deleteMenu.mutate();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le menu "{menu?.name}" ? 
            Cette action est irréversible et supprimera également tous les produits associés à ce menu.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteMenu.isPending}
          >
            {deleteMenu.isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
