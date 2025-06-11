
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
      // Supprimer d'abord les produits du menu
      const { error: menuProductsError } = await supabase
        .from('menu_products')
        .delete()
        .eq('menu_id', menu.id);
      
      if (menuProductsError) throw menuProductsError;

      // Ensuite supprimer le menu
      const { error: menuError } = await supabase
        .from('menus')
        .delete()
        .eq('id', menu.id);
      
      if (menuError) throw menuError;
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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le menu "{menu?.name}" ? 
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMenu.mutate()}
            disabled={deleteMenu.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteMenu.isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
