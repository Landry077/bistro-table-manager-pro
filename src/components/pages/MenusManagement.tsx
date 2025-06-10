
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { AddMenuDialog } from "@/components/menus/AddMenuDialog";
import { EditMenuDialog } from "@/components/menus/EditMenuDialog";
import { DeleteMenuDialog } from "@/components/menus/DeleteMenuDialog";

export const MenusManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [deletingMenu, setDeletingMenu] = useState<any>(null);

  const { data: menus } = useQuery({
    queryKey: ['menus', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('menus')
        .select(`
          *,
          menu_products(
            quantity,
            products(name, price)
          )
        `)
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Menus</h1>
          <p className="text-gray-600 mt-1">Créez et gérez vos menus composés</p>
        </div>
        <Button 
          className="bg-amber-600 hover:bg-amber-700"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Menu
        </Button>
      </div>

      {/* Recherche */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des menus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus?.map((menu) => (
          <Card key={menu.id} className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {menu.name}
                  </CardTitle>
                  <div className="flex items-center space-x-1 mt-2">
                    <div className={`w-3 h-3 rounded-full ${menu.is_available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${menu.is_available ? 'text-green-600' : 'text-red-600'}`}>
                      {menu.is_available ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                {menu.image_url ? (
                  <img 
                    src={menu.image_url} 
                    alt={menu.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Pas d'image</p>
                  </div>
                )}
              </div>
              
              {menu.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {menu.description}
                </p>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Composition:</p>
                <div className="space-y-1">
                  {menu.menu_products?.slice(0, 3).map((item: any, index: number) => (
                    <p key={index} className="text-xs text-gray-600">
                      {item.quantity}x {item.products?.name}
                    </p>
                  ))}
                  {menu.menu_products?.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{menu.menu_products.length - 3} autres produits
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-amber-600">{menu.price}€</p>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingMenu(menu)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeletingMenu(menu)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!menus || menus.length === 0) && (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <p className="text-lg mb-2">Aucun menu trouvé</p>
              <p className="text-sm">
                {searchTerm 
                  ? "Essayez de modifier votre recherche"
                  : "Commencez par créer votre premier menu"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddMenuDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
      
      <EditMenuDialog
        menu={editingMenu}
        open={!!editingMenu}
        onOpenChange={(open) => !open && setEditingMenu(null)}
      />
      
      <DeleteMenuDialog
        menu={deletingMenu}
        open={!!deletingMenu}
        onOpenChange={(open) => !open && setDeletingMenu(null)}
      />
    </div>
  );
};
