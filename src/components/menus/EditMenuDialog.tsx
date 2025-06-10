import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditMenuDialogProps {
  menu: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MenuProduct {
  product_id: string;
  quantity: number;
  product?: any;
}

export const EditMenuDialog = ({ menu, open, onOpenChange }: EditMenuDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [menuProducts, setMenuProducts] = useState<MenuProduct[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: products } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('name');

      if (selectedCategory !== "all") {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (menu) {
      setName(menu.name || "");
      setDescription(menu.description || "");
      setPrice(menu.price?.toString() || "");
      setImageUrl(menu.image_url || "");
      setIsAvailable(menu.is_available ?? true);
      
      // Charger les produits du menu
      if (menu.menu_products) {
        setMenuProducts(menu.menu_products.map((mp: any) => ({
          product_id: mp.products?.id || mp.product_id,
          quantity: mp.quantity,
          product: mp.products
        })));
      }
    }
  }, [menu]);

  const updateMenu = useMutation({
    mutationFn: async () => {
      // Mettre à jour le menu
      const { error: menuError } = await supabase
        .from('menus')
        .update({
          name,
          description: description || undefined,
          price: parseFloat(price),
          image_url: imageUrl || undefined,
          is_available: isAvailable,
        })
        .eq('id', menu.id);
      
      if (menuError) throw menuError;

      // Supprimer les anciens produits du menu
      const { error: deleteError } = await supabase
        .from('menu_products')
        .delete()
        .eq('menu_id', menu.id);
      
      if (deleteError) throw deleteError;

      // Ajouter les nouveaux produits du menu
      if (menuProducts.length > 0) {
        const menuProductsData = menuProducts.map(mp => ({
          menu_id: menu.id,
          product_id: mp.product_id,
          quantity: mp.quantity,
        }));

        const { error: productsError } = await supabase
          .from('menu_products')
          .insert(menuProductsData);
        
        if (productsError) throw productsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast({
        title: "Menu modifié",
        description: "Le menu a été modifié avec succès.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le menu.",
        variant: "destructive",
      });
    }
  });

  const addProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product && !menuProducts.find(mp => mp.product_id === productId)) {
      setMenuProducts([...menuProducts, { 
        product_id: productId, 
        quantity: 1,
        product 
      }]);
    }
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    setMenuProducts(menuProducts.map(mp => 
      mp.product_id === productId ? { ...mp, quantity } : mp
    ));
  };

  const removeProduct = (productId: string) => {
    setMenuProducts(menuProducts.filter(mp => mp.product_id !== productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    if (menuProducts.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un produit au menu.",
        variant: "destructive",
      });
      return;
    }

    updateMenu.mutate();
  };

  if (!menu) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le menu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du menu *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Prix *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL de l'image</Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isAvailable"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Label htmlFor="isAvailable">Disponible</Label>
          </div>

          <div className="space-y-4">
            <Label>Composition du menu</Label>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {products?.map((product) => (
                  <Button
                    key={product.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addProduct(product.id)}
                    disabled={menuProducts.some(mp => mp.product_id === product.id)}
                    className="justify-start text-left"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {product.name} - {product.price}€
                  </Button>
                ))}
              </div>
            </div>

            {menuProducts.length > 0 && (
              <div className="space-y-2">
                <Label>Produits sélectionnés</Label>
                {menuProducts.map((menuProduct) => (
                  <Card key={menuProduct.product_id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{menuProduct.product?.name}</p>
                          <p className="text-sm text-gray-600">{menuProduct.product?.price}€</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="1"
                            value={menuProduct.quantity}
                            onChange={(e) => updateProductQuantity(
                              menuProduct.product_id, 
                              parseInt(e.target.value) || 1
                            )}
                            className="w-16"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeProduct(menuProduct.product_id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateMenu.isPending}>
              {updateMenu.isPending ? "Modification..." : "Modifier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
