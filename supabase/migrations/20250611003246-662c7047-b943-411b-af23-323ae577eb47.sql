
-- Créer un enum pour les statuts du personnel
CREATE TYPE public.staff_role AS ENUM ('cuisinier', 'gerant', 'serveur', 'superviseur');

-- Créer la table pour le personnel
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR UNIQUE,
  phone VARCHAR,
  role staff_role NOT NULL,
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer la table pour les paramètres du restaurant
CREATE TABLE public.restaurant_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_name VARCHAR NOT NULL DEFAULT 'RestauPOS',
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  currency_symbol VARCHAR(5) NOT NULL DEFAULT '€',
  address TEXT,
  phone VARCHAR,
  email VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insérer les paramètres par défaut
INSERT INTO public.restaurant_settings (restaurant_name, currency, currency_symbol) 
VALUES ('RestauPOS', 'EUR', '€');

-- Ajouter une colonne staff_id à la table orders pour affecter un serveur
ALTER TABLE public.orders ADD COLUMN staff_id UUID REFERENCES public.staff(id);

-- Créer la table pour les utilisateurs du système (authentification)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  staff_id UUID REFERENCES public.staff(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer des index pour améliorer les performances
CREATE INDEX idx_staff_role ON public.staff(role);
CREATE INDEX idx_staff_active ON public.staff(is_active);
CREATE INDEX idx_orders_staff_id ON public.orders(staff_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_staff_id ON public.users(staff_id);
