
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginProps {
  onLogin: () => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const login = useMutation({
    mutationFn: async () => {
      console.log("Tentative de connexion avec:", username, password);
      
      // Vérifier d'abord si l'utilisateur existe
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();
      
      console.log("Résultat de la requête utilisateur:", { user, error: userError });
      
      if (userError || !user) {
        throw new Error('Nom d\'utilisateur incorrect ou inexistant');
      }

      // Vérifier le mot de passe
      // Note: En production, il faudrait comparer avec un hash bcrypt
      // Pour le moment, on vérifie si c'est déjà hashé ou en clair
      const isPasswordCorrect = user.password_hash === password;
      
      if (!isPasswordCorrect) {
        throw new Error('Mot de passe incorrect');
      }

      // Mettre à jour la dernière connexion
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      return user;
    },
    onSuccess: (user) => {
      console.log("Connexion réussie pour:", user);
      
      // Stocker l'utilisateur dans le localStorage
      localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        username: user.username,
        role: user.role
      }));
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${user.username} !`,
      });
      
      onLogin();
    },
    onError: (error) => {
      console.error("Erreur de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre nom d'utilisateur.",
        variant: "destructive",
      });
      return;
    }
    
    if (!password.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre mot de passe.",
        variant: "destructive",
      });
      return;
    }
    
    login.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Coffee className="h-12 w-12 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-amber-900">RestauPOS</CardTitle>
          <p className="text-amber-700">Connexion au système de gestion</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre nom d'utilisateur"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700" 
              disabled={login.isPending}
            >
              {login.isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-amber-50 rounded-lg">
            <h3 className="font-semibold text-amber-800 mb-2">Comptes de test :</h3>
            <div className="text-sm text-amber-700 space-y-1">
              <div><strong>Admin</strong> / Admin360 (Administrateur)</div>
              <div><strong>SupRestau</strong> / SupRestau (Superviseur)</div>
            </div>
            <div className="mt-2 text-xs text-amber-600">
              Note: Les mots de passe sont stockés en clair pour cette démo. En production, ils seraient hashés avec bcrypt.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
