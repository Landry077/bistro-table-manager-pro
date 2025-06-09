
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const TablesManagement = () => {
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tables, isLoading } = useQuery({
    queryKey: ['restaurant-tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number');
      
      if (error) throw error;
      return data;
    }
  });

  const updateTableStatus = useMutation({
    mutationFn: async ({ tableId, status }: { tableId: string; status: string }) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .update({ status })
        .eq('id', tableId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la table a été modifié avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la table.",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500 hover:bg-green-600';
      case 'occupied': return 'bg-red-500 hover:bg-red-600';
      case 'reserved': return 'bg-blue-500 hover:bg-blue-600';
      case 'cleaning': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Occupée';
      case 'reserved': return 'Réservée';
      case 'cleaning': return 'Nettoyage';
      default: return status;
    }
  };

  const handleStatusChange = (tableId: string, newStatus: string) => {
    updateTableStatus.mutate({ tableId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Chargement des tables...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Tables</h1>
          <p className="text-gray-600 mt-1">Gérez l'état et l'occupation de vos tables</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Table
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan des tables */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Plan du restaurant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 min-h-[500px] border-2 border-dashed border-gray-300">
                {tables?.map((table) => (
                  <div
                    key={table.id}
                    className={`absolute cursor-pointer transform transition-all duration-200 hover:scale-110 ${
                      selectedTable?.id === table.id ? 'ring-4 ring-amber-400' : ''
                    }`}
                    style={{
                      left: `${(table.position_x || 0) / 6}%`,
                      top: `${(table.position_y || 0) / 6}%`,
                    }}
                    onClick={() => setSelectedTable(table)}
                  >
                    <div className={`
                      w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold shadow-lg
                      ${getStatusColor(table.status)}
                    `}>
                      {table.table_number}
                    </div>
                    <div className="text-xs text-center mt-1 text-gray-600">
                      {table.capacity} pers.
                    </div>
                  </div>
                ))}
                
                {(!tables || tables.length === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <p className="text-lg mb-2">Aucune table configurée</p>
                      <p className="text-sm">Ajoutez votre première table pour commencer</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau de contrôle */}
        <div className="space-y-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedTable ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Table {selectedTable.table_number}</h3>
                    <p className="text-gray-600">{selectedTable.capacity} personnes</p>
                    <Badge className={`mt-2 ${getStatusColor(selectedTable.status)} text-white`}>
                      {getStatusText(selectedTable.status)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusChange(selectedTable.id, 'available')}
                      disabled={selectedTable.status === 'available'}
                    >
                      Marquer disponible
                    </Button>
                    
                    <Button 
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={() => handleStatusChange(selectedTable.id, 'occupied')}
                      disabled={selectedTable.status === 'occupied'}
                    >
                      Marquer occupée
                    </Button>
                    
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleStatusChange(selectedTable.id, 'reserved')}
                      disabled={selectedTable.status === 'reserved'}
                    >
                      Marquer réservée
                    </Button>
                    
                    <Button 
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                      onClick={() => handleStatusChange(selectedTable.id, 'cleaning')}
                      disabled={selectedTable.status === 'cleaning'}
                    >
                      En nettoyage
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Voir commandes
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier table
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Sélectionnez une table sur le plan pour voir les actions disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Légende</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">Disponible</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm">Occupée</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm">Réservée</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm">En nettoyage</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
