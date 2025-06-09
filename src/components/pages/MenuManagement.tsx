
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";

export const MenuManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
    queryKey: ['products', selectedCategory, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name, color)
        `)
        .order('name');

      if (selectedCategory !== "all") {
        query = query.eq('category_id', selectedCategory);
      }

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
          <h1 className="text-3xl font-bold text-gray-900">Menu & Produits</h1>
          <p className="text-gray-600 mt-1">Gérez votre carte et vos produits</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Catégorie
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Produit
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className={selectedCategory === "all" ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                Toutes
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? "bg-amber-600 hover:bg-amber-700" : ""}
                  style={{
                    borderColor: selectedCategory === category.id ? undefined : category.color,
                    color: selectedCategory === category.id ? undefined : category.color
                  }}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products?.map((product) => (
          <Card key={product.id} className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {product.name}
                  </CardTitle>
                  {product.categories && (
                    <Badge 
                      className="mt-2 text-white"
                      style={{ backgroundColor: product.categories.color }}
                    >
                      {product.categories.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <div className={`w-3 h-3 rounded-full ${product.is_available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Pas d'image</p>
                  </div>
                )}
              </div>
              
              {product.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-amber-600">{product.price}€</p>
                  {product.preparation_time > 0 && (
                    <p className="text-xs text-gray-500">{product.preparation_time} min</p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${product.is_available ? 'text-green-600' : 'text-red-600'}`}>
                  {product.is_available ? 'Disponible' : 'Indisponible'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!products || products.length === 0) && (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <p className="text-lg mb-2">Aucun produit trouvé</p>
              <p className="text-sm">
                {searchTerm || selectedCategory !== "all" 
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Commencez par ajouter votre premier produit"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
