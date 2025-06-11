
-- Créer un enum pour les rôles utilisateur
CREATE TYPE public.user_role AS ENUM ('administrateur', 'superviseur', 'utilisateur');

-- Ajouter la colonne role à la table users
ALTER TABLE public.users ADD COLUMN role user_role DEFAULT 'utilisateur';

-- Insérer les utilisateurs demandés
INSERT INTO public.users (username, password_hash, role, is_active) VALUES 
('Admin', 'Admin360', 'administrateur', true),
('SupRestau', 'SupRestau', 'superviseur', true);

-- Créer un index pour améliorer les performances sur la colonne role
CREATE INDEX idx_users_role ON public.users(role);
