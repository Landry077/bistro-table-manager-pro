
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export const Settings = () => {
  const [restaurantName, setRestaurantName] = useState("");
  const [currency, setCurrency] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['restaurant-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (settings) {
      setRestaurantName(settings.restaurant_name || "");
      setCurrency(settings.currency || "");
      setCurrencySymbol(settings.currency_symbol || "");
      setAddress(settings.address || "");
      setPhone(settings.phone || "");
      setEmail(settings.email || "");
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('restaurant_settings')
        .update({
          restaurant_name: restaurantName,
          currency: currency,
          currency_symbol: currencySymbol,
          address: address || null,
          phone: phone || null,
          email: email || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] });
      toast({
        title: "Paramètres mis à jour",
        description: "Les paramètres du restaurant ont été sauvegardés.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim() || !currency.trim() || !currencySymbol.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du restaurant, la devise et le symbole sont obligatoires.",
        variant: "destructive",
      });
      return;
    }
    updateSettings.mutate();
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Paramètres du Restaurant</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restaurantName">Nom du Restaurant *</Label>
                <Input
                  id="restaurantName"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Nom du restaurant"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise *</Label>
                  <Input
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="EUR"
                    maxLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Symbole *</Label>
                  <Input
                    id="currencySymbol"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    placeholder="€"
                    maxLength={5}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse complète du restaurant"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@restaurant.com"
                />
              </div>
            </div>
            
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
