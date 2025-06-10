
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const StockManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [movementType, setMovementType] = useState<"restock" | "sale" | "adjustment">("restock");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ['products-with-stock', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          stock(*)
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

  const { data: stockMovements } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products(name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  const createStockMovement = useMutation({
    mutationFn: async () => {
      const product = products?.find(p => p.id === selectedProduct);
      if (!product) throw new Error("Produit non trouvé");

      const currentStock = product.stock?.[0]?.quantity_available || 0;
      const movementQuantity = parseInt(quantity);
      let newQuantity = currentStock;

      switch (movementType) {
        case "restock":
          newQuantity = currentStock + movementQuantity;
          break;
        case "sale":
          newQuantity = Math.max(0, currentStock - movementQuantity);
          break;
        case "adjustment":
          newQuantity = movementQuantity;
          break;
      }

      // Créer le mouvement de stock
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: selectedProduct,
          movement_type: movementType,
          quantity: movementType === "adjustment" ? newQuantity - currentStock : movementQuantity,
          previous_quantity: currentStock,
          new_quantity: newQuantity,
          notes: notes || undefined,
        });

      if (movementError) throw movementError;

      // Mettre à jour ou créer l'entrée de stock
      if (product.stock?.[0]) {
        const { error: updateError } = await supabase
          .from('stock')
          .update({
            quantity_available: newQuantity,
            last_restocked: movementType === "restock" ? new Date().toISOString() : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('product_id', selectedProduct);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('stock')
          .insert({
            product_id: selectedProduct,
            quantity_available: newQuantity,
            last_restocked: movementType === "restock" ? new Date().toISOString() : undefined,
          });

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-with-stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast({
        title: "Mouvement de stock enregistré",
        description: "Le mouvement de stock a été enregistré avec succès.",
      });
      setSelectedProduct("");
      setQuantity("");
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le mouvement de stock.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un produit et saisir une quantité.",
        variant: "destructive",
      });
      return;
    }
    createStockMovement.mutate();
  };

  const getStockStatus = (stock: any) => {
    if (!stock?.[0]) return { status: "unknown", color: "bg-gray-500" };
    
    const available = stock[0].quantity_available;
    const threshold = stock[0].minimum_threshold || 0;
    
    if (available === 0) return { status: "épuisé", color: "bg-red-500" };
    if (available <= threshold) return { status: "faible", color: "bg-orange-500" };
    return { status: "ok", color: "bg-green-500" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion du Stock</h1>
          <p className="text-gray-600 mt-1">Gérez l'approvisionnement et les mouvements de stock</p>
        </div>
      </div>

      {/* Formulaire de mouvement de stock */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Nouveau mouvement de stock</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Produit</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type de mouvement</Label>
                <Select value={movementType} onValueChange={(value: any) => setMovementType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restock">Réapprovisionnement</SelectItem>
                    <SelectItem value="sale">Vente</SelectItem>
                    <SelectItem value="adjustment">Ajustement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={movementType === "adjustment" ? "Nouvelle quantité" : "Quantité"}
                />
              </div>
              <div className="space-y-2 flex items-end">
                <Button type="submit" disabled={createStockMovement.isPending} className="w-full">
                  {createStockMovement.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes sur ce mouvement..."
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recherche */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* État du stock */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>État du stock</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Stock disponible</TableHead>
                <TableHead>Seuil minimum</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernier réapprovisionnement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4" />
                        <span>{product.stock?.[0]?.quantity_available || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.stock?.[0]?.minimum_threshold || 0}</TableCell>
                    <TableCell>
                      <Badge className={`${stockStatus.color} text-white`}>
                        {stockStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.stock?.[0]?.last_restocked 
                        ? new Date(product.stock[0].last_restocked).toLocaleDateString()
                        : "Jamais"
                      }
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Historique des mouvements */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Historique des mouvements récents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Stock avant</TableHead>
                <TableHead>Stock après</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockMovements?.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {new Date(movement.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{movement.products?.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {movement.movement_type === "restock" && <TrendingUp className="h-4 w-4 text-green-600" />}
                      {movement.movement_type === "sale" && <TrendingDown className="h-4 w-4 text-red-600" />}
                      {movement.movement_type === "adjustment" && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                      <span className="capitalize">{movement.movement_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={
                      movement.movement_type === "restock" ? "text-green-600" :
                      movement.movement_type === "sale" ? "text-red-600" : "text-orange-600"
                    }>
                      {movement.movement_type === "restock" ? "+" : movement.movement_type === "sale" ? "-" : ""}
                      {Math.abs(movement.quantity)}
                    </span>
                  </TableCell>
                  <TableCell>{movement.previous_quantity}</TableCell>
                  <TableCell>{movement.new_quantity}</TableCell>
                  <TableCell>{movement.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
