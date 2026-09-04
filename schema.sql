-- =========================================================
-- Schéma de base de données — Ateliers Crochet
-- À exécuter dans Supabase > SQL Editor (une seule fois)
-- =========================================================

create table types_ateliers (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  created_at timestamptz default now()
);

create table ateliers (
  id uuid primary key default gen_random_uuid(),
  type_atelier_id uuid references types_ateliers(id),
  billetweb_event_id text, -- id de l'événement côté Billetweb, pour faire le lien
  date date not null,
  heure_debut time,
  heure_fin time,
  lieu text,
  capacite_max int not null default 6,
  created_at timestamptz default now()
);

create table participantes (
  id uuid primary key default gen_random_uuid(),
  nom text,
  prenom text,
  email text,
  telephone text,
  supprimee boolean default false,
  created_at timestamptz default now()
);
create index idx_participantes_email on participantes(email);

create table inscriptions (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid references participantes(id) on delete cascade,
  atelier_id uuid references ateliers(id) on delete cascade,
  statut text not null default 'Inscrite'
    check (statut in ('Inscrite','Confirmée','Annulée','Présente','Absente')),
  couleur_choisie text,
  cookie_choisi text,
  photo_autorisee boolean,
  pelote_achetee boolean default false,
  rappel_envoye boolean default false,
  message_post_atelier_envoye boolean default false,
  whatsapp_envoye boolean default false,
  source_billetweb_id text unique, -- clé anti-doublon lors des synchros/imports
  date_inscription timestamptz default now(),
  created_at timestamptz default now()
);
create index idx_inscriptions_atelier on inscriptions(atelier_id);
create index idx_inscriptions_participante on inscriptions(participante_id);

-- Réponses de formulaire, structure libre : garde tout, même les futures questions
create table reponses_formulaire (
  id uuid primary key default gen_random_uuid(),
  inscription_id uuid references inscriptions(id) on delete cascade,
  question text not null,
  reponse text
);
create index idx_reponses_inscription on reponses_formulaire(inscription_id);

create table produits (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  unite text default 'unité',
  seuil_alerte int not null default 10,
  seuil_alerte_critique int not null default 5,
  created_at timestamptz default now()
);

-- Historique complet des mouvements de stock : jamais on n'écrase un chiffre,
-- le stock physique/réservé/disponible est toujours recalculé à partir d'ici.
create table mouvements_stock (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid references produits(id) on delete cascade,
  type text not null check (type in ('achat','ajustement','reservation','liberation','distribution')),
  quantite int not null, -- positif ou négatif selon le sens du mouvement
  inscription_id uuid references inscriptions(id) on delete set null,
  commentaire text,
  created_at timestamptz default now()
);
create index idx_mouvements_produit on mouvements_stock(produit_id);

-- Composition automatique de chaque type d'atelier (le "pack")
create table packs_ateliers (
  id uuid primary key default gen_random_uuid(),
  type_atelier_id uuid references types_ateliers(id) on delete cascade,
  produit_id uuid references produits(id) on delete cascade,
  quantite int not null default 1
);

create table messages_types (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('rappel','post_atelier','whatsapp')),
  sujet text,
  contenu text not null
);

create table envois_messages (
  id uuid primary key default gen_random_uuid(),
  inscription_id uuid references inscriptions(id) on delete cascade,
  type_message text not null check (type_message in ('rappel','post_atelier','whatsapp')),
  statut text not null default 'non_envoyé' check (statut in ('envoyé','non_envoyé')),
  date_envoi timestamptz
);
create index idx_envois_inscription on envois_messages(inscription_id);

create table parametres (
  cle text primary key,
  valeur text
);

insert into parametres (cle, valeur) values
  ('nom_activite', 'Mes Ateliers Crochet'),
  ('adresse_ateliers', ''),
  ('lien_whatsapp', ''),
  ('logo_url', '');

insert into messages_types (type, sujet, contenu) values
  ('rappel', 'Ton atelier crochet approche 🧶', 'Coucou {prenom} !

Petit rappel : ton atelier "{type_atelier}" a lieu {date} à {heure}, à {lieu}.

À très vite !'),
  ('post_atelier', 'Merci pour ce joli moment ✨', 'Merci encore {prenom} pour ce joli moment autour du crochet 🧶✨

Si tu souhaites continuer à échanger, partager tes créations, découvrir des bons plans et montrer tes futurs projets, tu peux rejoindre notre groupe WhatsApp 💕
{lien_whatsapp}'),
  ('whatsapp', 'Rejoins notre communauté 💕', 'Coucou {prenom},

Voici le lien pour rejoindre notre groupe WhatsApp et rester connectée à la communauté :
{lien_whatsapp}');

-- =========================================================
-- Vue pratique : stock physique / réservé / disponible par produit
-- =========================================================
create view v_stocks as
select
  p.id,
  p.nom,
  p.unite,
  p.seuil_alerte,
  p.seuil_alerte_critique,
  coalesce(sum(case when m.type in ('achat','ajustement') then m.quantite else 0 end), 0) as stock_physique_net,
  coalesce(sum(case when m.type = 'reservation' then m.quantite
                     when m.type = 'liberation' then -m.quantite
                     else 0 end), 0) as reserve,
  coalesce(sum(case when m.type = 'distribution' then m.quantite else 0 end), 0) as distribue
from produits p
left join mouvements_stock m on m.produit_id = p.id
group by p.id;
-- Stock physique réel  = stock_physique_net - distribue
-- Stock réservé        = reserve
-- Stock disponible     = (stock_physique_net - distribue) - reserve

-- =========================================================
-- Sécurité : Row Level Security (une seule utilisatrice connectée)
-- =========================================================
alter table participantes enable row level security;
alter table ateliers enable row level security;
alter table inscriptions enable row level security;
alter table reponses_formulaire enable row level security;
alter table produits enable row level security;
alter table mouvements_stock enable row level security;
alter table packs_ateliers enable row level security;
alter table types_ateliers enable row level security;
alter table messages_types enable row level security;
alter table envois_messages enable row level security;
alter table parametres enable row level security;

create policy "Utilisatrice connectée: tout accès" on participantes for all using (auth.role() = 'authenticated');
create policy "Utilisatrice connectée: tout accès" on ateliers for all using (auth.role() = 'authenticated');
create policy "Utilisatrice connectée: tout accès" on inscriptions for all using (auth.role() = 'authenticated');
create policy "Utilisatrice connectée: tout accès" on reponses_formulaire for all using (auth.role() = 'authenticated');
create policy "Utilisatrice connectée: tout accès" on produits for all using (auth.role() = 'authenticated');
create policy "Utilisatrice connectée: tout accès" on mouvements_stock for all using (auth.role() = 'authenticated');
create policy "Utilisatrice connectée: tout accès" on packs_ateliers for all using (auth.role() = 'authenticated');
create policy "Utilisatrice connectée: tout accès" on types_ateliers for all using (auth.role() = 'authenticated');
create policy "Utilisatrice connectée: tout accès" on messages_types for all using (auth.role() = 'authenticated');
create policy "Utilisatrice connectée: tout accès" on envois_messages for all using (auth.role() = 'authenticated');
create policy "Utilisatrice connectée: tout accès" on parametres for all using (auth.role() = 'authenticated');
